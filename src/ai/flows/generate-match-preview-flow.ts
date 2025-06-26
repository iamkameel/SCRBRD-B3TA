'use server';
/**
 * @fileOverview An AI flow to generate a preview for an upcoming cricket match.
 *
 * - generateMatchPreview - A function that generates a preview for an upcoming match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getMatch } from '@/lib/actions/matches';
import { getTeamStats, getTeamRoster } from '@/lib/actions/teams';
import { getPlayerStats } from '@/lib/actions/players';
import { getMatchForecast } from '@/ai/flows/get-match-forecast-flow';
import type { RosterMember } from '@/lib/data';

const MatchPreviewInputSchema = z.object({
    teamAName: z.string(),
    teamBName: z.string(),
    teamAStats: z.string().describe("A JSON string of Team A's overall season statistics."),
    teamBStats: z.string().describe("A JSON string of Team B's overall season statistics."),
    teamAPlayers: z.string().describe("A JSON string of Team A's key players and their stats."),
    teamBPlayers: z.string().describe("A JSON string of Team B's key players and their stats."),
    weather: z.string().describe("A JSON string of the weather forecast for the match."),
});

const generateMatchPreviewPrompt = ai.definePrompt({
    name: 'generateMatchPreviewPrompt',
    input: { schema: MatchPreviewInputSchema },
    output: { format: 'text' },
    prompt: `You are a cricket analyst providing a preview for an upcoming T20 match. Based on the JSON data provided, write an engaging, multi-paragraph preview.

The preview should include:
1.  An introduction setting the stage for the match between {{{teamAName}}} and {{{teamBName}}}.
2.  An analysis of each team's recent form, using the provided team stats.
3.  Identification of "Key Players to Watch" from each team, highlighting their recent performance statistics. Mention at least two players from each team.
4.  A "Weather Watch" section discussing how the forecast might impact the game.
5.  A concluding paragraph on what to expect from the match.

Maintain a professional and insightful tone. Do not simply list the stats; interpret them.

Team A Stats:
{{{teamAStats}}}

Team B Stats:
{{{teamBStats}}}

Team A Key Players:
{{{teamAPlayers}}}

Team B Key Players:
{{{teamBPlayers}}}

Weather Forecast:
{{{weather}}}

Generate only the match preview text.`,
});

const generateMatchPreviewFlow = ai.defineFlow(
  {
    name: 'generateMatchPreviewFlow',
    inputSchema: z.string(), // matchId
    outputSchema: z.string(),
  },
  async (matchId) => {
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found.");
    if (match.status !== 'scheduled') throw new Error("Match preview can only be generated for scheduled matches.");

    const [
      teamAStats,
      teamBStats,
      teamARoster,
      teamBRoster,
      weatherForecast,
    ] = await Promise.all([
      getTeamStats(match.teamAId),
      getTeamStats(match.teamBId),
      getTeamRoster(match.teamAId),
      getTeamRoster(match.teamBId),
      getMatchForecast(matchId),
    ]);
    
    // Helper to get stats for the first few players on the roster
    const getPlayersWithStats = async (roster: RosterMember[]) => {
        const playerPromises = roster.filter(m => m.role === 'Player').slice(0, 5).map(async (member) => {
            const stats = await getPlayerStats(member.personId);
            // We only care about a few key stats for the preview
            return { 
                name: member.personName,
                batting: { runs: stats.totalRuns, average: stats.battingAverage.toFixed(2), strikeRate: stats.strikeRate.toFixed(2) },
                bowling: { wickets: stats.wicketsTaken, average: stats.bowlingAverage.toFixed(2), economy: stats.economyRate.toFixed(2) },
            };
        });
        return Promise.all(playerPromises);
    };

    const teamAPlayersWithStats = await getPlayersWithStats(teamARoster);
    const teamBPlayersWithStats = await getPlayersWithStats(teamBRoster);

    const { output } = await generateMatchPreviewPrompt({
        teamAName: match.teamAName,
        teamBName: match.teamBName,
        teamAStats: JSON.stringify(teamAStats, null, 2),
        teamBStats: JSON.stringify(teamBStats, null, 2),
        teamAPlayers: JSON.stringify(teamAPlayersWithStats, null, 2),
        teamBPlayers: JSON.stringify(teamBPlayersWithStats, null, 2),
        weather: JSON.stringify(weatherForecast, null, 2),
    });

    return output!;
  }
);

export async function generateMatchPreview(matchId: string): Promise<string> {
    return generateMatchPreviewFlow(matchId);
}
