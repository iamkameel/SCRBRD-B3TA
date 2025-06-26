'use server';
/**
 * @fileOverview An AI flow to generate a cricket match summary.
 *
 * - generateMatchSummary - A function that generates a summary for a completed match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateMatchSummaryInputSchema, type GenerateMatchSummaryInput } from '@/ai/schemas';

// The flow itself will use a slightly different input for the prompt, one with stringified JSON
const PromptInputSchema = z.object({
    teamAName: z.string(),
    teamBName: z.string(),
    innings1: z.string(),
    innings2: z.string(),
});

const generateMatchSummaryPrompt = ai.definePrompt({
    name: 'generateMatchSummaryPrompt',
    input: { schema: PromptInputSchema },
    output: { format: 'text' },
    prompt: `You are a sports journalist writing a match report for a newspaper. Based on the following JSON data for two innings of a T20 cricket match, write a concise, engaging, one-paragraph summary.
The summary should:
1.  State the final result, including which team won and by how many runs or wickets.
2.  Mention the total scores for both teams.
3.  Highlight the top-scoring batsman and the best bowler from either team, mentioning their key stats (e.g., "John Doe's blistering 78 off 40 balls" or "Jane Smith's crucial 4 for 25").
4.  Briefly describe the turning point or key moment of the match.
5.  Maintain a professional and journalistic tone.

Team A: {{{teamAName}}}
Team B: {{{teamBName}}}

Innings 1 Data:
{{{innings1}}}

Innings 2 Data:
{{{innings2}}}

Generate only the summary paragraph.`
});


const generateMatchSummaryFlow = ai.defineFlow(
  {
    name: 'generateMatchSummaryFlow',
    inputSchema: GenerateMatchSummaryInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await generateMatchSummaryPrompt({
        ...input,
        innings1: JSON.stringify(input.innings1, null, 2),
        innings2: JSON.stringify(input.innings2, null, 2),
    });
    return output!;
  }
);

export async function generateMatchSummary(input: GenerateMatchSummaryInput): Promise<string> {
    return generateMatchSummaryFlow(input);
}
