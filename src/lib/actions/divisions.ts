'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { Division } from '@/lib/data';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

// This function now fetches data from Firestore for the current user
export async function getDivisions(): Promise<Division[]> {
  if (!userId) return [];
  try {
    const divisionsCollection = collection(db, 'divisions');
    const q = query(divisionsCollection, where("userId", "==", userId));
    const divisionSnapshot = await getDocs(q);
    const divisionsList = divisionSnapshot.docs.map(doc => ({
      divisionId: doc.id,
      name: doc.data().name,
    }));
    return divisionsList;
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return [];
  }
}

const divisionSchema = z.object({
  name: z.string().min(1, { message: "Division name is required." }),
});

type DivisionFormValues = z.infer<typeof divisionSchema>;

// This function now adds a document to Firestore for the current user
export async function addDivisionAction(data: DivisionFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = divisionSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid division name.');
  }

  const { name } = validatedFields.data;
  
  try {
    await addDoc(collection(db, 'divisions'), {
      name: name,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add division.");
  }
  
  revalidatePath('/divisions');
  revalidatePath('/teams'); // Also revalidate teams page as it uses divisions

  return { success: true };
}
