
import FixturesClient from './client';
import { getMatches } from '@/lib/actions/matches';
import { getTeams } from '@/lib/actions/teams';
import { getCompetitions } from '@/lib/actions/competitions';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function FixturesPage() {
  const [matches, teams, competitions, userId] = await Promise.all([
    getMatches(),
    getTeams(),
    getCompetitions(),
    getUserId(),
  ]);

  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;

  // Pre-filter for fixtures page to only show scheduled and live matches
  const fixtures = matches.filter(m => m.status === 'scheduled' || m.status === 'live');
  
  return <FixturesClient fixtures={fixtures} teams={teams} competitions={competitions} isAdmin={isAdmin} />;
}
