'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
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

type PlayerFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  roles: string[];
}

// This function now adds a document to Firestore
export async function addPlayerAction(data: PlayerFormValues) {
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
