import { getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import RankingsClient from './client';

export default async function RankingsPage() {
  const [leaderboards, standings] = await Promise.all([
    getLeaderboards(),
    getTeamStandings(),
  ]);
  
  return <RankingsClient leaderboards={leaderboards} standings={standings} />;
}
