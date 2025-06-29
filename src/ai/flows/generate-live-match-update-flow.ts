
'use server';
/**
 * @fileOverview An AI flow to generate a live, qualitative update on a cricket match in progress.
 * 
 * - generateLiveMatchUpdate - A function that analyzes the current score to provide an update.
 * - LiveMatchUpdateInput - The input type for the generateLiveMatchUpdate function.
 * - LiveMatchUpdateOutput - The return type for the generateLiveMatchUpdate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { LiveMatchUpdateInputSchema, LiveMatchUpdateOutputSchema, type LiveMatchUpdateOutput, type LiveMatchUpdateInput } from '@/ai/schemas';

const generateLiveMatchUpdatePrompt = ai.definePrompt({
    name: 'generateLiveMatchUpdatePrompt',
    input: { schema: LiveMatchUpdateInputSchema },
    output: { schema: LiveMatchUpdateOutputSchema },
    prompt: `You are an expert cricket commentator providing a mid-game update for a T20 match. 
The batting team is {{{battingTeamName}}}.

Current Score: {{{currentScore}}} runs for {{{wickets}}} wickets.
Overs Completed: {{{overs}}}.

Based on this information, provide a concise, one or two-sentence tactical summary. Comment on the current run rate, project a final score after 20 overs, and assess whether they are in a strong or weak position.

Provide only the analysis text in your response.
`,
});

const generateLiveMatchUpdateFlow = ai.defineFlow(
    {
        name: 'generateLiveMatchUpdateFlow',
        inputSchema: LiveMatchUpdateInputSchema,
        outputSchema: LiveMatchUpdateOutputSchema,
    },
    async (input) => {
        const { output } = await generateLiveMatchUpdatePrompt(input);
        return output!;
    }
);

export async function generateLiveMatchUpdate(input: LiveMatchUpdateInput): Promise<LiveMatchUpdateOutput> {
    return generateLiveMatchUpdateFlow(input);
}
