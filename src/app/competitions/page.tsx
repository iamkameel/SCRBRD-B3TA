import { getCompetitions } from '@/lib/actions/competitions';
import { getSeasons } from '@/lib/actions/seasons';
import { getDivisions } from '@/lib/actions/divisions';
import { getTeams } from '@/lib/actions/teams';
import CompetitionsClient from './client';

export default async function CompetitionsPage() {
  const [competitions, seasons, divisions, teams] = await Promise.all([
    getCompetitions(),
    getSeasons(),
    getDivisions(),
    getTeams(),
  ]);
  
  return <CompetitionsClient competitions={competitions} seasons={seasons} divisions={divisions} teams={teams} />;
}
