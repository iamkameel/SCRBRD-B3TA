

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, collectionGroup } from 'firebase/firestore';
import type { Vehicle, Person, TransportAssignment, FullTransportAssignment } from '@/lib/data';
import { getMatch, getMatches } from './matches';
import { getPerson } from './players';
import { cache } from 'react';
import { getUserId } from '@/lib/server-auth';
import { isTeamManagerOrAdmin } from './teams';

const checkManagementPermission = async (userId: string) => {
    if (userId === 'TEMP_ADMIN') return;
    const user = await getPerson(userId);
    if (!user || !user.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r))) {
        throw new Error("You do not have permission to manage the transport fleet.");
    }
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const vehiclesCollection = collection(db, 'vehicles');
    const q = query(vehiclesCollection);
    const vehicleSnapshot = await getDocs(q);
    const vehiclesList = vehicleSnapshot.docs.map(doc => ({
      vehicleId: doc.id,
      ...doc.data()
    } as Vehicle));
    return vehiclesList;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

const vehicleSchema = z.object({
  name: z.string().min(1, { message: "Vehicle name is required." }),
  type: z.enum(['Bus', 'Minibus', 'Van', 'Car'], { required_error: "Please select a type."}),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  registration: z.string().min(1, { message: "Registration is required." }),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export async function addVehicleAction(data: VehicleFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = vehicleSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid vehicle data.');
  }

  const { name, type, capacity, registration } = validatedFields.data;

  try {
    await addDoc(collection(db, 'vehicles'), {
      name,
      type,
      capacity,
      registration,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding vehicle: ", error);
    throw new Error("Could not add vehicle.");
  }
  
  revalidatePath('/transport');
}

const updateVehicleSchema = vehicleSchema.extend({
  vehicleId: z.string(),
});

export async function updateVehicleAction(data: z.infer<typeof updateVehicleSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateVehicleSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid vehicle data.');
    }

    const { vehicleId, ...updateData } = validatedFields.data;
    const vehicleDocRef = doc(db, 'vehicles', vehicleId);

    const vehicleSnap = await getDoc(vehicleDocRef);
    if (!vehicleSnap.exists()) {
        throw new Error("Vehicle not found or you do not have permission to edit it.");
    }

    try {
        await updateDoc(vehicleDocRef, updateData);
    } catch (error) {
        console.error("Error updating vehicle:", error);
        throw new Error("Could not update vehicle.");
    }

    revalidatePath('/transport');
}

export async function deleteVehicleAction(vehicleId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  
  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }
  
  const vehicleDocRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleDocRef);
  if (!vehicleSnap.exists()) {
    throw new Error("Vehicle not found or you do not have permission to delete it.");
  }
  
  try {
    await deleteDoc(vehicleDocRef);
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw new Error("Could not delete vehicle.");
  }

  revalidatePath('/transport');
}

// TRANSPORT ASSIGNMENT ACTIONS
export async function getMatchTransportAssignments(matchId: string): Promise<TransportAssignment[]> {
  const match = await getMatch(matchId);
  if (!match) return [];

  try {
    const assignmentsCol = collection(db, 'matches', matchId, 'transportAssignments');
    const assignmentsSnapshot = await getDocs(assignmentsCol);

    const assignmentsPromises = assignmentsSnapshot.docs.map(async (assignDoc) => {
      const assignData = assignDoc.data();
      const [vehicleSnap, driverSnap] = await Promise.all([
        getDoc(doc(db, 'vehicles', assignData.vehicleId)),
        getDoc(doc(db, 'people', assignData.driverId)),
      ]);

      if (!vehicleSnap.exists() || !driverSnap.exists()) return null;
      
      const vehicleData = vehicleSnap.data() as Omit<Vehicle, 'vehicleId'>;
      const driverData = driverSnap.data() as Omit<Person, 'personId'>;
      
      return {
        assignmentId: assignDoc.id,
        vehicleId: assignData.vehicleId,
        vehicleName: vehicleData.name,
        vehicleType: vehicleData.type,
        driverId: assignData.driverId,
        driverName: `${driverData.firstName} ${driverData.lastName}`,
      };
    });

    return (await Promise.all(assignmentsPromises)).filter((a): a is TransportAssignment => a !== null);
  } catch (error) {
    console.error(`Error fetching transport assignments for match ${matchId}:`, error);
    return [];
  }
}

export async function getAllTransportAssignments(): Promise<FullTransportAssignment[]> {
    const allMatches = await getMatches();
    const allAssignments: FullTransportAssignment[] = [];
    
    for (const match of allMatches) {
        const assignments = await getMatchTransportAssignments(match.matchId);
        for (const assignment of assignments) {
            allAssignments.push({
                ...assignment,
                matchId: match.matchId,
                matchName: `${match.teamAName} vs ${match.teamBName}`,
                dateTime: match.dateTime,
            });
        }
    }
    
    return allAssignments.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
}

export async function getAssignmentsForDriver(personId: string): Promise<FullTransportAssignment[]> {
    const userId = await getUserId();
    if (!userId || !personId) return [];
    try {
        const assignmentsQuery = query(collectionGroup(db, 'transportAssignments'), where("driverId", "==", personId));
        const snapshot = await getDocs(assignmentsQuery);
        if (snapshot.empty) return [];

        const assignmentsPromises = snapshot.docs.map(async (docSnap) => {
            const assignmentData = docSnap.data();
            const matchRef = docSnap.ref.parent.parent;
            if (!matchRef) return null;

            const match = await getMatch(matchRef.id);
            if (!match || match.status !== 'scheduled') return null;

            const vehicleSnap = await getDoc(doc(db, 'vehicles', assignmentData.vehicleId));
            if (!vehicleSnap.exists()) return null;

            const driver = await getPerson(personId);
            if (!driver) return null;
            
            return {
                assignmentId: docSnap.id,
                matchId: match.matchId,
                matchName: `${match.teamAName} vs ${match.teamBName}`,
                dateTime: match.dateTime,
                vehicleId: assignmentData.vehicleId,
                vehicleName: vehicleSnap.data().name,
                vehicleType: vehicleSnap.data().type,
                driverId: personId,
                driverName: `${driver.firstName} ${driver.lastName}`
            };
        });
        const results = (await Promise.all(assignmentsPromises)).filter((a): a is FullTransportAssignment => a !== null);
        return results.sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());
    } catch(error) {
        console.error("Error fetching driver assignments:", error);
        return [];
    }
}


const transportAssignmentSchema = z.object({
  vehicleId: z.string({ required_error: "Please select a vehicle." }),
  driverId: z.string({ required_error: "Please select a driver." }),
});

export async function assignVehicleToMatchAction(matchId: string, data: z.infer<typeof transportAssignmentSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  const match = await getMatch(matchId);
  if (!match) throw new Error("Match not found or permission denied.");

  const [isManagerForA, isManagerForB] = await Promise.all([
      isTeamManagerOrAdmin(match.teamAId, userId),
      match.teamBId ? isTeamManagerOrAdmin(match.teamBId, userId) : Promise.resolve(false)
  ]);
  if (!isManagerForA && !isManagerForB) {
    throw new Error("You do not have permission to manage transport for this match.");
  }

  const validatedFields = transportAssignmentSchema.safeParse(data);
  if (!validatedFields.success) throw new Error('Invalid assignment data.');

  const { vehicleId, driverId } = validatedFields.data;
  
  const [vehicle, driver] = await Promise.all([
    getDoc(doc(db, 'vehicles', vehicleId)),
    getPerson(driverId),
  ]);
  
  if (!vehicle.exists()) throw new Error("Vehicle not found.");
  if (!driver || !driver.roles.includes('Driver')) throw new Error("Person is not a valid driver.");

  const assignmentsCol = collection(db, 'matches', matchId, 'transportAssignments');
  const vehicleQuery = query(assignmentsCol, where("vehicleId", "==", vehicleId));
  const driverQuery = query(assignmentsCol, where("driverId", "==", driverId));
  const [existingVehicle, existingDriver] = await Promise.all([getDocs(vehicleQuery), getDocs(driverQuery)]);
  
  if (!existingVehicle.empty) throw new Error("This vehicle is already assigned to the match.");
  if (!existingDriver.empty) throw new Error("This driver is already assigned to the match.");

  try {
    await addDoc(assignmentsCol, { vehicleId, driverId });
  } catch (error) {
    console.error("Error assigning vehicle to match:", error);
    throw new Error("Could not assign vehicle to match.");
  }
  revalidatePath(`/matches/${matchId}`);
}

export async function removeVehicleFromMatchAction(matchId: string, assignmentId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");
    
    const [isManagerForA, isManagerForB] = await Promise.all([
        isTeamManagerOrAdmin(match.teamAId, userId),
        match.teamBId ? isTeamManagerOrAdmin(match.teamBId, userId) : Promise.resolve(false)
    ]);
    if (!isManagerForA && !isManagerForB) {
        throw new Error("You do not have permission to manage transport for this match.");
    }
    
    if (!assignmentId) throw new Error("Assignment ID is required.");

    try {
        await deleteDoc(doc(db, 'matches', matchId, 'transportAssignments', assignmentId));
    } catch (error) {
        console.error("Error removing transport assignment:", error);
        throw new Error("Could not remove transport assignment.");
    }
    revalidatePath(`/matches/${matchId}`);
}
