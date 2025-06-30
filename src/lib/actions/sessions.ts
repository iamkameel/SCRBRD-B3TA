
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { TrainingSession, Drill } from '@/lib/data';
import { getUserId } from '@/lib/auth';
import { cache } from 'react';
import { getTeam } from './teams';

export const getSessionsByTeam = cache(async (teamId: string): Promise<TrainingSession[]> => {
    if (!teamId) return [];
    
    try {
        // A team's sessions should be visible to any authorized user, not just the creator.
        // The query is now scoped only by teamId.
        const q = query(collection(db, 'sessions'), where("teamId", "==", teamId));
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

export const getSession = cache(async (sessionId: string): Promise<TrainingSession | null> => {
    const userId = await getUserId();
    if (!userId) return null;
    try {
        const sessionDocRef = doc(db, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionDocRef);
        if (!sessionSnap.exists() || sessionSnap.data().userId !== userId) {
            return null;
        }
        const data = sessionSnap.data();
        return {
            sessionId: sessionSnap.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
        } as TrainingSession;
    } catch (error) {
        console.error(`Error fetching session with ID ${sessionId}:`, error);
        return null;
    }
});


const addDrillSchema = z.object({
    sessionId: z.string(),
    drillId: z.string(),
});

export async function addDrillToSessionAction(data: z.infer<typeof addDrillSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const validatedFields = addDrillSchema.safeParse(data);
    if (!validatedFields.success) {
        throw new Error("Invalid data.");
    }
    
    const { sessionId, drillId } = validatedFields.data;

    const sessionRef = doc(db, 'sessions', sessionId);
    const [sessionSnap, drillSnap] = await Promise.all([
        getDoc(sessionRef),
        getDoc(doc(db, 'drills', drillId))
    ]);

    if (!sessionSnap.exists() || sessionSnap.data().userId !== userId) {
        throw new Error("Session not found or you do not have permission.");
    }
    if (!drillSnap.exists()) {
        throw new Error("Drill not found.");
    }

    const sessionData = sessionSnap.data() as TrainingSession;
    const drillData = { drillId: drillSnap.id, ...drillSnap.data() } as Drill;

    if (sessionData.drills.some(d => d.drillId === drillId)) {
        throw new Error("This drill is already in the session plan.");
    }

    const newDrillEntry = {
        drillId: drillData.drillId,
        name: drillData.name,
        duration: drillData.duration,
    };

    try {
        await updateDoc(sessionRef, {
            drills: [...sessionData.drills, newDrillEntry]
        });
    } catch (error) {
        console.error("Error adding drill to session:", error);
        throw new Error("Could not add drill to session.");
    }
    
    revalidatePath(`/planner/${sessionId}`);
}

export async function removeDrillFromSessionAction(sessionId: string, drillIdToRemove: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists() || sessionSnap.data().userId !== userId) {
        throw new Error("Session not found or you do not have permission.");
    }

    const sessionData = sessionSnap.data() as TrainingSession;
    const updatedDrills = sessionData.drills.filter(d => d.drillId !== drillIdToRemove);

    try {
        await updateDoc(sessionRef, {
            drills: updatedDrills
        });
    } catch (error) {
        console.error("Error removing drill from session:", error);
        throw new Error("Could not remove drill from session.");
    }
    
    revalidatePath(`/planner/${sessionId}`);
}

const updateDrillsOrderSchema = z.object({
    sessionId: z.string(),
    drills: z.array(z.object({
        drillId: z.string(),
        name: z.string(),
        duration: z.number(),
    })),
});

export async function updateSessionDrillsOrderAction(data: z.infer<typeof updateDrillsOrderSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const validatedFields = updateDrillsOrderSchema.safeParse(data);
    if (!validatedFields.success) {
        throw new Error("Invalid data for updating drills order.");
    }
    
    const { sessionId, drills } = validatedFields.data;

    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists() || sessionSnap.data().userId !== userId) {
        throw new Error("Session not found or you do not have permission.");
    }
    
    try {
        await updateDoc(sessionRef, { drills: drills });
    } catch (error) {
        console.error("Error updating drills order:", error);
        throw new Error("Could not update session plan order.");
    }

    revalidatePath(`/planner/${sessionId}`);
}
