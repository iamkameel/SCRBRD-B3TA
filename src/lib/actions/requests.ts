
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, Timestamp, updateDoc, arrayUnion, limit } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPerson } from './players';
import { addPlayerToRosterAction } from './teams';
import type { AssignmentRequest } from '../data';
import { cache } from 'react';
import { getUserId } from '../auth';

const requestSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['School', 'Team']),
  role: z.string(),
  requesterId: z.string(),
});

export async function createAssignmentRequestAction(data: z.infer<typeof requestSchema>) {
    const validatedFields = requestSchema.safeParse(data);
    if (!validatedFields.success) throw new Error("Invalid request data.");
    
    const { requesterId, targetId, targetType, role } = validatedFields.data;
    const requester = await getPerson(requesterId);
    if (!requester) throw new Error("Could not identify requester.");

    let targetName = '';
    
    if (targetType === 'School') {
        const schoolSnap = await getDoc(doc(db, 'schools', targetId));
        if (!schoolSnap.exists()) throw new Error("School not found.");
        targetName = schoolSnap.data().name;
    } else {
        const teamSnap = await getDoc(doc(db, 'teams', targetId));
        if (!teamSnap.exists()) throw new Error("Team not found.");
        targetName = teamSnap.data().name;
    }

    const sportsmasterQuery = query(collection(db, 'people'), where('roles', 'array-contains', 'Sportsmaster'), limit(1));
    const sportsmasterSnapshot = await getDocs(sportsmasterQuery);

    if (sportsmasterSnapshot.empty) {
        throw new Error("No Sportsmaster found in the system to handle the request. Please contact the administrator.");
    }
    const sportsmasterId = sportsmasterSnapshot.docs[0].id;

    const requestsCollection = collection(db, 'assignmentRequests');
    const q = query(requestsCollection, where("requesterId", "==", requesterId), where("targetId", "==", targetId), where("status", "==", "pending"));
    const existingRequest = await getDocs(q);

    if (!existingRequest.empty) {
        throw new Error("You already have a pending request for this assignment.");
    }
    
    await addDoc(requestsCollection, {
        requesterId: requesterId,
        requesterName: `${requester.firstName} ${requester.lastName}`,
        targetId,
        targetName,
        targetType,
        role,
        status: 'pending',
        createdAt: Timestamp.now(),
        userId: sportsmasterId, // Assign request to the found Sportsmaster
    });

    revalidatePath('/dashboard');
}

export const getPendingAssignmentRequests = cache(async (): Promise<AssignmentRequest[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    const requestsCollection = collection(db, 'assignmentRequests');
    // A sportsmaster should see all pending requests, not just those assigned to them if we want to be more flexible.
    // For now, it's assigned to a specific user.
    const q = query(requestsCollection, where("userId", "==", userId), where("status", "==", "pending"));

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
        requestId: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
    } as AssignmentRequest));
    
    return requests;
});

const reviewSchema = z.object({
  requestId: z.string(),
  decision: z.enum(['approve', 'deny']),
});

export async function reviewAssignmentRequestAction(data: z.infer<typeof reviewSchema>) {
    const reviewerId = await getUserId();
    if (!reviewerId) throw new Error("User not authenticated.");

    const reviewer = await getPerson(reviewerId);
    if (!reviewer || !reviewer.roles.includes('Sportsmaster')) {
        throw new Error("You do not have permission to review requests.");
    }
    
    const validatedFields = reviewSchema.safeParse(data);
    if (!validatedFields.success) throw new Error("Invalid review data.");

    const { requestId, decision } = validatedFields.data;
    const requestRef = doc(db, 'assignmentRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error("Request not found.");

    const request = requestSnap.data() as Omit<AssignmentRequest, 'requestId'>;

    if (decision === 'approve') {
        if (request.targetType === 'School') {
            const personRef = doc(db, 'people', request.requesterId);
            await updateDoc(personRef, {
                assignedSchools: arrayUnion(request.targetId)
            });
        } else { // Team
            await addPlayerToRosterAction(request.targetId, {
                personId: request.requesterId,
                role: request.role,
                status: 'active',
                isCaptain: false,
                isViceCaptain: false,
            });
        }
    }

    await updateDoc(requestRef, {
        status: decision === 'approve' ? 'approved' : 'denied',
        reviewedBy: reviewerId,
        reviewedByName: `${reviewer.firstName} ${reviewer.lastName}`,
        reviewedAt: Timestamp.now(),
    });

    revalidatePath('/dashboard');
}
