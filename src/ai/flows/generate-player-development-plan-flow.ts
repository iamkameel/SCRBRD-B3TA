'use server';
/**
 * @fileOverview An AI flow to generate a player development plan.
 *
 * - generatePlayerDevelopmentPlan - A function that analyzes a player's stats and recent form to create a development plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPerson } from '@/lib/actions/players';
import { getPlayerStats, getPlayerMatchHistory } from '@/lib/actions/stats';
import type { PlayerDevelopmentPlanOutput } from '@/ai/schemas';
import { PlayerDevelopmentPlanPromptInputSchema, PlayerDevelopmentPlanSchema, SimplifiedPlayerStatsSchema } from '@/ai/schemas';

const generatePlanPrompt = ai.definePrompt({
    name: 'generatePlayerDevelopmentPlanPrompt',
    input: { schema: PlayerDevelopmentPlanPromptInputSchema },
    output: { schema: PlayerDevelopmentPlanSchema },
    prompt: `You are an expert cricket coach and performance analyst. Your task is to create a personalized development plan for a player named {{{playerName}}}.

Analyze their overall career statistics and recent performances to identify key strengths, areas for improvement, and provide three actionable recommendations.

**Career Statistics:**
{{{json playerStats}}}

**Recent Batting Performances (last 5 matches):**
{{#if recentPerformances.length}}
{{#each recentPerformances}}
- {{{this.runs}}} runs vs {{{this.opponent}}}
{{/each}}
{{else}}
- No recent match data available.
{{/if}}

Based on this data, provide your analysis in the specified JSON format. The recommendations should be specific, targeted drills or focus areas to help the player improve their weaknesses and leverage their strengths.
`,
});

const generatePlayerDevelopmentPlanFlow = ai.defineFlow(
    {
        name: 'generatePlayerDevelopmentPlanFlow',
        inputSchema: z.string(), // personId
        outputSchema: PlayerDevelopmentPlanSchema,
    },
    async (personId) => {
        const person = await getPerson(personId);
        if (!person) {
            throw new Error('Player not found.');
        }

        const [stats, history] = await Promise.all([
            getPlayerStats(personId),
            getPlayerMatchHistory(personId)
        ]);
        
        const simplifiedStats: z.infer<typeof SimplifiedPlayerStatsSchema> = {
            matchesPlayed: stats.matchesPlayed,
            totalRuns: stats.totalRuns,
            battingAverage: parseFloat(stats.battingAverage.toFixed(2)),
            strikeRate: parseFloat(stats.strikeRate.toFixed(2)),
            wicketsTaken: stats.wicketsTaken,
            bowlingAverage: parseFloat(stats.bowlingAverage.toFixed(2)),
            economyRate: parseFloat(stats.economyRate.toFixed(2)),
        };

        const recentPerformances = history.map(h => ({
            opponent: h.opponent,
            runs: h.runsScored ?? 0,
        }));
        
        const promptInput = {
            playerName: `${person.firstName} ${person.lastName}`,
            playerStats: simplifiedStats,
            recentPerformances,
        };

        const { output } = await generatePlanPrompt(promptInput);
        return output!;
    }
);

export async function generatePlayerDevelopmentPlan(personId: string): Promise<PlayerDevelopmentPlanOutput> {
    return generatePlayerDevelopmentPlanFlow(personId);
}
