

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { School } from '@/lib/data';
import { cache } from 'react';
import { getUserId } from '@/lib/auth';

// This function now fetches data from Firestore for the current user
export const getSchools = cache(async (): Promise<School[]> => {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const schoolsCollection = collection(db, 'schools');
    // Fetch all schools, assuming a single-organization context.
    const schoolSnapshot = await getDocs(schoolsCollection);
    const schoolsList = schoolSnapshot.docs.map(doc => ({
      schoolId: doc.id,
      ...doc.data(),
    } as School));
    return schoolsList;
  } catch (error) {
    console.error("Error fetching schools:", error);
    // Return empty array or handle error as needed
    return [];
  }
});

const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
  abbreviation: z.string().optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  brandColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
});


type SchoolFormValues = z.infer<typeof schoolSchema>;

// This function now adds a document to Firestore associated with the current user
export async function addSchoolAction(data: SchoolFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");

  const validatedFields = schoolSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid school name.');
  }
  
  try {
    await addDoc(collection(db, 'schools'), {
      ...validatedFields.data,
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


const updateSchoolSchema = schoolSchema.extend({
  schoolId: z.string(),
});

export async function updateSchoolAction(data: z.infer<typeof updateSchoolSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateSchoolSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid school data.');
    }
    
    const { schoolId, ...updateData } = validatedFields.data;
    const schoolDocRef = doc(db, 'schools', schoolId);

    // Verify ownership
    const schoolSnap = await getDoc(schoolDocRef);
    if (!schoolSnap.exists() || schoolSnap.data().userId !== userId) {
        throw new Error("School not found or you do not have permission to edit it.");
    }

    try {
        await updateDoc(schoolDocRef, updateData as { [key: string]: any });
    } catch (error) {
        console.error("Error updating school:", error);
        throw new Error("Could not update school.");
    }

    revalidatePath('/schools');
    revalidatePath('/teams');
}

export async function deleteSchoolAction(schoolId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  
  if (!schoolId) {
    throw new Error("School ID is required.");
  }
  
  const schoolDocRef = doc(db, 'schools', schoolId);

  const schoolSnap = await getDoc(schoolDocRef);
  if (!schoolSnap.exists() || schoolSnap.data().userId !== userId) {
    throw new Error("School not found or you do not have permission to delete it.");
  }
  
  try {
    await deleteDoc(schoolDocRef);
  } catch (error) {
    console.error("Error deleting school:", error);
    throw new Error("Could not delete school.");
  }

  revalidatePath('/schools');
  revalidatePath('/teams');
}
