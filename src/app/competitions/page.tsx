

import { getCompetitions } from '@/lib/actions/competitions';
import { getSeasons } from '@/lib/actions/seasons';
import { getDivisions } from '@/lib/actions/divisions';
import { getTeams } from '@/lib/actions/teams';
import CompetitionsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function CompetitionsPage() {
  const [competitions, seasons, divisions, teams] = await Promise.all([
    getCompetitions(),
    getSeasons(),
    getDivisions(),
    getTeams(),
  ]);
  
  const userId = getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  
  return <CompetitionsClient competitions={competitions} seasons={seasons} divisions={divisions} teams={teams} isAdmin={isAdmin} />;
}
