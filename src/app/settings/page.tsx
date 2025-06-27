
import SettingsClient from './client';
import { getPersonByEmail } from '@/lib/actions/players';
import type { Person } from '@/lib/data';

export default async function SettingsPage() {
  // In a real app, you would fetch the currently logged-in user.
  // For this demo, we fetch a specific user to represent the profile.
  const userProfile = await getPersonByEmail('admin@scrbrd.app');
  
  return <SettingsClient userProfile={userProfile} />;
}
