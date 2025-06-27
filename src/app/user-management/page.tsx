import UserManagementClient from './client';
import { getPlayers } from '@/lib/actions/players';

export default async function UserManagementPage() {
    // In a real app, you would fetch users here from your auth provider.
    // For this demo, we are connecting it to the people in the database.
    const users = await getPlayers();
    return <UserManagementClient users={users} />;
}
