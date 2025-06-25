
import { getMatch, getMatchOfficials, getMatchLineup } from '@/lib/actions/matches';
import { getPlayers } from '@/lib/actions/players';
import { getTeamRoster } from '@/lib/actions/teams';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const match = await getMatch(params.matchId);
  
  if (!match) {
    notFound();
  }

  const [officials, people, teamARoster, teamBRoster, teamALineup, teamBLineup] = await Promise.all([
    getMatchOfficials(params.matchId),
    getPlayers(), // To populate the assignment dialog
    getTeamRoster(match.teamAId),
    getTeamRoster(match.teamBId),
    getMatchLineup(params.matchId, match.teamAId),
    getMatchLineup(params.matchId, match.teamBId),
  ]);

  return <MatchDetailsClient 
    match={match} 
    initialOfficials={officials} 
    people={people} 
    teamARoster={teamARoster}
    teamBRoster={teamBRoster}
    teamALineup={teamALineup}
    teamBLineup={teamBLineup}
  />;
}
