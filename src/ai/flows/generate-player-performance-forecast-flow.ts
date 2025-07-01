
'use server';
/**
 * @fileOverview An AI flow to generate a performance forecast for a player in an upcoming match.
 *
 * - generatePlayerPerformanceForecast - Generates a performance prediction for a given player and match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPerson } from '@/lib/actions/players';
import { getMatch, getMatchLineup } from '@/lib/actions/matches';
import { getTeam, getTeamStats } from '@/lib/actions/teams';
import { getPlayerStats, getPlayerMatchHistory } from '@/lib/actions/stats';
import { getMatchForecast } from '@/ai/flows/get-match-forecast-flow';
import { PlayerPerformanceForecastInputSchema, PlayerPerformanceForecastOutputSchema, PlayerPerformanceForecastPromptInputSchema, type PlayerPerformanceForecastOutput, type PlayerPerformanceForecastInput } from '@/ai/schemas';

const generateForecastPrompt = ai.definePrompt({
    name: 'generatePlayerPerformanceForecastPrompt',
    input: { schema: PlayerPerformanceForecastPromptInputSchema },
    output: { schema: PlayerPerformanceForecastOutputSchema },
    prompt: `You are an expert cricket performance analyst. Your task is to predict a player's likely performance in an upcoming T20 match.

**Player to Analyze:**
- Name: {{{playerName}}}
- Role: {{{playerRole}}}
- Career Stats: {{{json playerStats}}}
- Recent Form (last 5 matches): {{{json recentForm}}}

**Match Context:**
- Opponent: {{{matchContext.opponentName}}}
- Venue: {{{matchContext.venueName}}}
- Weather Forecast: {{{json weatherForecast}}}

**Opponent Analysis:**
- Team Stats: {{{json opponentTeamStats}}}

Based on all this information, provide a realistic performance prediction.
- If they are primarily a batsman or all-rounder, predict a range of runs they are likely to score (e.g., 25-40 runs).
- If they are primarily a bowler, predict the number of wickets they might take (e.g., 1-2 wickets).
- Provide a brief justification for your prediction, considering their form, the opponent's strengths/weaknesses, and the playing conditions.

Your output must be in the specified JSON format.`,
});

const generatePlayerPerformanceForecastFlow = ai.defineFlow(
  {
    name: 'generatePlayerPerformanceForecastFlow',
    inputSchema: PlayerPerformanceForecastInputSchema,
    outputSchema: PlayerPerformanceForecastOutputSchema,
  },
  async ({ playerId, matchId }) => {
    const [player, match] = await Promise.all([
      getPerson(playerId),
      getMatch(matchId),
    ]);
    
    if (!player) throw new Error("Player not found.");
    if (!match) throw new Error("Match not found.");

    const [lineupA, lineupB] = await Promise.all([
        getMatchLineup(matchId, match.teamAId),
        match.teamBId ? getMatchLineup(matchId, match.teamBId) : Promise.resolve([]),
    ]);

    let opponentId: string | undefined;

    if (lineupA.includes(playerId)) {
        opponentId = match.teamBId;
    } else if (lineupB.includes(playerId)) {
        opponentId = match.teamAId;
    }
    
    if (!opponentId) throw new Error("Player not found in either lineup for this match, or opponent is not set.");
    
    const opponent = await getTeam(opponentId);
    if (!opponent) throw new Error("Opponent team data could not be loaded.");

    const [
        playerStats,
        recentForm,
        weatherForecast,
        opponentTeamStats,
    ] = await Promise.all([
        getPlayerStats(playerId),
        getPlayerMatchHistory(playerId),
        getMatchForecast(matchId),
        getTeamStats(opponentId),
    ]);

    const isBatsman = playerStats.battingAverage > 20 || playerStats.totalRuns > 500;
    const isBowler = playerStats.bowlingAverage > 0 && playerStats.bowlingAverage < 40 && playerStats.wicketsTaken > 10;
    let playerRole = 'Batsman';
    if (isBowler && !isBatsman) playerRole = 'Bowler';
    if (isBowler && isBatsman) playerRole = 'All-rounder';


    const { output } = await generateForecastPrompt({
        playerName: `${player.firstName} ${player.lastName}`,
        playerRole,
        playerStats: {
            matchesPlayed: playerStats.matchesPlayed,
            totalRuns: playerStats.totalRuns,
            battingAverage: parseFloat(playerStats.battingAverage.toFixed(2)),
            strikeRate: parseFloat(playerStats.strikeRate.toFixed(2)),
            wicketsTaken: playerStats.wicketsTaken,
            bowlingAverage: parseFloat(playerStats.bowlingAverage.toFixed(2)),
            economyRate: parseFloat(playerStats.economyRate.toFixed(2)),
        },
        recentForm: recentForm.map(h => ({
            opponent: h.opponent,
            runsScored: h.runsScored,
            battingStatus: h.battingStatus,
            wicketsTaken: h.wicketsTaken,
            runsConceded: h.runsConceded,
        })),
        matchContext: {
            opponentName: opponent.name,
            venueName: match.fieldName,
        },
        weatherForecast,
        opponentTeamStats,
    });
    
    return output!;
  }
);


export async function generatePlayerPerformanceForecast(input: PlayerPerformanceForecastInput): Promise<PlayerPerformanceForecastOutput> {
    return generatePlayerPerformanceForecastFlow(input);
}
