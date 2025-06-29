
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';

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

const emailSchema = z.string().email({ message: "Please enter a valid email address." });

export async function sendPasswordResetEmailAction(email: string) {
    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
        throw new Error(validatedEmail.error.errors[0].message);
    }
    
    try {
        await sendPasswordResetEmail(auth, validatedEmail.data);
    } catch (error: any) {
        // Don't reveal if the user exists or not for security reasons in a public app.
        // For this app's context, providing a more specific error is okay.
        if (error.code === 'auth/user-not-found') {
            throw new Error("No user found with this email address.");
        }
        console.error("Error sending password reset email:", error);
        throw new Error("Could not send password reset email. Please try again later.");
    }
}
