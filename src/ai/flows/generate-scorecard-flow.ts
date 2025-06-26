'use server';
/**
 * @fileOverview An AI flow to generate a realistic cricket match scorecard.
 *
 * - generateScorecard - A function that generates a complete scorecard for a T20 match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateScorecardInputSchema, GenerateScorecardOutputSchema, type GenerateScorecardInput, type GenerateScorecardOutput } from '@/ai/schemas';

const prompt = ai.definePrompt({
  name: 'generateScorecardPrompt',
  input: { schema: GenerateScorecardInputSchema },
  output: { schema: GenerateScorecardOutputSchema },
  prompt: `You are a cricket expert. Generate a realistic, completed scorecard for a fictional T20 cricket match between two teams: {{{teamAName}}} and {{{teamBName}}}.

First, decide which team bats first and which team wins. The scorecard should reflect a plausible match scenario.

The list of 11 players for {{{teamAName}}} is: {{#each teamAPlayers}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
The list of 11 players for {{{teamBName}}} is: {{#each teamBPlayers}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Use ONLY the player names provided for each team when generating the batting and bowling cards.

The first innings should be for one team, and the second innings for the other.

For each innings, provide the following:
- A full batting card for the 11 players from the provided list. Some can be 'Did not bat'.
- A realistic bowling card using players from the opposing team's list.
- A plausible fall of wickets sequence.
- A summary of extras.
- Ensure all statistics (runs, balls, strike rates, economy rates, totals) are mathematically correct and consistent with each other.

The team names in the innings data must exactly match "{{{teamAName}}}" and "{{{teamBName}}}".
The output must be in the specified JSON format. Do not include any explanatory text.`,
});

const generateScorecardFlow = ai.defineFlow(
  {
    name: 'generateScorecardFlow',
    inputSchema: GenerateScorecardInputSchema,
    outputSchema: GenerateScorecardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateScorecard(input: GenerateScorecardInput): Promise<GenerateScorecardOutput> {
    // In a real app, we might check if a scorecard already exists in the DB first.
    // For now, we'll generate a new one every time.
    return generateScorecardFlow(input);
}
