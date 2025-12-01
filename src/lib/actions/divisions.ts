
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Division } from '@/lib/data';
import { cache } from 'react';
import { getPerson } from './players';
import { getUserId } from '@/lib/server-auth';

const checkManagementPermission = async (userId: string) => {
    if (userId === 'TEMP_ADMIN') return;
    const user = await getPerson(userId);
    if (!user || !user.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r))) {
        throw new Error("You do not have permission to manage divisions.");
    }
}

const getDivisionRank = (divisionName: string): number => {
    if (divisionName.toLowerCase() === 'open') return 100;
    const match = divisionName.match(/u(\d+)/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0; // Fallback for any other format
};


// This function now fetches data from Firestore for the current user
export async function getDivisions(): Promise<Division[]> {
  try {
    const divisionsCollection = collection(db, 'divisions');
    const q = query(divisionsCollection);
    const divisionSnapshot = await getDocs(q);
    const divisionsList = divisionSnapshot.docs.map(doc => ({
      divisionId: doc.id,
      name: doc.data().name,
    }));
    
    // Sort divisions logically: Open, then descending by age group
    divisionsList.sort((a, b) => getDivisionRank(b.name) - getDivisionRank(a.name));

    return divisionsList;
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return [];
  }
}

export const getDivision = cache(async (divisionId: string): Promise<Division | null> => {
  try {
    const divisionDocRef = doc(db, 'divisions', divisionId);
    const divisionSnap = await getDoc(divisionDocRef);
    if (!divisionSnap.exists()) {
      return null;
    }
    return {
      divisionId: divisionSnap.id,
      name: divisionSnap.data().name,
    };
  } catch (error) {
    console.error(`Error fetching division with ID ${divisionId}:`, error);
    return null;
  }
});

const divisionSchema = z.object({
  name: z.string().min(1, { message: "Division name is required." }),
});

type DivisionFormValues = z.infer<typeof divisionSchema>;

// This function now adds a document to Firestore for the current user
export async function addDivisionAction(data: DivisionFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = divisionSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid division name.');
  }

  const { name } = validatedFields.data;
  
  try {
    await addDoc(collection(db, 'divisions'), {
      name: name,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add division.");
  }
  
  revalidatePath('/divisions');
  revalidatePath('/teams'); // Also revalidate teams page as it uses divisions

  return { success: true };
}


const updateDivisionSchema = z.object({
  divisionId: z.string(),
  name: z.string().min(1, { message: "Division name is required." }),
});

export async function updateDivisionAction(data: z.infer<typeof updateDivisionSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateDivisionSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid division data.');
    }

    const { divisionId, name } = validatedFields.data;
    const divisionDocRef = doc(db, 'divisions', divisionId);

    // Verify ownership
    const divisionSnap = await getDoc(divisionDocRef);
    if (!divisionSnap.exists()) {
        throw new Error("Division not found or you do not have permission to edit it.");
    }

    try {
        await updateDoc(divisionDocRef, { name });
    } catch (error) {
        console.error("Error updating division:", error);
        throw new Error("Could not update division.");
    }

    revalidatePath('/divisions');
    revalidatePath('/teams');
}

export async function deleteDivisionAction(divisionId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  
  if (!divisionId) {
    throw new Error("Division ID is required.");
  }
  
  const divisionDocRef = doc(db, 'divisions', divisionId);

  const divisionSnap = await getDoc(divisionDocRef);
  if (!divisionSnap.exists()) {
    throw new Error("Division not found or you do not have permission to delete it.");
  }
  
  // In a real app, you would check for associated teams before deleting
  
  try {
    await deleteDoc(divisionDocRef);
  } catch (error) {
    console.error("Error deleting division:", error);
    throw new Error("Could not delete division.");
  }

  revalidatePath('/divisions');
  revalidatePath('/teams');
}
