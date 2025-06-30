
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import type { TrainingSession } from '@/lib/data';
import { getUserId } from '@/lib/auth';
import { cache } from 'react';
import { getTeam } from './teams';

export const getSessionsByTeam = cache(async (teamId: string): Promise<TrainingSession[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    if (!teamId) return [];
    
    try {
        const q = query(collection(db, 'sessions'), where("userId", "==", userId), where("teamId", "==", teamId));
        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                sessionId: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as TrainingSession;
        });
        return sessions.sort((a,b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        console.error(`Error fetching sessions for team ${teamId}:`, error);
        return [];
    }
});

const sessionSchema = z.object({
    title: z.string().min(1, { message: "Session title is required." }),
    date: z.date({ required_error: "A date is required." }),
    teamId: z.string({ required_error: "A team is required." }),
    focus: z.array(z.string()).min(1, { message: "At least one focus area is required." }),
    notes: z.string().optional(),
});

export async function addSessionAction(data: z.infer<typeof sessionSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const validatedFields = sessionSchema.safeParse(data);
    if (!validatedFields.success) {
        throw new Error("Invalid session data.");
    }

    const team = await getTeam(data.teamId);
    if (!team) {
        throw new Error("Team not found.");
    }
    
    try {
        await addDoc(collection(db, 'sessions'), {
            ...data,
            teamName: team.name,
            date: Timestamp.fromDate(data.date),
            drills: [],
            attendance: [],
            userId,
        });
    } catch (error) {
        console.error("Error adding session:", error);
        throw new Error("Could not add session.");
    }

    revalidatePath('/planner');
    revalidatePath('/dashboard');
}
