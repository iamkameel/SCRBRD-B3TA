
'use server';

import SettingsClient from './client';
import { getPersonByEmail, getPerson } from '@/lib/actions/players';
import type { Person } from '@/lib/data';
import { getUserId } from '@/lib/firebase-admin';

export default async function SettingsPage() {
  // In a real app, you would fetch the currently logged-in user.
  // For this demo, we fetch a specific user to represent the profile.
  const userId = await getUserId();
  const userProfile = userId ? await getPerson(userId) : null;
  
  return <SettingsClient userProfile={userProfile} />;
}
