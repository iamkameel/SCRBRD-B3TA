
'use server';
/**
 * @fileOverview An AI flow to generate a player development plan.
 *
 * - generatePlayerDevelopmentPlanFlow - A function that analyzes a player's stats and recent form to create a development plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { PlayerDevelopmentPlanOutput } from '@/ai/schemas';
import { PlayerDevelopmentPlanPromptInputSchema, PlayerDevelopmentPlanSchema } from '@/ai/schemas';

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

export const generatePlayerDevelopmentPlanFlow = ai.defineFlow(
    {
        name: 'generatePlayerDevelopmentPlanFlow',
        inputSchema: PlayerDevelopmentPlanPromptInputSchema,
        outputSchema: PlayerDevelopmentPlanSchema,
    },
    async (input) => {
        const { output } = await generatePlanPrompt(input);
        return output!;
    }
);
