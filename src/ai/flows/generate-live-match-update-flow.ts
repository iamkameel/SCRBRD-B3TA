
'use server';
/**
 * @fileOverview An AI flow to generate a live win probability for a cricket match.
 * 
 * - generateLiveMatchUpdate - A function that analyzes the current score to provide a win probability.
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
    prompt: `You are an expert cricket analyst calculating the win probability and providing tactical advice for a T20 match in real-time.

Current Match State:
- Batting Team: {{{battingTeamName}}}
- Bowling Team: {{{bowlingTeamName}}}
- Score: {{{currentScore}}}/{{{wickets}}}
- Overs Completed: {{{overs}}}.{{{balls}}}
{{#if targetScore}}
- Target Score: {{{targetScore}}}
{{else}}
- This is the first innings.
{{/if}}

Analyze the situation considering the runs scored, wickets lost, and overs remaining.
- In the first innings, project a final score and estimate the probability of that score being a winning one. A good score is typically 180+.
- In the second innings, calculate the required run rate and assess the batting team's chances of reaching the {{{targetScore}}}.

Based on your analysis, provide 2-3 brief, actionable tactical suggestions. These could be for the batting team (e.g., "Look to accelerate the scoring rate against the spinner") or the bowling team (e.g., "Consider bringing on an off-spin bowler to target the left-handed batsman").

Your output must be in the specified JSON format. The 'winProbability' should be for the **batting team**. The 'summary' should be a concise, single sentence justifying your calculation. The 'tacticalSuggestions' should be an array of strings.`,
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
