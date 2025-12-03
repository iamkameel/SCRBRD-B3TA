
'use server';

import UserManagementClient from './client';
import { getAllPeople, getPerson } from '@/lib/actions/players';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { getUserId } from '@/lib/server-auth';
import type { Person } from '@/lib/data';

// Helper function to serialize date objects
const serializePerson = (person: Person): Person => {
    return {
        ...person,
        dateOfBirth: person.dateOfBirth ? person.dateOfBirth.toISOString() as any : undefined,
        developmentPlanGeneratedAt: person.developmentPlanGeneratedAt ? person.developmentPlanGeneratedAt.toISOString() as any : undefined,
        // Add any other date fields here if they exist
    };
};


export default async function UserManagementPage() {
    const userId = await getUserId();
    const userResult = userId ? await getPerson(userId) : null;

    if (!userResult) {
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

    if (!userResult.roles.some(r => authorizedRoles.includes(r))) {
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
    
    const users = await getAllPeople();
    
    // Serialize the user objects to make them safe to pass to a Client Component
    const serializableUsers = users.map(serializePerson);
    const serializableCurrentUser = serializePerson(userResult);
    
    return <UserManagementClient users={serializableUsers} currentUser={serializableCurrentUser} />;
}
