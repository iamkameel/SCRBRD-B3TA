
'use server';

import { getAuditLogs } from '@/lib/actions/audit';
import AuditLogClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { AuditLog } from '@/lib/data';

export default async function AuditLogPage() {
    const userId = await getUserId();
    const user = userId ? await getPerson(userId) : null;
    
    if (!user || !user.roles.some(r => ['Admin', 'System Architect'].includes(r))) {
        return (
            <Card className="w-full max-w-md mx-auto mt-16">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4">Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view the audit log.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    const auditLogs = await getAuditLogs();

    const serializableLogs = auditLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
    }));
    
    return <AuditLogClient initialLogs={serializableLogs as unknown as AuditLog[]} />;
}
