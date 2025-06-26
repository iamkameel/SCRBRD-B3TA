
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Field, FieldAssignment, Person } from '@/lib/data';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getFields(): Promise<Field[]> {
  if (!userId) return [];
  try {
    const fieldsCollection = collection(db, 'fields');
    const q = query(fieldsCollection, where("userId", "==", userId));
    const fieldSnapshot = await getDocs(q);

    const fieldsList = await Promise.all(fieldSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const field: Field = {
        fieldId: docSnapshot.id,
        name: data.name,
        surfaceType: data.surfaceType,
        facilities: data.facilities,
        status: data.status,
        assignments: [],
      };

      const assignmentsCol = collection(db, 'fields', docSnapshot.id, 'assignments');
      const assignmentsSnapshot = await getDocs(assignmentsCol);

      const assignmentsPromises = assignmentsSnapshot.docs.map(async (assignDoc) => {
        const assignData = assignDoc.data();
        const personSnap = await getDoc(doc(db, 'people', assignData.personId));
        if (personSnap.exists()) {
          const personData = personSnap.data() as Omit<Person, 'personId'>;
          return {
            assignmentId: assignDoc.id,
            personId: assignData.personId,
            personName: `${personData.firstName} ${personData.lastName}`,
          };
        }
        return null;
      });
      
      field.assignments = (await Promise.all(assignmentsPromises)).filter((a): a is FieldAssignment => a !== null);
      
      return field;
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
  status: z.enum(['Available', 'Maintenance', 'Closed']).default('Available'),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

export async function addFieldAction(data: FieldFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = fieldSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid field data.');
  }

  const { name, surfaceType, facilities, status } = validatedFields.data;

  try {
    await addDoc(collection(db, 'fields'), {
      name,
      surfaceType: surfaceType || "",
      facilities: facilities || "",
      status,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add field.");
  }
  
  revalidatePath('/fields');
  revalidatePath('/new-match');
}

const updateFieldSchema = fieldSchema.extend({
  fieldId: z.string(),
});

export async function updateFieldAction(data: z.infer<typeof updateFieldSchema>) {
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateFieldSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid field data.');
    }

    const { fieldId, ...updateData } = validatedFields.data;
    const fieldDocRef = doc(db, 'fields', fieldId);

    const fieldSnap = await getDoc(fieldDocRef);
    if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) {
        throw new Error("Field not found or you do not have permission to edit it.");
    }

    try {
        await updateDoc(fieldDocRef, updateData);
    } catch (error) {
        console.error("Error updating field:", error);
        throw new Error("Could not update field.");
    }

    revalidatePath('/fields');
    revalidatePath('/new-match');
}

export async function deleteFieldAction(fieldId: string) {
  if (!userId) throw new Error("User not authenticated");
  
  if (!fieldId) throw new Error("Field ID is required.");
  
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

export async function assignGroundskeeperToFieldAction(fieldId: string, personId: string) {
    if (!userId) throw new Error("User not authenticated");
    if (!fieldId || !personId) throw new Error("Field ID and Person ID are required.");

    const fieldRef = doc(db, 'fields', fieldId);
    const personRef = doc(db, 'people', personId);
    const [fieldSnap, personSnap] = await Promise.all([getDoc(fieldRef), getDoc(personRef)]);

    if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) throw new Error("Field not found.");
    if (!personSnap.exists() || personSnap.data().userId !== userId) throw new Error("Person not found.");
    if (!personSnap.data().roles.includes('Grounds-Keeper')) throw new Error("This person is not a grounds-keeper.");

    const assignmentsCol = collection(db, 'fields', fieldId, 'assignments');
    const q = query(assignmentsCol, where("personId", "==", personId));
    const existing = await getDocs(q);

    if (!existing.empty) throw new Error("This person is already assigned to this field.");

    try {
        await addDoc(assignmentsCol, { personId });
    } catch (error) {
        console.error("Error assigning grounds-keeper:", error);
        throw new Error("Could not assign grounds-keeper.");
    }

    revalidatePath('/fields');
}

export async function removeGroundskeeperFromFieldAction(fieldId: string, assignmentId: string) {
    if (!userId) throw new Error("User not authenticated");
    if (!fieldId || !assignmentId) throw new Error("Field ID and Assignment ID are required.");

    const fieldRef = doc(db, 'fields', fieldId);
    const fieldSnap = await getDoc(fieldRef);
    if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) throw new Error("Field not found.");

    try {
        await deleteDoc(doc(db, 'fields', fieldId, 'assignments', assignmentId));
    } catch (error) {
        console.error("Error removing assignment:", error);
        throw new Error("Could not remove assignment.");
    }

    revalidatePath('/fields');
}
