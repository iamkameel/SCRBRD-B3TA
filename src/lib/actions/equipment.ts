
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import type { EquipmentItem, FullEquipmentAssignment, Person } from '@/lib/data';
import { getPerson } from './players';
import { getUserId } from '@/lib/firebase-admin';

export async function getEquipment(): Promise<EquipmentItem[]> {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const q = query(collection(db, 'equipment'));
    const snapshot = await getDocs(q);
    const equipmentList = snapshot.docs.map(doc => ({
      itemId: doc.id, ...doc.data()
    } as EquipmentItem));
    return equipmentList.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return [];
  }
}

const itemSchema = z.object({
  name: z.string().min(1, { message: "Item name is required." }),
  type: z.enum(['Bat', 'Pads', 'Gloves', 'Helmet', 'Ball', 'Other']),
  size: z.string().optional(),
  status: z.enum(['Available', 'Maintenance']).default('Available'),
});

const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || !user.roles.some(r => ['Admin', 'Sportsmaster'].includes(r))) {
        throw new Error("You do not have permission to manage the equipment inventory.");
    }
};

const checkAssignmentPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || !user.roles.some(r => ['Admin', 'Sportsmaster', 'Team Manager', 'Coach'].includes(r))) {
        throw new Error("You do not have permission to assign or return equipment.");
    }
};

export async function addEquipmentItemAction(data: z.infer<typeof itemSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = itemSchema.safeParse(data);
  if (!validatedFields.success) throw new Error('Invalid item data.');
  try {
    await addDoc(collection(db, 'equipment'), { ...validatedFields.data, userId });
  } catch (error) {
    throw new Error("Could not add equipment item.");
  }
  revalidatePath('/equipment');
}

const updateItemSchema = itemSchema.extend({ itemId: z.string() });
export async function updateEquipmentItemAction(data: z.infer<typeof updateItemSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateItemSchema.safeParse(data);
    if (!validatedFields.success) throw new Error('Invalid item data.');
    const { itemId, ...updateData } = validatedFields.data;
    const itemRef = doc(db, 'equipment', itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) throw new Error("Item not found or permission denied.");
    try {
        await updateDoc(itemRef, updateData);
    } catch (error) {
        throw new Error("Could not update equipment item.");
    }
    revalidatePath('/equipment');
}

export async function deleteEquipmentItemAction(itemId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const itemRef = doc(db, 'equipment', itemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) throw new Error("Item not found or permission denied.");
  
  const batch = writeBatch(db);
  const assignmentsQuery = query(collection(db, 'equipmentAssignments'), where("itemId", "==", itemId));
  const assignmentsSnapshot = await getDocs(assignmentsQuery);
  assignmentsSnapshot.forEach(doc => batch.delete(doc.ref));
  batch.delete(itemRef);
  
  try {
    await batch.commit();
  } catch (error) {
    throw new Error("Could not delete equipment item and its assignments.");
  }
  revalidatePath('/equipment');
}

export async function assignEquipmentAction(itemId: string, personId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkAssignmentPermission(userId);
  const itemRef = doc(db, 'equipment', itemId);
  const [itemSnap, person] = await Promise.all([ getDoc(itemRef), getPerson(personId) ]);
  if (!itemSnap.exists()) throw new Error("Item not found or permission denied.");
  if (itemSnap.data().status !== 'Available') throw new Error("Item is not available for assignment.");
  if (!person) throw new Error("Player not found.");

  const batch = writeBatch(db);
  const assignmentRef = doc(collection(db, 'equipmentAssignments'));
  
  batch.set(assignmentRef, {
    itemId, personId, userId,
    assignedDate: Timestamp.now(),
    returnedDate: null,
  });
  batch.update(itemRef, {
    status: 'Assigned',
    currentAssignmentId: assignmentRef.id,
    currentHolderId: personId,
    currentHolderName: `${person.firstName} ${person.lastName}`
  });

  try {
    await batch.commit();
  } catch (error) {
    throw new Error("Could not assign equipment.");
  }
  revalidatePath('/equipment');
}

export async function returnEquipmentAction(assignmentId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkAssignmentPermission(userId);
  const assignmentRef = doc(db, 'equipmentAssignments', assignmentId);
  const assignmentSnap = await getDoc(assignmentRef);
  if (!assignmentSnap.exists()) throw new Error("Assignment not found or permission denied.");
  
  const { itemId, returnedDate } = assignmentSnap.data();
  if(returnedDate) throw new Error("This item has already been returned.");
  
  const itemRef = doc(db, 'equipment', itemId);
  const batch = writeBatch(db);
  
  batch.update(assignmentRef, { returnedDate: Timestamp.now() });
  batch.update(itemRef, {
    status: 'Available',
    currentAssignmentId: null,
    currentHolderId: null,
    currentHolderName: null,
  });

  try {
    await batch.commit();
  } catch (error) {
    throw new Error("Could not return equipment.");
  }
  revalidatePath('/equipment');
}

export async function getAllEquipmentAssignments(): Promise<FullEquipmentAssignment[]> {
    const userId = await getUserId();
    if (!userId) return [];
    try {
        const q = query(collection(db, 'equipmentAssignments'));
        const snapshot = await getDocs(q);

        const assignmentsPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const [item, person] = await Promise.all([
                getDoc(doc(db, 'equipment', data.itemId)),
                getDoc(doc(db, 'people', data.personId)),
            ]);

            if (!item.exists() || !person.exists()) return null;

            return {
                assignmentId: docSnap.id,
                ...data,
                itemName: item.data().name,
                itemType: item.data().type,
                personName: `${person.data().firstName} ${person.data().lastName}`,
                assignedDate: (data.assignedDate as Timestamp).toDate(),
                returnedDate: data.returnedDate ? (data.returnedDate as Timestamp).toDate() : undefined,
            } as FullEquipmentAssignment;
        });
        
        const assignments = (await Promise.all(assignmentsPromises)).filter((a): a is FullEquipmentAssignment => a !== null);
        return assignments.sort((a,b) => b.assignedDate.getTime() - a.assignedDate.getTime());

    } catch(error) {
        console.error("Error fetching all assignments:", error);
        return [];
    }
}
