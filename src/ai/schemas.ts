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


// From generate-match-report-flow.ts
export const GenerateMatchReportInputSchema = z.object({
  teamAName: z.string(),
  teamBName: z.string(),
  innings1: InningsSchema,
  innings2: InningsSchema,
});
export type GenerateMatchReportInput = z.infer<typeof GenerateMatchReportInputSchema>;

// From get-match-forecast-flow.ts
export const WeatherForecastInputSchema = z.object({
    location: z.string().describe("The city or venue name, e.g., 'Lord's Cricket Ground, London'."),
    date: z.string().describe("The date of the match in ISO 8601 format."),
});
export type WeatherForecastInput = z.infer<typeof WeatherForecastInputSchema>;

export const WeatherDetailsSchema = z.object({
    temperature: z.number().describe("The average temperature in Celsius."),
    condition: z.enum(["Sunny", "Cloudy", "Rain", "Showers", "Storm"]).describe("The general weather condition."),
    precipitationChance: z.number().min(0).max(100).describe("The percentage chance of precipitation."),
    windSpeed: z.number().describe("The average wind speed in km/h."),
});

export const GetMatchForecastOutputSchema = z.object({
    summary: z.string().describe("A concise, one-sentence summary of the weather forecast for the match."),
    details: WeatherDetailsSchema,
});
export type GetMatchForecastOutput = z.infer<typeof GetMatchForecastOutputSchema>;

// From generate-player-of-the-match-flow.ts
export const PlayerOfTheMatchSchema = z.object({
    name: z.string().describe("The full name of the player of the match."),
    teamName: z.string().describe("The name of the player's team."),
    justification: z.string().describe("A short paragraph explaining why this player was chosen, citing their key stats (runs, balls, wickets, economy etc)."),
});
export type PlayerOfTheMatchOutput = z.infer<typeof PlayerOfTheMatchSchema>;

// From generate-dream-team-flow.ts
export const SimplifiedPlayerStatsSchema = z.object({
  matchesPlayed: z.number(),
  totalRuns: z.number(),
  battingAverage: z.number(),
  strikeRate: z.number(),
  wicketsTaken: z.number(),
  bowlingAverage: z.number(),
  economyRate: z.number(),
});

export const DreamTeamPlayerInputSchema = z.object({
  personId: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  stats: SimplifiedPlayerStatsSchema,
});

export const SelectedPlayerSchema = z.object({
  name: z.string().describe("The full name of the selected player."),
  justification: z.string().describe("A brief justification for why this player was selected for the team, citing their key stats."),
});
export const DreamTeamOutputSchema = z.object({
  team: z.array(SelectedPlayerSchema).length(11, { message: "The team must have exactly 11 players." }),
});
export type DreamTeamOutput = z.infer<typeof DreamTeamOutputSchema>;


// From select-lineup-flow.ts
export const RosterPlayerSchema = z.object({
  personId: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  stats: SimplifiedPlayerStatsSchema,
});

export const MatchContextSchema = z.object({
  matchId: z.string(),
  competitionName: z.string(),
  opponentName: z.string(),
  venueName: z.string(),
  isHomeMatch: z.boolean(),
});

export const SelectLineupPromptInputSchema = z.object({
  rosterWithStats: z.array(RosterPlayerSchema),
  matchContext: MatchContextSchema,
  weatherForecast: GetMatchForecastOutputSchema,
});

export const SelectLineupOutputSchema = z.object({
  playerIds: z.array(z.string()).length(11, { message: "The lineup must have exactly 11 players." }),
  justification: z.string().describe("A brief, one-paragraph summary explaining the key decisions for the team selection, considering balance, form, and conditions."),
});
export type SelectLineupOutput = z.infer<typeof SelectLineupOutputSchema>;


// From generate-player-development-plan-flow.ts
export const RecentPerformanceSchema = z.object({
    opponent: z.string(),
    runs: z.number(),
});

export const PlayerDevelopmentPlanPromptInputSchema = z.object({
    playerName: z.string(),
    playerStats: SimplifiedPlayerStatsSchema,
    recentPerformances: z.array(RecentPerformanceSchema),
});

export const PlayerDevelopmentPlanSchema = z.object({
  strengths: z.array(z.string()).describe("A list of the player's key strengths based on their stats."),
  weaknesses: z.array(z.string()).describe("A list of areas where the player can improve based on their stats and recent form."),
  recommendations: z.array(z.object({
    title: z.string().describe("A short, descriptive title for the recommended drill or focus area."),
    description: z.string().describe("A detailed, step-by-step description of the drill or what the player should focus on to improve."),
  })).length(3, { message: "Provide exactly three targeted recommendations." }).describe("A list of three personalized recommendations and drills."),
});
export type PlayerDevelopmentPlanOutput = z.infer<typeof PlayerDevelopmentPlanSchema>;
