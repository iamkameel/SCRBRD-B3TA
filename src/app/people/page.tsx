

import { getPlayers } from '@/lib/actions/players';
import PeopleClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function PeoplePage() {
  const [people, userId] = await Promise.all([
    getPlayers(),
    getUserId()
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  return <PeopleClient people={people} isAdmin={isAdmin} />;
}
