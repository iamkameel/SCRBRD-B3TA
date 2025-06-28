import { getPlayers } from '@/lib/actions/players';
import AnalysisClient from './client';

export default async function AnalysisPage() {
  const players = await getPlayers();
  
  // For the Player vs Player comparison, we only need players.
  // We can add team fetching later when we build that feature.
  const allPlayers = players.filter(p => p.roles.includes('Player'));

  return <AnalysisClient players={allPlayers} />;
}
