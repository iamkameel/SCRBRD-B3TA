'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import type { Field } from '@/lib/data';

// This function now fetches data from Firestore
export async function getFields(): Promise<Field[]> {
  try {
    const fieldsCollection = collection(db, 'fields');
    const fieldSnapshot = await getDocs(fieldsCollection);
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

// This function now adds a document to Firestore
export async function addFieldAction(data: FieldFormValues) {
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
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add field.");
  }
  
  revalidatePath('/fields');
  revalidatePath('/new-match'); // Also revalidate new match page as it uses fields

  return { success: true };
}
