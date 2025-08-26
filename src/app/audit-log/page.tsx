
import { getAuditLogs } from '@/lib/actions/audit';
import AuditLogClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default async function AuditLogPage() {
    const userId = await getUserId();
    const user = userId ? await getPerson(userId) : null;
    
    if (!user || !user.roles.includes('Admin')) {
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
    
    return <AuditLogClient initialLogs={auditLogs} />;
}
