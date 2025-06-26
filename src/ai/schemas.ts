/**
 * @fileOverview Shared Zod schemas for AI flows.
 * This file does not contain 'use server' and can be imported safely on the client and server.
 */
import { z } from 'zod';

// From generate-scorecard-flow.ts
export const BatsmanStatsSchema = z.object({
  name: z.string().describe("Player's name"),
  status: z.string().describe("How the batsman was out, or 'not out'"),
  runs: z.number().describe("Runs scored"),
  balls: z.number().describe("Balls faced"),
  fours: z.number().describe("Number of 4s hit"),
  sixes: z.number().describe("Number of 6s hit"),
  strikeRate: z.number().describe("Runs scored per 100 balls"),
});

export const BowlerStatsSchema = z.object({
  name: z.string().describe("Bowler's name"),
  overs: z.number().describe("Overs bowled"),
  maidens: z.number().describe("Maiden overs bowled"),
  runs: z.number().describe("Runs conceded"),
  wickets: z.number().describe("Wickets taken"),
  economy: z.number().describe("Runs conceded per over"),
});

export const FallOfWicketSchema = z.object({
  runs: z.number().describe("Team's total runs when the wicket fell"),
  wicket: z.number().describe("Wicket number (e.g., 1 for the first wicket)"),
  batsmanName: z.string().describe("Name of the batsman who got out"),
  over: z.number().describe("The over in which the wicket fell (e.g., 5.2)"),
});

export const ExtrasSchema = z.object({
    total: z.number().describe("Total extra runs"),
    details: z.string().describe("Details of extras, e.g., (w 5, nb 1, b 2, lb 2)"),
});

export const InningsSchema = z.object({
  teamName: z.string().describe("Name of the batting team"),
  totalRuns: z.number().describe("Total runs scored by the team"),
  wickets: z.number().describe("Total wickets lost by the team"),
  overs: z.number().describe("Total overs played by the team"),
  battingCard: z.array(BatsmanStatsSchema).describe("List of batsmen and their stats"),
  bowlingCard: z.array(BowlerStatsSchema).describe("List of bowlers and their stats for this innings"),
  fallOfWickets: z.array(FallOfWicketSchema).describe("List of wickets that fell"),
  extras: ExtrasSchema.describe("Extras conceded by the bowling team"),
});

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


// From generate-match-summary-flow.ts
export const GenerateMatchSummaryInputSchema = z.object({
  teamAName: z.string(),
  teamBName: z.string(),
  innings1: InningsSchema,
  innings2: InningsSchema,
});
export type GenerateMatchSummaryInput = z.infer<typeof GenerateMatchSummaryInputSchema>;
