
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { School } from '@/lib/data';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

// This function now fetches data from Firestore for the current user
export async function getSchools(): Promise<School[]> {
  if (!userId) return [];
  try {
    const schoolsCollection = collection(db, 'schools');
    const q = query(schoolsCollection, where("userId", "==", userId));
    const schoolSnapshot = await getDocs(q);
    const schoolsList = schoolSnapshot.docs.map(doc => ({
      schoolId: doc.id,
      name: doc.data().name,
    }));
    return schoolsList;
  } catch (error) {
    console.error("Error fetching schools:", error);
    // Return empty array or handle error as needed
    return [];
  }
}

const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

// This function now adds a document to Firestore associated with the current user
export async function addSchoolAction(data: SchoolFormValues) {
  if (!userId) throw new Error("User not authenticated");

  const validatedFields = schoolSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid school name.');
  }

  const { name } = validatedFields.data;

  try {
    await addDoc(collection(db, 'schools'), {
      name: name,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add school.");
  }
  
  revalidatePath('/schools');
  revalidatePath('/teams'); // Also revalidate teams page as it uses schools
  
  return { success: true };
}
