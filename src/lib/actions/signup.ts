
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { revalidatePath } from 'next/cache';

// Schemas for each role
const baseSignupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const spectatorSchema = baseSignupSchema.extend({
  role: z.literal('Spectator'),
});

const playerSchema = baseSignupSchema.extend({
  role: z.literal('Player'),
  schoolId: z.string().min(1, "School is required."),
  divisionId: z.string().min(1, "Division is required."),
});

const coachSchema = baseSignupSchema.extend({
    role: z.literal('Coach'),
    schoolId: z.string().min(1, "School is required."),
    inviteCode: z.string().min(1, "Invite code is required."),
});

const schoolAdminSchema = baseSignupSchema.extend({
    role: z.literal('School Admin'),
    schoolName: z.string().min(1, "School name is required."),
});

const guardianSchema = baseSignupSchema.extend({
    role: z.literal('Guardian'),
    playerId: z.string().min(1, "Player selection is required."),
});


export const signupActionSchema = z.discriminatedUnion("role", [
  spectatorSchema,
  playerSchema,
  coachSchema,
  schoolAdminSchema,
  guardianSchema,
]);

export type SignupActionInput = z.infer<typeof signupActionSchema>;

export async function signupUserAction(data: SignupActionInput): Promise<{ success: boolean; status: string }> {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    // 2. Prepare profile data based on role
    const profileData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roles: [data.role],
        activeRole: data.role,
        status: (data.role === 'Player' || data.role === 'Spectator') ? 'active' : 'pending_review',
        notificationPreferences: { email: true, push: false },
        createdAt: Timestamp.now(),
        userId: user.uid, // Add the Firebase Auth UID to the profile
    };

    if (data.role === 'Player' || data.role === 'Coach') {
        profileData.assignedSchools = [data.schoolId];
    }
    
    // Store details that may be needed for an admin to review the request
    if (data.role === 'School Admin' && data.schoolName) {
        profileData.requestedSchoolName = data.schoolName;
    }
    if (data.role === 'Coach' && data.inviteCode) {
        profileData.usedInviteCode = data.inviteCode;
    }
    if (data.role === 'Guardian' && data.playerId) {
        profileData.requestedPlayerLink = data.playerId;
    }

    // 3. Create profile in Firestore
    await setDoc(doc(db, 'people', user.uid), profileData);

    revalidatePath('/people');
    revalidatePath('/user-management');
    
    return { success: true, status: profileData.status };
}
