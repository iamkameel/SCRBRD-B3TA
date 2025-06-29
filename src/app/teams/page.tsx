

import { getTeams } from '@/lib/actions/teams';
import { getSchools } from '@/lib/actions/schools';
import { getDivisions } from '@/lib/actions/divisions';
import { getSeasons } from '@/lib/actions/seasons';
import TeamsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function TeamsPage() {
  const [teams, schools, divisions, seasons] = await Promise.all([
    getTeams(),
    getSchools(),
    getDivisions(),
    getSeasons(),
  ]);
  
  const userId = getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  return <TeamsClient teams={teams} schools={schools} divisions={divisions} seasons={seasons} isAdmin={isAdmin} />;
}
