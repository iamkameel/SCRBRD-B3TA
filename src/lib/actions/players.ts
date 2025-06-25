'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, query, where, writeBatch } from 'firebase/firestore';
import type { Person } from '@/lib/data';

// This function now fetches data from Firestore
export async function getPlayers(): Promise<Person[]> {
  try {
    const peopleCollection = collection(db, 'people');
    const peopleSnapshot = await getDocs(peopleCollection);
    const peopleList = peopleSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            personId: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || '',
            profileImageUrl: data.profileImageUrl || '',
            roles: data.roles || [],
        }
    });
    return peopleList;
  } catch (error) {
    console.error("Error fetching people:", error);
    return [];
  }
}

export async function getPerson(personId: string): Promise<Person | null> {
    try {
        const personDocRef = doc(db, 'people', personId);
        const personSnap = await getDoc(personDocRef);

        if (!personSnap.exists()) {
            return null;
        }

        const data = personSnap.data();
        return {
            personId: personSnap.id,
            ...data,
        } as Person;
    } catch (error) {
        console.error(`Error fetching person with ID ${personId}:`, error);
        return null;
    }
}

export async function getPersonLinks(personId: string): Promise<{ guardians: Person[], children: Person[] }> {
    const linksCollection = collection(db, 'familyLinks');

    // Find who are the guardians of the person (personId is the child)
    const guardiansQuery = query(linksCollection, where("childId", "==", personId));
    
    // Find who are the children of the person (personId is the parent)
    const childrenQuery = query(linksCollection, where("parentId", "==", personId));

    try {
        const [guardiansSnapshot, childrenSnapshot] = await Promise.all([
            getDocs(guardiansQuery),
            getDocs(childrenQuery)
        ]);

        const guardianIds = guardiansSnapshot.docs.map(doc => doc.data().parentId);
        const childrenIds = childrenSnapshot.docs.map(doc => doc.data().childId);

        const guardianPromises = guardianIds.map(id => getDoc(doc(db, 'people', id)));
        const childrenPromises = childrenIds.map(id => getDoc(doc(db, 'people', id)));

        const guardianDocs = await Promise.all(guardianPromises);
        const childrenDocs = await Promise.all(childrenPromises);

        const guardians = guardianDocs
            .filter(doc => doc.exists())
            .map(doc => ({ personId: doc.id, ...doc.data() } as Person));

        const children = childrenDocs
            .filter(doc => doc.exists())
            .map(doc => ({ personId: doc.id, ...doc.data() } as Person));

        return { guardians, children };

    } catch (error) {
        console.error(`Error fetching links for person ${personId}:`, error);
        return { guardians: [], children: [] };
    }
}

const linkSchema = z.object({
  currentPersonId: z.string(),
  linkedPersonId: z.string(),
  relationship: z.enum(["guardian", "child"]),
});

export async function addPersonLinkAction(currentPersonId: string, linkedPersonId: string, relationship: 'guardian' | 'child') {
  const validatedFields = linkSchema.safeParse({ currentPersonId, linkedPersonId, relationship });
  if (!validatedFields.success) {
    throw new Error('Invalid link data.');
  }

  const { parentId, childId } = relationship === 'guardian'
    ? { parentId: linkedPersonId, childId: currentPersonId }
    : { parentId: currentPersonId, childId: linkedPersonId };

  // Check if the link already exists
  const linksCollection = collection(db, 'familyLinks');
  const q = query(linksCollection, where("parentId", "==", parentId), where("childId", "==", childId));
  const existingLink = await getDocs(q);

  if (!existingLink.empty) {
    throw new Error("This link already exists.");
  }
  
  try {
    await addDoc(linksCollection, { parentId, childId });
  } catch (error) {
    console.error("Error adding family link:", error);
    throw new Error("Could not create the link.");
  }

  revalidatePath(`/players/${currentPersonId}`);
  revalidatePath(`/players/${linkedPersonId}`);
}


// This function now adds a document to Firestore
export async function addPlayerAction(data: { firstName: string; lastName: string; email: string; phone?: string; roles: string[]; }) {
  const playerSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().optional(),
    roles: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one role.",
    }),
  });

  const validatedFields = playerSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid person data.');
  }

  const { firstName, lastName, email, phone, roles } = validatedFields.data;

  try {
    await addDoc(collection(db, 'people'), {
      firstName,
      lastName,
      email,
      phone: phone || '',
      roles,
      profileImageUrl: '', // Default value
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add person.");
  }
  
  // Revalidate paths that show player lists or details
  revalidatePath('/players');
  revalidatePath('/teams');
  revalidatePath('/new-match');

  return { success: true };
}
