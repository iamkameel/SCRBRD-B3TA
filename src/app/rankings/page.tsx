
'use server';

import { getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import { getDivisions } from '@/lib/actions/divisions';
import RankingsClient from './client';
import { getTeams } from '@/lib/actions/teams';

export default async function RankingsPage() {
  const [divisions, allTeams] = await Promise.all([
    getDivisions(),
    getTeams(),
  ]);

  const initialDivisionId = divisions.find(d => d.name === 'Open')?.divisionId;
  const teamClasses = [...new Set(allTeams.map(t => t.teamClass).filter(Boolean))] as string[];

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
        allTeams={allTeams}
    />
  );
}
