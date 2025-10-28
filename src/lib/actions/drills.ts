
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Drill } from '@/lib/data';
import { cache } from 'react';
import { getPerson } from './players';
import { getUserId } from '@/lib/server-auth';

export async function getDrills(): Promise<Drill[]> {
    // Drills are considered a shared resource for now, visible to all authenticated users.
    // A check for `userId` could be added here if drills should be private.
    try {
        const snapshot = await getDocs(collection(db, 'drills'));
        const drills = snapshot.docs.map(doc => ({
            drillId: doc.id,
            ...doc.data()
        } as Drill));
        return drills.sort((a,b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching drills:", error);
        return [];
    }
}

const drillSchema = z.object({
    name: z.string().min(1, { message: "Drill name is required." }),
    description: z.string().min(1, { message: "Description is required." }),
    category: z.enum(['Batting', 'Bowling', 'Fielding', 'Fitness', 'Tactical']),
    duration: z.coerce.number().int().min(1, { message: "Duration must be at least 1 minute." }),
});

const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || !user.roles.some(r => ['Admin', 'Sportsmaster', 'Coach'].includes(r))) {
        throw new Error("You do not have permission to manage drills.");
    }
}

export async function addDrillAction(data: z.infer<typeof drillSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");
    await checkManagementPermission(userId);

    const validatedFields = drillSchema.safeParse(data);
    if (!validatedFields.success) {
        throw new Error("Invalid drill data.");
    }

    try {
        await addDoc(collection(db, 'drills'), {
            ...validatedFields.data,
            userId, // The creator of the drill
        });
    } catch (error) {
        console.error("Error adding drill:", error);
        throw new Error("Could not add drill.");
    }

    revalidatePath('/drills');
}


const updateDrillSchema = drillSchema.extend({ drillId: z.string() });
export async function updateDrillAction(data: z.infer<typeof updateDrillSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);

    const validatedFields = updateDrillSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid drill data.');
    }

    const { drillId, ...updateData } = validatedFields.data;
    const drillDocRef = doc(db, 'drills', drillId);

    // Optional: Could add a check to see if the current user is the original creator.
    // For now, any authorized role can edit any drill.

    try {
        await updateDoc(drillDocRef, updateData);
    } catch (error) {
        console.error("Error updating drill:", error);
        throw new Error("Could not update drill.");
    }

    revalidatePath('/drills');
}

export async function deleteDrillAction(drillId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  
  if (!drillId) {
    throw new Error("Drill ID is required.");
  }
  
  const drillDocRef = doc(db, 'drills', drillId);
  const drillSnap = await getDoc(drillDocRef);
  if (!drillSnap.exists()) {
    throw new Error("Drill not found.");
  }
  
  try {
    await deleteDoc(drillDocRef);
  } catch (error) {
    console.error("Error deleting drill:", error);
    throw new Error("Could not delete drill.");
  }

  revalidatePath('/drills');
}
