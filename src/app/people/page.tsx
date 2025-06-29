

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/auth';
import { getSchools } from '@/lib/actions/schools';

export default async function PeoplePage() {
  const [people, userId, schools] = await Promise.all([
    getPlayers(),
    getUserId(),
    getSchools(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;

  return <PeopleClient people={people} user={user} schools={schools} />;
}
