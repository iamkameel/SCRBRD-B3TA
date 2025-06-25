'use server';

/**
 * @fileOverview Match summary generation flow.
 * 
 * - generateMatchSummary - A function that generates a match summary based on provided player statistics.
 * - MatchSummaryInput - The input type for the generateMatchSummary function.
 * - MatchSummaryOutput - The return type for the generateMatchSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchSummaryInputSchema = z.object({
  team1Name: z.string().describe('The name of the first team.'),
  team2Name: z.string().describe('The name of the second team.'),
  team1Stats: z.string().describe('Player statistics for the first team.'),
  team2Stats: z.string().describe('Player statistics for the second team.'),
  keyHighlights: z.string().describe('Key highlights or turning points of the match.'),
});
export type MatchSummaryInput = z.infer<typeof MatchSummaryInputSchema>;

const MatchSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise and informative summary of the cricket match.'),
});
export type MatchSummaryOutput = z.infer<typeof MatchSummaryOutputSchema>;

export async function generateMatchSummary(input: MatchSummaryInput): Promise<MatchSummaryOutput> {
  return generateMatchSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchSummaryPrompt',
  input: {schema: MatchSummaryInputSchema},
  output: {schema: MatchSummaryOutputSchema},
  prompt: `You are a sports journalist specializing in cricket match reports for newspaper publications.

  Given the following match information, generate a concise and engaging summary, highlighting key moments and top performances.

  Team 1 Name: {{{team1Name}}}
  Team 2 Name: {{{team2Name}}}
  Team 1 Statistics: {{{team1Stats}}}
  Team 2 Statistics: {{{team2Stats}}}
  Key Highlights: {{{keyHighlights}}}
  
  Write a compelling summary suitable for publication.
  `,
});

const generateMatchSummaryFlow = ai.defineFlow(
  {
    name: 'generateMatchSummaryFlow',
    inputSchema: MatchSummaryInputSchema,
    outputSchema: MatchSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
