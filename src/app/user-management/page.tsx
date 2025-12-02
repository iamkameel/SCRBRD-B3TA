
'use server';

import UserManagementClient from './client';
import { getPlayers } from '@/lib/actions/players';
import { getPerson } from '@/lib/actions/players';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { getUserId } from '@/lib/server-auth';
import type { Person } from '@/lib/data';


export default async function UserManagementPage() {
    const userId = await getUserId();
    const user = userId ? await getPerson(userId) : null;

    if (!user) {
         return (
            <Card className="w-full max-w-md mx-auto mt-16">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4">User Not Found</CardTitle>
                    <CardDescription>
                       Could not retrieve your user profile. Please try logging in again.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    const authorizedRoles = ['Admin', 'Sportsmaster', 'System Architect'];

    if (!user.roles.some(r => authorizedRoles.includes(r))) {
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
