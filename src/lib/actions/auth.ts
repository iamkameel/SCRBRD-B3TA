
'use server';

import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';


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
