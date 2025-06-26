
import { getMatch, getMatchOfficials, getMatchLineup, getScorecard, saveScorecard } from '@/lib/actions/matches';
import { getPlayers } from '@/lib/actions/players';
import { getTeamRoster } from '@/lib/actions/teams';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';
import { generateScorecard } from '@/ai/flows/generate-scorecard-flow';
import type { Innings } from '@/lib/data';

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
  ] = await Promise.all([
    getMatchOfficials(params.matchId),
    getPlayers(), // To populate the assignment dialog
    getTeamRoster(match.teamAId),
    getTeamRoster(match.teamBId),
    getMatchLineup(params.matchId, match.teamAId),
    getMatchLineup(params.matchId, match.teamBId),
  ]);

  // Handle scorecard data separately for conditional generation
  let scorecardData: { innings1?: Innings; innings2?: Innings; } | null = await getScorecard(params.matchId);

  // If no scorecard exists and both teams have enough players, generate and save one.
  if (!scorecardData && teamARoster.length >= 11 && teamBRoster.length >= 11) {
    const teamAPlayerNames = teamARoster.slice(0, 11).map(p => p.personName);
    const teamBPlayerNames = teamBRoster.slice(0, 11).map(p => p.personName);

    const generatedData = await generateScorecard({
      teamAName: match.teamAName,
      teamAPlayers: teamAPlayerNames,
      teamBName: match.teamBName,
      teamBPlayers: teamBPlayerNames,
    });
    
    if (generatedData) {
        scorecardData = generatedData;
        await saveScorecard(params.matchId, generatedData);
        // We revalidate the paths to see the status update on the matches and dashboard pages
        // In a real app, you might re-fetch 'match' data here to get the updated status,
        // but for now we'll let the client component handle the initial display.
    }
  }


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
