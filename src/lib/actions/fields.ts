

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
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
        schoolId: data.schoolId,
        schoolName: data.schoolName,
        pitchType: data.pitchType,
        facilities: data.facilities,
        status: data.status,
        assignments: [],
        location: data.location,
        size: data.size,
        amenities: data.amenities,
        alias: data.alias,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        notes: data.notes,
        coordinates: data.coordinates,
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

export async function getField(fieldId: string): Promise<Field | null> {
  if (!userId) return null;
  try {
    const fieldDocRef = doc(db, 'fields', fieldId);
    const fieldSnap = await getDoc(fieldDocRef);

    if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) {
      return null;
    }

    const data = fieldSnap.data();
    const field: Field = {
      fieldId: fieldSnap.id,
      name: data.name,
      schoolId: data.schoolId,
      schoolName: data.schoolName,
      pitchType: data.pitchType,
      facilities: data.facilities,
      status: data.status,
      assignments: [],
      location: data.location,
      size: data.size,
      amenities: data.amenities,
      alias: data.alias,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      notes: data.notes,
      coordinates: data.coordinates,
    };

    const assignmentsCol = collection(db, 'fields', fieldId, 'assignments');
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

  } catch (error) {
    console.error(`Error fetching field with ID ${fieldId}:`, error);
    return null;
  }
}


const fieldActionSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  schoolId: z.string().optional(),
  status: z.enum(['Available', 'Maintenance', 'Closed']).default('Available'),
  pitchType: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  assignments: z.array(z.string()).optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  alias: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  coordinates: z.object({
      lat: z.coerce.number().min(-90).max(90).optional(),
      lon: z.coerce.number().min(-180).max(180).optional(),
  }).optional(),
});

type FieldFormValues = z.infer<typeof fieldActionSchema>;

async function syncAssignments(batch: FirebaseFirestore.WriteBatch, fieldId: string, personIds: string[] = []) {
    const assignmentsCol = collection(db, 'fields', fieldId, 'assignments');
    const currentAssignmentsSnap = await getDocs(assignmentsCol);
    const currentPersonIds = new Set(currentAssignmentsSnap.docs.map(d => d.data().personId));
    const newPersonIds = new Set(personIds);

    // Delete assignments that are no longer needed
    for (const doc of currentAssignmentsSnap.docs) {
        if (!newPersonIds.has(doc.data().personId)) {
            batch.delete(doc.ref);
        }
    }

    // Add new assignments
    for (const personId of personIds) {
        if (!currentPersonIds.has(personId)) {
            const newAssignmentRef = doc(collection(db, 'fields', fieldId, 'assignments'));
            batch.set(newAssignmentRef, { personId });
        }
    }
}

export async function addFieldAction(data: FieldFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = fieldActionSchema.safeParse(data);

  if (!validatedFields.success) throw new Error('Invalid field data.');
  
  const { assignments, coordinates, ...fieldData } = validatedFields.data;
  
  let schoolName = '';
  if (fieldData.schoolId) {
      const schoolSnap = await getDoc(doc(db, 'schools', fieldData.schoolId));
      if (!schoolSnap.exists() || schoolSnap.data().userId !== userId) throw new Error("Selected school not found.");
      schoolName = schoolSnap.data().name;
  }
  
  const batch = writeBatch(db);
  const newFieldRef = doc(collection(db, 'fields'));

  batch.set(newFieldRef, {
      ...fieldData,
      schoolId: fieldData.schoolId === ' ' ? '' : fieldData.schoolId,
      schoolName: schoolName || null,
      coordinates: (coordinates && coordinates.lat && coordinates.lon) ? coordinates : null,
      userId: userId,
  });

  await syncAssignments(batch, newFieldRef.id, assignments);

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error adding document and assignments: ", error);
    throw new Error("Could not add field.");
  }
  
  revalidatePath('/fields');
  revalidatePath('/new-match');
}

const updateFieldSchema = fieldActionSchema.extend({
  fieldId: z.string(),
});

export async function updateFieldAction(data: z.infer<typeof updateFieldSchema>) {
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateFieldSchema.safeParse(data);

    if (!validatedFields.success) throw new Error('Invalid field data.');

    const { fieldId, assignments, coordinates, ...updateData } = validatedFields.data;
    const fieldDocRef = doc(db, 'fields', fieldId);

    const fieldSnap = await getDoc(fieldDocRef);
    if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) {
        throw new Error("Field not found or you do not have permission to edit it.");
    }
    
    let schoolName = '';
    if (updateData.schoolId && updateData.schoolId !== ' ') {
        const schoolSnap = await getDoc(doc(db, 'schools', updateData.schoolId));
        if (!schoolSnap.exists() || schoolSnap.data().userId !== userId) throw new Error("Selected school not found.");
        schoolName = schoolSnap.data().name;
    }
    
    const batch = writeBatch(db);
    batch.update(fieldDocRef, {
        ...updateData,
        schoolId: updateData.schoolId === ' ' ? '' : updateData.schoolId,
        schoolName: schoolName || null,
        coordinates: (coordinates && coordinates.lat && coordinates.lon) ? coordinates : null,
    });

    await syncAssignments(batch, fieldId, assignments);

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error updating field and assignments:", error);
        throw new Error("Could not update field.");
    }

    revalidatePath('/fields');
    revalidatePath('/new-match');
    revalidatePath(`/fields/${fieldId}`);
}

export async function deleteFieldAction(fieldId: string) {
  if (!userId) throw new Error("User not authenticated");
  
  if (!fieldId) throw new Error("Field ID is required.");
  
  const fieldDocRef = doc(db, 'fields', fieldId);
  const fieldSnap = await getDoc(fieldDocRef);
  if (!fieldSnap.exists() || fieldSnap.data().userId !== userId) {
    throw new Error("Field not found or you do not have permission to delete it.");
  }
  
  const batch = writeBatch(db);
  const assignmentsCol = collection(db, 'fields', fieldId, 'assignments');
  const assignmentsSnapshot = await getDocs(assignmentsCol);
  assignmentsSnapshot.forEach(doc => batch.delete(doc.ref));
  batch.delete(fieldDocRef);
  
  try {
    await batch.commit();
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

    revalidatePath(`/fields/${fieldId}`);
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

    revalidatePath(`/fields/${fieldId}`);
}
