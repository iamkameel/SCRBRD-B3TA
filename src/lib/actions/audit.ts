
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getUserId } from '@/lib/auth';
import { getPerson } from './players';
import type { Person } from '../data';
import { revalidatePath } from 'next/cache';

interface LogAuditEventParams {
    actorId: string;
    action: string;
    target: {
        type: string;
        id: string;
        name?: string;
    };
    details?: Record<string, any>;
}

export async function logAuditEvent(params: Omit<LogAuditEventParams, 'actorId'>) {
    const actorId = await getUserId();
    if (!actorId) {
        console.warn("Audit event triggered by unauthenticated user. Skipping log.");
        return;
    }
    
    const actor = await getPerson(actorId);
    if (!actor) {
        console.warn(`Could not find person record for actorId: ${actorId}. Skipping log.`);
        return;
    }

    try {
        await addDoc(collection(db, 'auditLogs'), {
            actorId: actor.personId,
            actorName: `${actor.firstName} ${actor.lastName}`,
            action: params.action,
            target: params.target,
            details: params.details || {},
            timestamp: Timestamp.now(),
        });
        revalidatePath('/audit-log');
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // We typically don't want to throw an error here to prevent the user's action from failing
        // just because logging failed.
    }
}

export async function getAuditLogs(): Promise<any[]> {
    const userId = await getUserId();
    if (!userId) return [];
    
    const actor = await getPerson(userId);
    if (!actor || !actor.roles.includes('Admin')) {
        // In a real scenario, you might want to return an empty array for non-admins
        // or throw an error. For simplicity, we'll restrict access.
        return [];
    }

    try {
        const snapshot = await getDocs(collection(db, 'auditLogs'));
        const logs = snapshot.docs.map(doc => ({
            logId: doc.id,
            ...doc.data(),
            timestamp: (doc.data().timestamp as Timestamp).toDate(),
        }));
        return logs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return [];
    }
}
