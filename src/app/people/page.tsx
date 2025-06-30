

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/auth';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';

export default async function PeoplePage() {
  const [people, userId, schools, teams, divisions] = await Promise.all([
    getPlayers(),
    getUserId(),
    getSchools(),
    getTeams(),
    getDivisions(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;

  return <PeopleClient people={people} user={user} schools={schools} teams={teams} divisions={divisions} />;
}
