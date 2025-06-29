
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { signOut } from 'firebase/auth';

const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function createUserProfileAction(data: z.infer<typeof userProfileSchema>) {
  const validatedFields = userProfileSchema.safeParse(data);
  if (!validatedFields.success) {
    throw new Error('Invalid user profile data.');
  }
  const { uid, ...profileData } = validatedFields.data;

  try {
    // Create a document in the 'people' collection with the UID as the document ID
    await setDoc(doc(db, 'people', uid), {
      ...profileData,
      roles: ['Admin'], // Default role for new sign-ups
      activeRole: 'Admin', // Default active role
      notificationPreferences: { email: true, push: false },
    });
  } catch (error) {
    console.error("Error creating user profile in Firestore: ", error);
    throw new Error("Could not create user profile.");
  }
  
  revalidatePath('/people');
}

export async function signOutAction() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw new Error("Could not sign out.");
  }
}
