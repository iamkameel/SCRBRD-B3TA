
'use server';

import UserManagementClient from './client';
import { getPlayers } from '@/lib/actions/players';
import { getPerson } from '@/lib/actions/players';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { getUserId } from '@/lib/server-auth';


export default async function UserManagementPage() {
    // In a real app, you would fetch users here from your auth provider.
    // For this demo, we are connecting it to the people in the database.
    const userId = await getUserId();
    const user = userId ? await getPerson(userId) : null;

    // Role-based access control check
    if (!user || !user.roles.some(r => ['Admin', 'Sportsmaster'].includes(r))) {
        return (
            <Card className="w-full max-w-md mx-auto mt-16">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4">Access Denied</CardTitle>
                    <CardDescription>
                        You do not have the required permissions to view this page.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    const users = await getPlayers();
    return <UserManagementClient users={users} currentUser={user} />;
}
