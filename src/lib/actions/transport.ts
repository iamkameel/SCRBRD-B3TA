'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Vehicle } from '@/lib/data';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getVehicles(): Promise<Vehicle[]> {
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
}

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
