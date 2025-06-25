'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import type { Division } from '@/lib/data';

// This function now fetches data from Firestore
export async function getDivisions(): Promise<Division[]> {
  try {
    const divisionsCollection = collection(db, 'divisions');
    const divisionSnapshot = await getDocs(divisionsCollection);
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

// This function now adds a document to Firestore
export async function addDivisionAction(data: DivisionFormValues) {
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
