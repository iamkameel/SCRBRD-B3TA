
'use server';
/**
 * @fileOverview An AI flow to generate a player development plan.
 *
 * - generatePlayerDevelopmentPlanFlow - A function that analyzes a player's stats and recent form to create a development plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { PlayerDevelopmentPlanOutput } from '@/ai/schemas';
import { PlayerDevelopmentPlanPromptInputSchema, PlayerDevelopmentPlanSchema, AvailableDrillSchema } from '@/ai/schemas';
import { getDrills } from '@/lib/actions/drills';

const generatePlanPrompt = ai.definePrompt({
    name: 'generatePlayerDevelopmentPlanPrompt',
    input: { schema: PlayerDevelopmentPlanPromptInputSchema },
    output: { schema: PlayerDevelopmentPlanSchema },
    prompt: `You are an expert cricket coach and performance analyst. Your task is to create a personalized development plan for a player named {{{playerName}}}.

Analyze their overall career statistics and recent performances to identify key strengths and areas for improvement.

Then, from the provided list of available training drills, select 1 to 2 drills that specifically target the identified weaknesses. For each selected drill, provide a justification explaining why it is the right choice for this player's development.

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

**Available Drills Library:**
{{{json availableDrills}}}

Based on all this data, provide your analysis in the specified JSON format.
`,
});

export const generatePlayerDevelopmentPlanFlow = ai.defineFlow(
    {
        name: 'generatePlayerDevelopmentPlanFlow',
        inputSchema: PlayerDevelopmentPlanPromptInputSchema,
        outputSchema: PlayerDevelopmentPlanSchema,
    },
    async (input) => {
        // Fetch all available drills to pass to the prompt
        const drills = await getDrills();
        const availableDrills: z.infer<typeof AvailableDrillSchema>[] = drills.map(d => ({
            drillId: d.drillId,
            name: d.name,
            category: d.category,
            description: d.description,
        }));
        
        const { output } = await generatePlanPrompt({ ...input, availableDrills });
        return output!;
    }
);
