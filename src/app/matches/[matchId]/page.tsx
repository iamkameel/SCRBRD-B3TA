
import { getMatch, getMatchOfficials, getMatchLineup } from '@/lib/actions/matches';
import { getPlayers } from '@/lib/actions/players';
import { getTeamRoster } from '@/lib/actions/teams';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';
import { generateScorecard } from '@/ai/flows/generate-scorecard-flow';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const match = await getMatch(params.matchId);
  
  if (!match) {
    notFound();
  }

  // Fetch all data in parallel
  const [
    officials,
    people,
    teamARoster,
    teamBRoster,
    teamALineup,
    teamBLineup,
    scorecardData,
  ] = await Promise.all([
    getMatchOfficials(params.matchId),
    getPlayers(), // To populate the assignment dialog
    getTeamRoster(match.teamAId),
    getTeamRoster(match.teamBId),
    getMatchLineup(params.matchId, match.teamAId),
    getMatchLineup(params.matchId, match.teamBId),
    generateScorecard({ teamAName: match.teamAName, teamBName: match.teamBName }),
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
  />;
}
