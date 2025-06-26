
import { getMatches } from '@/lib/actions/matches';
import MatchesClient from './client';
import { getTeams } from '@/lib/actions/teams';
import { getSeasons } from '@/lib/actions/seasons';
import { getFields } from '@/lib/actions/fields';

export default async function MatchesPage() {
  const [matches, teams, seasons, fields] = await Promise.all([
    getMatches(),
    getTeams(),
    getSeasons(),
    getFields(),
  ]);
  
  return <MatchesClient matches={matches} teams={teams} seasons={seasons} fields={fields} />;
}
