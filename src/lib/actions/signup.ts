
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getPersonByEmail } from './players';
import { ROLE_GROUPS } from '../roles';

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
    // 1. Create user in Firebase Auth. This will throw an error if the email is already in use.
    const userCredential = await getAuth(adminApp).createUser({
        email: data.email,
        password: data.password,
        displayName: `${data.firstName} ${data.lastName}`,
    });
    const user = userCredential;
    
    // This is the crucial part: the Firestore document ID MUST match the Firebase Auth UID.
    const userDocRef = doc(db, 'people', user.uid);
    
    // 2. Prepare profile data based on role
    const GOD_TIER_EMAILS = ['kameel@maverickdesign.co.za', 'kameel@scrbrd.com'];
    const isGodTierAdmin = GOD_TIER_EMAILS.includes(data.email);

    let rolesToAssign: string[];
    let activeRole: string;

    if (isGodTierAdmin) {
        rolesToAssign = ROLE_GROUPS.flatMap(g => g.roles.map(r => r.id));
        activeRole = 'System Architect';
    } else {
        rolesToAssign = [data.role];
        activeRole = data.role;
    }

    const profileData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roles: rolesToAssign,
        activeRole: activeRole,
        status: (data.role === 'Player' || data.role === 'Spectator' || isGodTierAdmin) ? 'active' : 'pending_review',
        notificationPreferences: { email: true, push: false },
        createdAt: Timestamp.now(),
        userId: user.uid, // Explicitly store the UID in the document as well
    };
    
    if ((data.role === 'Player' || data.role === 'Coach') && data.schoolId) {
        profileData.assignedSchools = [data.schoolId];
    }
    
    if (data.role === 'School Admin' && data.schoolName) {
        // Prevent non-admins from assigning themselves as admins of existing schools
        // For a new signup, they are always pending unless they are god tier
        if (!isGodTierAdmin) {
             profileData.requestedSchoolName = data.schoolName;
        } else {
            // For simplicity, we assume an admin creating another school admin is valid.
            // In a real app, you'd check if the school exists.
        }
    }
    if (data.role === 'Coach' && data.inviteCode) {
        profileData.usedInviteCode = data.inviteCode;
    }
    if (data.role === 'Guardian' && data.playerId) {
        profileData.requestedPlayerLink = data.playerId;
    }

    // 3. Create the Firestore document with the UID as the ID.
    await setDoc(userDocRef, profileData);

    revalidatePath('/people');
    revalidatePath('/user-management');
    
    // 4. Sign the user in to create a session - THIS CANNOT BE DONE ON THE SERVER. The client will handle sign-in.
    
    return { success: true, status: profileData.status };
}
