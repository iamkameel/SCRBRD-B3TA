'use server';
/**
 * @fileOverview An AI flow to generate a cricket match report.
 *
 * - generateMatchReport - A function that generates a report for a completed match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateMatchReportInputSchema, type GenerateMatchReportInput } from '@/ai/schemas';

// The flow itself will use a slightly different input for the prompt, one with stringified JSON
const PromptInputSchema = z.object({
    teamAName: z.string(),
    teamBName: z.string(),
    innings1: z.string(),
    innings2: z.string(),
});

const generateMatchReportPrompt = ai.definePrompt({
    name: 'generateMatchReportPrompt',
    input: { schema: PromptInputSchema },
    output: { format: 'text' },
    prompt: `You are a sports journalist writing a match report for a newspaper. Based on the following JSON data for two innings of a T20 cricket match, write an engaging, multi-paragraph match report.
The report should:
1.  Have a compelling headline.
2.  State the final result in the opening paragraph, including which team won and by how many runs or wickets.
3.  Mention the total scores for both teams.
4.  Narrate the key phases of the match (e.g., the powerplay, middle overs, death overs).
5.  Highlight at least two key player performances with descriptive language (e.g., "John Doe's blistering 78 off 40 balls" or "Jane Smith's crucial 4 for 25").
6.  Include at least one fictional, plausible quote from a player or captain.
7.  Describe the turning point or key moment of the match.
8.  Maintain a professional and journalistic tone throughout.

Team A: {{{teamAName}}}
Team B: {{{teamBName}}}

Innings 1 Data:
{{{innings1}}}

Innings 2 Data:
{{{innings2}}}

Generate only the match report text, starting with the headline.`
});


const generateMatchReportFlow = ai.defineFlow(
  {
    name: 'generateMatchReportFlow',
    inputSchema: GenerateMatchReportInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await generateMatchReportPrompt({
        ...input,
        innings1: JSON.stringify(input.innings1, null, 2),
        innings2: JSON.stringify(input.innings2, null, 2),
    });
    return output!;
  }
);

export async function generateMatchReport(input: GenerateMatchReportInput): Promise<string> {
    return generateMatchReportFlow(input);
}
