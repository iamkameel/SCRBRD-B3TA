

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/auth';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';

export default async function PeoplePage() {
  const [people, userId, schools, teams] = await Promise.all([
    getPlayers(),
    getUserId(),
    getSchools(),
    getTeams(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;

  return <PeopleClient people={people} user={user} schools={schools} teams={teams} />;
}
