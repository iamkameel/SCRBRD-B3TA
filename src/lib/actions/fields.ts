'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Field } from '@/lib/data';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

// This function now fetches data from Firestore for the current user
export async function getFields(): Promise<Field[]> {
  if (!userId) return [];
  try {
    const fieldsCollection = collection(db, 'fields');
    const q = query(fieldsCollection, where("userId", "==", userId));
    const fieldSnapshot = await getDocs(q);
    const fieldsList = fieldSnapshot.docs.map(doc => ({
      fieldId: doc.id,
      name: doc.data().name,
      surfaceType: doc.data().surfaceType,
      facilities: doc.data().facilities,
    }));
    return fieldsList;
  } catch (error) {
    console.error("Error fetching fields:", error);
    return [];
  }
}

const fieldSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  surfaceType: z.string().optional(),
  facilities: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

// This function now adds a document to Firestore for the current user
export async function addFieldAction(data: FieldFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = fieldSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid field data.');
  }

  const { name, surfaceType, facilities } = validatedFields.data;

  try {
    await addDoc(collection(db, 'fields'), {
      name,
      surfaceType: surfaceType || "",
      facilities: facilities || "",
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add field.");
  }
  
  revalidatePath('/fields');
  revalidatePath('/new-match'); // Also revalidate new match page as it uses fields

  return { success: true };
}


const updateFieldSchema = z.object({
  fieldId: z.string(),
  name: z.string().min(1, { message: "Field name is required." }),
  surfaceType: z.string().optional(),
  facilities: z.string().optional(),
});

export async function updateFieldAction(data: z.infer<typeof updateFieldSchema>) {
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateFieldSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid field data.');
    }

    const { fieldId, name, surfaceType, facilities } = validatedFields.data;
    const fieldDocRef = doc(db, 'fields', fieldId);

    const fieldSnap = await getDoc(fieldDocRef);
    if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) {
        throw new Error("Field not found or you do not have permission to edit it.");
    }

    try {
        await updateDoc(fieldDocRef, { name, surfaceType, facilities });
    } catch (error) {
        console.error("Error updating field:", error);
        throw new Error("Could not update field.");
    }

    revalidatePath('/fields');
    revalidatePath('/new-match');
}

export async function deleteFieldAction(fieldId: string) {
  if (!userId) throw new Error("User not authenticated");
  
  if (!fieldId) {
    throw new Error("Field ID is required.");
  }
  
  const fieldDocRef = doc(db, 'fields', fieldId);
  const fieldSnap = await getDoc(fieldDocRef);
  if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) {
    throw new Error("Field not found or you do not have permission to delete it.");
  }
  
  try {
    await deleteDoc(fieldDocRef);
  } catch (error) {
    console.error("Error deleting field:", error);
    throw new Error("Could not delete field.");
  }

  revalidatePath('/fields');
  revalidatePath('/new-match');
}
