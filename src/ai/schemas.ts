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

// From generate-opposition-analysis-flow.ts
export const OppositionAnalysisInputSchema = z.object({
  opponentTeamName: z.string(),
  opponentTeamStats: z.string().describe("JSON string of the opponent team's overall season stats."),
  opponentKeyPlayers: z.string().describe("JSON string of the opponent's key players and their stats."),
});
export type OppositionAnalysisInput = z.infer<typeof OppositionAnalysisInputSchema>;

// From umpire-review-flow.ts
export const UmpireReviewInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a cricket delivery, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type UmpireReviewInput = z.infer<typeof UmpireReviewInputSchema>;

export const UmpireDecisionSchema = z.object({
  decision: z.enum(['Out', 'Not Out', "Umpire's Call"]).describe("The final decision based on the analysis."),
  pitching: z.enum(['In-Line', 'Outside Leg', 'Outside Off']).describe("Where the ball pitched in relation to the wickets."),
  impact: z.enum(['In-Line', 'Outside Leg', 'Outside Off', 'Too High']).describe("Where the ball impacted the batsman's pads."),
  wickets: z.enum(['Hitting', 'Missing', "Umpire's Call"]).describe("Whether the ball's trajectory was going on to hit the wickets."),
  justification: z.string().describe("A brief, step-by-step justification for the final decision, explaining each component (pitching, impact, wickets)."),
});
export type UmpireDecisionOutput = z.infer<typeof UmpireDecisionSchema>;


// From generate-live-match-update-flow.ts
export const LiveMatchUpdateInputSchema = z.object({
    battingTeamName: z.string(),
    bowlingTeamName: z.string(),
    currentScore: z.number(),
    wickets: z.number(),
    overs: z.number(),
    targetScore: z.number().optional().describe("The target score to win. Only applicable in the second innings."),
});
export type LiveMatchUpdateInput = z.infer<typeof LiveMatchUpdateInputSchema>;

export const LiveMatchUpdateOutputSchema = z.object({
    winProbability: z.number().min(0).max(100).describe("The batting team's win probability percentage (0-100)."),
    summary: z.string().describe("A very brief, one-sentence summary explaining the current win probability."),
    tacticalSuggestions: z.array(z.string()).describe("A list of 2-3 brief, actionable tactical suggestions for the batting or bowling captain.").optional(),
});
export type LiveMatchUpdateOutput = z.infer<typeof LiveMatchUpdateOutputSchema>;

// From scout-player-flow.ts
export const ScoutingReportInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a cricket player, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  playerName: z.string().describe("The name of the player being scouted."),
  skill: z.enum(['Batting', 'Bowling']).describe("The primary skill to analyze (either Batting or Bowling).")
});
export type ScoutingReportInput = z.infer<typeof ScoutingReportInputSchema>;

export const ScoutingReportSchema = z.object({
    strengths: z.array(z.string()).describe("A list of 2-3 key technical strengths observed in the photo."),
    areasForImprovement: z.array(z.string()).describe("A list of 2-3 technical areas that could be improved."),
    professionalComparison: z.string().describe("A comparison to a well-known professional player with a similar style, with a brief explanation."),
    summary: z.string().describe("A concise, one-paragraph summary of the player's potential based on the visual analysis."),
});
export type ScoutingReportOutput = z.infer<typeof ScoutingReportSchema>;


// From generate-highlight-reel-flow.ts
export const HighlightEventSchema = z.object({
  over: z.string().describe("The over in which the event occurred, e.g., '19.2'."),
  description: z.string().describe("A short, exciting, one-sentence description of the key moment."),
  imageUrl: z.string().url().describe("The public URL of the generated image highlight in Firebase Storage."),
});
export type HighlightEvent = z.infer<typeof HighlightEventSchema>;

export const HighlightReelSchema = z.object({
  highlights: z.array(HighlightEventSchema).describe("A list of key moments from the match, ordered chronologically."),
});
export type HighlightReelOutput = z.infer<typeof HighlightReelSchema>;


// From generate-player-performance-forecast-flow.ts
export const PlayerPerformanceForecastInputSchema = z.object({
  playerId: z.string(),
  matchId: z.string(),
});
export type PlayerPerformanceForecastInput = z.infer<typeof PlayerPerformanceForecastInputSchema>;

export const PlayerPerformanceForecastOutputSchema = z.object({
  predictedPerformance: z.string().describe("A quantitative prediction of the player's performance, e.g., '30-45 runs' or '1-2 wickets'."),
  justification: z.string().describe("A multi-sentence justification for the prediction, referencing the player's form, opponent, and conditions."),
});
export type PlayerPerformanceForecastOutput = z.infer<typeof PlayerPerformanceForecastOutputSchema>;

export const PlayerPerformanceForecastPromptInputSchema = z.object({
  playerName: z.string(),
  playerRole: z.string().describe("The player's primary role, e.g., Batsman, Bowler, All-rounder."),
  playerStats: SimplifiedPlayerStatsSchema,
  recentForm: z.array(z.object({
    opponent: z.string(),
    runsScored: z.number().optional(),
    battingStatus: z.string().optional(),
    wicketsTaken: z.number().optional(),
    runsConceded: z.number().optional(),
  })),
  matchContext: z.object({
    opponentName: z.string(),
    venueName: z.string(),
  }),
  weatherForecast: GetMatchForecastOutputSchema,
  opponentTeamStats: z.any().describe("JSON string of the opponent team's overall season stats."),
});
