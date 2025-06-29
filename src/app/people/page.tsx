

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/auth';

export default async function PeoplePage() {
  const [people, userId] = await Promise.all([
    getPlayers(),
    getUserId(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;

  return <PeopleClient people={people} user={user} />;
}
