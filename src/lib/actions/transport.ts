
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Vehicle, Person, TransportAssignment, FullTransportAssignment } from '@/lib/data';
import { getMatch, getMatches } from './matches';
import { getPerson } from './players';
import { cache } from 'react';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export const getVehicles = cache(async (): Promise<Vehicle[]> => {
  if (!userId) return [];
  try {
    const vehiclesCollection = collection(db, 'vehicles');
    const q = query(vehiclesCollection, where("userId", "==", userId));
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
});

const vehicleSchema = z.object({
  name: z.string().min(1, { message: "Vehicle name is required." }),
  type: z.enum(['Bus', 'Minibus', 'Van', 'Car'], { required_error: "Please select a type."}),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  registration: z.string().min(1, { message: "Registration is required." }),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export async function addVehicleAction(data: VehicleFormValues) {
  if (!userId) throw new Error("User not authenticated");
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
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateVehicleSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid vehicle data.');
    }

    const { vehicleId, ...updateData } = validatedFields.data;
    const vehicleDocRef = doc(db, 'vehicles', vehicleId);

    const vehicleSnap = await getDoc(vehicleDocRef);
    if (!vehicleSnap.exists() || vehicleSnap.data().userId !== userId) {
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
  if (!userId) throw new Error("User not authenticated");
  
  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }
  
  const vehicleDocRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleDocRef);
  if (!vehicleSnap.exists() || vehicleSnap.data().userId !== userId) {
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
export const getMatchTransportAssignments = cache(async (matchId: string): Promise<TransportAssignment[]> => {
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

      if (!vehicleSnap.exists() || vehicleSnap.data().userId !== userId) return null;
      if (!driverSnap.exists() || driverSnap.data().userId !== userId) return null;
      
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
});

export const getAllTransportAssignments = cache(async (): Promise<FullTransportAssignment[]> => {
    if (!userId) return [];
    
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
});

const transportAssignmentSchema = z.object({
  vehicleId: z.string({ required_error: "Please select a vehicle." }),
  driverId: z.string({ required_error: "Please select a driver." }),
});

export async function assignVehicleToMatchAction(matchId: string, data: z.infer<typeof transportAssignmentSchema>) {
  if (!userId) throw new Error("User not authenticated");
  const match = await getMatch(matchId);
  if (!match) throw new Error("Match not found or permission denied.");

  const validatedFields = transportAssignmentSchema.safeParse(data);
  if (!validatedFields.success) throw new Error('Invalid assignment data.');

  const { vehicleId, driverId } = validatedFields.data;
  
  const [vehicle, driver] = await Promise.all([
    getDoc(doc(db, 'vehicles', vehicleId)),
    getPerson(driverId),
  ]);
  
  if (!vehicle.exists() || vehicle.data()?.userId !== userId) throw new Error("Vehicle not found.");
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
    if (!userId) throw new Error("User not authenticated");
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");
    
    if (!assignmentId) throw new Error("Assignment ID is required.");

    try {
        await deleteDoc(doc(db, 'matches', matchId, 'transportAssignments', assignmentId));
    } catch (error) {
        console.error("Error removing transport assignment:", error);
        throw new Error("Could not remove transport assignment.");
    }
    revalidatePath(`/matches/${matchId}`);
}
