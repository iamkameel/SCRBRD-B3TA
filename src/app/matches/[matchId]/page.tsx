

import { getMatch, getMatchOfficials, getMatchLineup, getScorecard } from '@/lib/actions/matches';
import { getPlayers, getPeopleByRole } from '@/lib/actions/players';
import { getTeamRoster } from '@/lib/actions/teams';
import { getVehicles, getMatchTransportAssignments } from '@/lib/actions/transport';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const match = await getMatch(matchId);
  
  if (!match) {
    notFound();
  }

  // Fetch all standard data in parallel
  const [
    officials,
    people,
    teamARoster,
    teamBLineup,
    scorecardData,
    transportAssignments,
    vehicles,
    drivers,
  ] = await Promise.all([
    getMatchOfficials(matchId),
    getPlayers(), // To populate the assignment dialog
    getTeamRoster(match.teamAId),
    match.teamBId ? getMatchLineup(matchId, match.teamBId) : Promise.resolve([]),
    getScorecard(matchId),
    getMatchTransportAssignments(matchId),
    getVehicles(),
    getPeopleByRole('Driver'),
  ]);

  return <MatchDetailsClient 
    match={match} 
    initialOfficials={officials} 
    people={people} 
    teamARoster={teamARoster}
    teamBLineup={teamBLineup}
    innings1={scorecardData?.innings1}
    innings2={scorecardData?.innings2}
    transportAssignments={transportAssignments}
    vehicles={vehicles}
    drivers={drivers}
  />;
}
