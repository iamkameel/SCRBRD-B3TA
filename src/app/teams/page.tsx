

import { getTeams } from '@/lib/actions/teams';
import { getSchools } from '@/lib/actions/schools';
import { getDivisions } from '@/lib/actions/divisions';
import { getSeasons } from '@/lib/actions/seasons';
import TeamsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function TeamsPage() {
  const [teams, schools, divisions, seasons, userId] = await Promise.all([
    getTeams(),
    getSchools(),
    getDivisions(),
    getSeasons(),
    getUserId(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const canManage = user?.roles.includes('Admin') || user?.roles.includes('Sportsmaster') ?? false;

  return <TeamsClient teams={teams} schools={schools} divisions={divisions} seasons={seasons} canManage={canManage} />;
}
