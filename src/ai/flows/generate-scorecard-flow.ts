'use server';
/**
 * @fileOverview An AI flow to generate a realistic cricket match scorecard.
 *
 * - generateScorecard - A function that generates a complete scorecard for a T20 match.
 * - GenerateScorecardInput - The input type for the generateScorecard function.
 * - GenerateScorecardOutput - The return type for the generateScorecard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Innings } from '@/lib/data';

// Zod Schemas for AI output validation, mirroring the types in lib/data.ts
const BatsmanStatsSchema = z.object({
  name: z.string().describe("Player's name"),
  status: z.string().describe("How the batsman was out, or 'not out'"),
  runs: z.number().describe("Runs scored"),
  balls: z.number().describe("Balls faced"),
  fours: z.number().describe("Number of 4s hit"),
  sixes: z.number().describe("Number of 6s hit"),
  strikeRate: z.number().describe("Runs scored per 100 balls"),
});

const BowlerStatsSchema = z.object({
  name: z.string().describe("Bowler's name"),
  overs: z.number().describe("Overs bowled"),
  maidens: z.number().describe("Maiden overs bowled"),
  runs: z.number().describe("Runs conceded"),
  wickets: z.number().describe("Wickets taken"),
  economy: z.number().describe("Runs conceded per over"),
});

const FallOfWicketSchema = z.object({
  runs: z.number().describe("Team's total runs when the wicket fell"),
  wicket: z.number().describe("Wicket number (e.g., 1 for the first wicket)"),
  batsmanName: z.string().describe("Name of the batsman who got out"),
  over: z.number().describe("The over in which the wicket fell (e.g., 5.2)"),
});

const ExtrasSchema = z.object({
    total: z.number().describe("Total extra runs"),
    details: z.string().describe("Details of extras, e.g., (w 5, nb 1, b 2, lb 2)"),
});

const InningsSchema = z.object({
  teamName: z.string().describe("Name of the batting team"),
  totalRuns: z.number().describe("Total runs scored by the team"),
  wickets: z.number().describe("Total wickets lost by the team"),
  overs: z.number().describe("Total overs played by the team"),
  battingCard: z.array(BatsmanStatsSchema).describe("List of batsmen and their stats"),
  bowlingCard: z.array(BowlerStatsSchema).describe("List of bowlers and their stats for this innings"),
  fallOfWickets: z.array(FallOfWicketSchema).describe("List of wickets that fell"),
  extras: ExtrasSchema.describe("Extras conceded by the bowling team"),
});

// Input and Output types for the flow
export const GenerateScorecardInputSchema = z.object({
  teamAName: z.string(),
  teamAPlayers: z.array(z.string()).min(11).max(11).describe("An array of 11 player names for Team A."),
  teamBName: z.string(),
  teamBPlayers: z.array(z.string()).min(11).max(11).describe("An array of 11 player names for Team B."),
});
export type GenerateScorecardInput = z.infer<typeof GenerateScorecardInputSchema>;

export const GenerateScorecardOutputSchema = z.object({
  innings1: InningsSchema,
  innings2: InningsSchema,
});
export type GenerateScorecardOutput = z.infer<typeof GenerateScorecardOutputSchema>;


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
