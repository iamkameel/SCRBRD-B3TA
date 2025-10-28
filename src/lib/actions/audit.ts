
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs, query } from 'firebase/firestore';
import { getPerson } from './players';
import type { Person, AuditLog } from '../data';
import { revalidatePath } from 'next/cache';
import { getUserId } from '@/lib/firebase-admin';


interface LogAuditEventParams {
    actorId?: string;
    action: string;
    target: {
        type: string;
        id: string;
        name?: string;
    };
    details?: Record<string, any>;
}

export async function logAuditEvent(params: LogAuditEventParams) {
    const actorId = params.actorId || await getUserId();
    if (!actorId) {
        console.warn("Audit event triggered by unauthenticated user. Skipping log.");
        return;
    }
    
    const actor = await getPerson(actorId);
    if (!actor) {
        console.warn(\`Could not find person record for actorId: \${actorId}. Skipping log.\`);
        return;
    }

    try {
        await addDoc(collection(db, 'auditLogs'), {
            actorId: actor.personId,
            actorName: \`\${actor.firstName} \${actor.lastName}\`,
            action: params.action,
            target: params.target,
            details: params.details || {},
            timestamp: Timestamp.now(),
        });
        revalidatePath('/audit-log');
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    const userId = await getUserId();
    if (!userId) return [];
    
    const actor = await getPerson(userId);
    if (!actor || !actor.roles.includes('Admin')) {
        return [];
    }

    try {
        const snapshot = await getDocs(query(collection(db, 'auditLogs')));
        const logs = snapshot.docs.map(doc => ({
            logId: doc.id,
            ...doc.data(),
            timestamp: (doc.data().timestamp as Timestamp).toDate(),
        } as AuditLog));
        return logs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return [];
    }
}
