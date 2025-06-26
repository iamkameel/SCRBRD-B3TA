import UserManagementClient from './client';

// This is a placeholder type.
type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  status: 'Active' | 'Invited';
};

const sampleUsers: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@scrbrd.app', role: 'Admin', status: 'Active' },
    { id: '2', name: 'Coach Carter', email: 'coach.carter@example.com', role: 'Member', status: 'Active' },
    { id: '3', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'Member', status: 'Invited' },
];


export default async function UserManagementPage() {
    // In a real app, you would fetch users here from your auth provider.
    // For this demo, we are using sample data.
    return <UserManagementClient users={sampleUsers} />;
}
