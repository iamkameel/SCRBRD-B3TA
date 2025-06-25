
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import type { School } from '@/lib/data';

// This function now fetches data from Firestore
export async function getSchools(): Promise<School[]> {
  try {
    const schoolsCollection = collection(db, 'schools');
    const schoolSnapshot = await getDocs(schoolsCollection);
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

// This function now adds a document to Firestore
export async function addSchoolAction(data: SchoolFormValues) {
  const validatedFields = schoolSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid school name.');
  }

  const { name } = validatedFields.data;

  try {
    await addDoc(collection(db, 'schools'), {
      name: name,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add school.");
  }
  
  revalidatePath('/schools');
  revalidatePath('/teams'); // Also revalidate teams page as it uses schools
  
  return { success: true };
}
