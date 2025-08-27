
import { getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import { getDivisions } from '@/lib/actions/divisions';
import RankingsClient from './client';

export default async function RankingsPage() {
  const divisions = await getDivisions();
  // Fetch initial data for the first division or a default one
  const initialDivisionId = divisions.find(d => d.name === 'Open')?.divisionId;

  const [leaderboards, standings] = await Promise.all([
    getLeaderboards({ divisionId: initialDivisionId }),
    getTeamStandings(initialDivisionId),
  ]);
  
  return (
    <RankingsClient 
        initialLeaderboards={leaderboards} 
        initialStandings={standings}
        divisions={divisions}
        initialDivisionId={initialDivisionId}
    />
  );
}
