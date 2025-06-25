import { getTeams } from '@/lib/actions/teams';
import { getSchools } from '@/lib/actions/schools';
import { getDivisions } from '@/lib/actions/divisions';
import { getSeasons } from '@/lib/actions/seasons';
import TeamsClient from './client';

export default async function TeamsPage() {
  const [teams, schools, divisions, seasons] = await Promise.all([
    getTeams(),
    getSchools(),
    getDivisions(),
    getSeasons()
  ]);
  
  return <TeamsClient teams={teams} schools={schools} divisions={divisions} seasons={seasons} />;
}
