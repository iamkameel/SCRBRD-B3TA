import UserManagementClient from './client';

export default async function UserManagementPage() {
    // In a real app, you would fetch users here.
    // const users = await getUsers();
    return <UserManagementClient users={[]} />;
}
