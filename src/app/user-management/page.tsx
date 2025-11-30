
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
    let user = userId ? await getPerson(userId) : null;

    // Create a temporary admin user if the real one isn't found
    // This grants access to the page for the "Guest Admin" scenario.
    if (!user) {
        user = {
            personId: 'TEMP_ADMIN',
            firstName: 'Guest',
            lastName: 'Admin',
            email: 'temp@admin.com',
            roles: ['System Architect'],
            activeRole: 'System Architect',
        } as Person;
    }

    // Role-based access control check
    if (!user.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r))) {
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
