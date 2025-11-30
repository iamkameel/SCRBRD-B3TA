

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import type { Field, FieldAssignment, Person } from '@/lib/data';
import { cache } from 'react';
import { getUserId } from '@/lib/server-auth';
import { getPerson } from './players';

const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        throw new Error("You do not have permission to manage fields.");
    }
}

export async function getFields(): Promise<Field[]> {
  const userId = await getUserId();
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
        surfaceCondition: data.surfaceCondition,
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

export const getField = cache(async (fieldId: string): Promise<Field | null> => {
  const userId = await getUserId();
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
      surfaceCondition: data.surfaceCondition,
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
});


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
  surfaceCondition: z.object({
      rating: z.coerce.number().min(1).max(5),
      details: z.record(z.string()).optional(),
  }).optional(),
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
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
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
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
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
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  
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

export async function getFieldsForGroundskeeper(personId: string): Promise<Field[]> {
    const userId = await getUserId();
    if (!userId) return [];
    
    const allUserFields = await getFields();
    
    return allUserFields.filter(field => 
        field.assignments?.some(assignment => assignment.personId === personId)
    );
}


const fieldStatusSchema = z.enum(['Available', 'Maintenance', 'Closed']);
export async function updateFieldStatusAction(fieldId: string, status: z.infer<typeof fieldStatusSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const person = await getPerson(userId);
    if (!person || !person.roles.includes('Grounds-Keeper')) {
        throw new Error("You do not have permission to perform this action.");
    }

    const validatedStatus = fieldStatusSchema.safeParse(status);
    if (!validatedStatus.success) throw new Error("Invalid status provided.");

    const fieldRef = doc(db, 'fields', fieldId);
    const fieldSnap = await getDoc(fieldRef);

    if (!fieldSnap.exists()) {
        throw new Error("Field not found.");
    }
    
    const fieldData = await getField(fieldId);
    const isAssigned = fieldData?.assignments?.some(a => a.personId === userId);

    if (!isAssigned) {
        throw new Error("You are not assigned to manage this field.");
    }

    try {
        await updateDoc(fieldRef, { status: validatedStatus.data });
        revalidatePath('/dashboard');
        revalidatePath(`/fields/${fieldId}`);
    } catch (error) {
        console.error("Error updating field status:", error);
        throw new Error("Could not update field status.");
    }
}
