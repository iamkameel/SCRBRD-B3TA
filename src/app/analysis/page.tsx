
import { getPlayers } from '@/lib/actions/players';
import { getTeams } from '@/lib/actions/teams';
import AnalysisClient from './client';

export default async function AnalysisPage() {
  const [players, teams] = await Promise.all([
    getPlayers(),
    getTeams(),
  ]);
  
  const allPlayers = players.filter(p => p.roles.includes('Player'));

  return <AnalysisClient players={allPlayers} teams={teams} />;
}
