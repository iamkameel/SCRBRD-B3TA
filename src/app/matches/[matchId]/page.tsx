

import { getMatch, getMatchOfficials, getMatchLineup, getScorecard } from '@/lib/actions/matches';
import { getPlayers, getPeopleByRole } from '@/lib/actions/players';
import { getTeamRoster } from '@/lib/actions/teams';
import { getVehicles, getMatchTransportAssignments } from '@/lib/actions/transport';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const match = await getMatch(params.matchId);
  
  if (!match) {
    notFound();
  }

  // Fetch all standard data in parallel
  const [
    officials,
    people,
    teamARoster,
    teamBRoster,
    teamALineup,
    teamBLineup,
    scorecardData,
    transportAssignments,
    vehicles,
    drivers,
  ] = await Promise.all([
    getMatchOfficials(params.matchId),
    getPlayers(), // To populate the assignment dialog
    getTeamRoster(match.teamAId),
    match.teamBId ? getTeamRoster(match.teamBId) : Promise.resolve([]),
    getMatchLineup(params.matchId, match.teamAId),
    match.teamBId ? getMatchLineup(params.matchId, match.teamBId) : Promise.resolve([]),
    getScorecard(params.matchId),
    getMatchTransportAssignments(params.matchId),
    getVehicles(),
    getPeopleByRole('Driver'),
  ]);

  return <MatchDetailsClient 
    match={match} 
    initialOfficials={officials} 
    people={people} 
    teamARoster={teamARoster}
    teamBRoster={teamBRoster}
    teamALineup={teamALineup}
    teamBLineup={teamBLineup}
    innings1={scorecardData?.innings1}
    innings2={scorecardData?.innings2}
    transportAssignments={transportAssignments}
    vehicles={vehicles}
    drivers={drivers}
  />;
}
