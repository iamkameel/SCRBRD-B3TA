

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPerson } from './players';
import { getTeamRoster, addPlayerToRosterAction } from './teams';
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

    // Check if the person is already assigned
    if (targetType === 'Team') {
        const roster = await getTeamRoster(targetId);
        if (roster.some(member => member.personId === requesterId)) {
            throw new Error("This person is already on the team's roster.");
        }
    } else if (targetType === 'School') {
        if (requester.assignedSchools?.includes(targetId)) {
            throw new Error("This person is already assigned to this school.");
        }
    }

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
        userId: requesterId, // The creator of the request owns the document
    });

    revalidatePath('/dashboard');
}

export const getPendingAssignmentRequests = cache(async (): Promise<AssignmentRequest[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    const currentUser = await getPerson(userId);
    if (!currentUser) return [];

    const requestsCollection = collection(db, 'assignmentRequests');
    let q;

    if (currentUser.roles.some(r => ['Admin', 'Sportsmaster'].includes(r))) {
        // Admins/Sportsmasters see all pending requests
        q = query(requestsCollection, where("status", "==", "pending"));
    } else {
        // Other users see their own pending requests
        q = query(requestsCollection, where("requesterId", "==", userId), where("status", "==", "pending"));
    }

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
        requestId: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
    } as AssignmentRequest));
    
    return requests.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
});

const reviewSchema = z.object({
  requestId: z.string(),
  decision: z.enum(['approve', 'deny']),
});

export async function reviewAssignmentRequestAction(data: z.infer<typeof reviewSchema>) {
    const reviewerId = await getUserId();
    if (!reviewerId) throw new Error("User not authenticated.");

    const reviewer = await getPerson(reviewerId);
    if (!reviewer || !reviewer.roles.some(r => ['Admin', 'Sportsmaster'].includes(r))) {
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
            // arrayUnion is idempotent, it won't add duplicates. This is safe.
            await updateDoc(personRef, {
                assignedSchools: arrayUnion(request.targetId)
            });
        } else { // Team
            const teamRoster = await getTeamRoster(request.targetId);
            const isAlreadyAssigned = teamRoster.some(member => member.personId === request.requesterId);
            
            if (isAlreadyAssigned) {
                // This will prevent the error from being thrown to the UI,
                // and simply mark the request as handled.
                console.warn(`Attempted to approve an assignment for a user (${request.requesterId}) who is already on the roster for team (${request.targetId}). Request will be marked as approved, but no new roster entry was created.`);
            } else {
                await addPlayerToRosterAction(request.targetId, {
                    personId: request.requesterId,
                    role: request.role,
                    status: 'active',
                    isCaptain: false,
                    isViceCaptain: false,
                });
            }
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

