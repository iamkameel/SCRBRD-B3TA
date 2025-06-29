

import { getMatches } from '@/lib/actions/matches';
import MatchesClient from './client';
import { getTeams } from '@/lib/actions/teams';
import { getFields } from '@/lib/actions/fields';
import { getCompetitions } from '@/lib/actions/competitions';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function MatchesPage() {
  const [matches, teams, fields, competitions] = await Promise.all([
    getMatches(),
    getTeams(),
    getFields(),
    getCompetitions(),
  ]);
  
  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  
  return <MatchesClient matches={matches} teams={teams} fields={fields} competitions={competitions} isAdmin={isAdmin} />;
}
