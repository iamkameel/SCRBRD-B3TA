'use server';
/**
 * @fileOverview An AI flow to generate a scouting report for an opposing team.
 *
 * - generateOppositionAnalysis - Generates a scouting report for a given opponent in a match context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getTeamStats, getTeamRoster } from '@/lib/actions/teams';
import { getPlayerStats } from '@/lib/actions/stats';
import type { RosterMember } from '@/lib/data';
import { OppositionAnalysisInputSchema } from '@/ai/schemas';

const generateOppositionAnalysisPrompt = ai.definePrompt({
    name: 'generateOppositionAnalysisPrompt',
    input: { schema: OppositionAnalysisInputSchema },
    output: { format: 'text' },
    prompt: `You are an expert cricket analyst and strategist. Your task is to generate a concise opposition analysis report for the team: {{{opponentTeamName}}}.

Based on the provided JSON data, create a scouting report that includes:
1.  **Team Overview**: A brief summary of the opponent's overall performance based on their team stats.
2.  **Key Strengths**: Identify 2-3 major strengths of the team (e.g., powerful batting lineup, economical bowling).
3.  **Potential Weaknesses**: Identify 2-3 potential weaknesses to exploit (e.g., vulnerability against spin, inconsistent middle order).
4.  **Key Players to Watch**: Highlight 2-3 specific players who are in form or pose a significant threat. Mention their key stats as evidence.

Provide the analysis in a clear, easy-to-read format. Do not just list the stats; interpret them to provide actionable intelligence.

**Opponent Team Stats:**
{{{opponentTeamStats}}}

**Opponent Key Players & Stats:**
{{{opponentKeyPlayers}}}

Generate only the analysis text.`,
});

const generateOppositionAnalysisFlow = ai.defineFlow(
  {
    name: 'generateOppositionAnalysisFlow',
    inputSchema: z.object({ opponentTeamId: z.string(), opponentTeamName: z.string() }),
    outputSchema: z.string(),
  },
  async ({ opponentTeamId, opponentTeamName }) => {
    
    const [teamStats, teamRoster] = await Promise.all([
      getTeamStats(opponentTeamId),
      getTeamRoster(opponentTeamId),
    ]);
    
    const getPlayersWithStats = async (roster: RosterMember[]) => {
        const playerPromises = roster.filter(m => m.role === 'Player').slice(0, 5).map(async (member) => {
            const stats = await getPlayerStats(member.personId);
            return { 
                name: member.personName,
                batting: { runs: stats.totalRuns, average: stats.battingAverage.toFixed(2), strikeRate: stats.strikeRate.toFixed(2) },
                bowling: { wickets: stats.wicketsTaken, average: stats.bowlingAverage.toFixed(2), economy: stats.economyRate.toFixed(2) },
            };
        });
        return Promise.all(playerPromises);
    };

    const playersWithStats = await getPlayersWithStats(teamRoster);

    const { output } = await generateOppositionAnalysisPrompt({
        opponentTeamName: opponentTeamName,
        opponentTeamStats: JSON.stringify(teamStats, null, 2),
        opponentKeyPlayers: JSON.stringify(playersWithStats, null, 2),
    });

    return output!;
  }
);

export async function generateOppositionAnalysis(input: { opponentTeamId: string; opponentTeamName: string; }): Promise<string> {
    return generateOppositionAnalysisFlow(input);
}
