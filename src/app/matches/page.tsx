
import { getMatches } from '@/lib/actions/matches';
import MatchesClient from './client';
import { getTeams } from '@/lib/actions/teams';
import { getFields } from '@/lib/actions/fields';
import { getCompetitions } from '@/lib/actions/competitions';

export default async function MatchesPage() {
  const [matches, teams, fields, competitions] = await Promise.all([
    getMatches(),
    getTeams(),
    getFields(),
    getCompetitions(),
  ]);
  
  return <MatchesClient matches={matches} teams={teams} fields={fields} competitions={competitions} />;
}
