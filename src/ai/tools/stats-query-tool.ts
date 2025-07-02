
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import { getSeasons } from '@/lib/actions/seasons';
import { getCompetitions } from '@/lib/actions/competitions';
import { getTeams } from '@/lib/actions/teams';

const StatTypeSchema = z.enum(["top_run_scorers", "top_wicket_takers", "team_standings"]);

const PlayerStatSchema = z.object({
    name: z.string(),
    value: z.number(),
});

const TeamStatSchema = z.object({
    name: z.string(),
    wins: z.number(),
    nrr: z.number(),
});

export const getCricketStats = ai.defineTool(
  {
    name: 'getCricketStats',
    description: 'Returns cricket statistics for players and teams. Use this to find out who has the most runs, most wickets, or to see team standings. You can filter by season, competition, or team.',
    inputSchema: z.object({
        statType: StatTypeSchema.describe("The type of statistic to retrieve."),
        seasonName: z.string().optional().describe("The name of the season to filter by, e.g., '2024/25 Season'"),
        competitionName: z.string().optional().describe("The name of the competition to filter by, e.g., 'KZN Open League'"),
        teamName: z.string().optional().describe("The name of the team to filter by."),
    }),
    outputSchema: z.union([
        z.array(PlayerStatSchema),
        z.array(TeamStatSchema),
    ]),
  },
  async ({ statType, seasonName, competitionName, teamName }) => {
    let seasonId: string | undefined;
    let competitionId: string | undefined;
    let teamId: string | undefined;

    // Look up IDs from names
    if (seasonName) {
      const seasons = await getSeasons();
      seasonId = seasons.find(s => s.name.toLowerCase() === seasonName.toLowerCase())?.seasonId;
    }
    if (competitionName) {
      const competitions = await getCompetitions();
      competitionId = competitions.find(c => c.name.toLowerCase() === competitionName.toLowerCase())?.competitionId;
    }
    if (teamName) {
      const teams = await getTeams();
      teamId = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase())?.teamId;
    }
    
    const filters = { seasonId, competitionId, teamId };

    if (statType === 'top_run_scorers' || statType === 'top_wicket_takers') {
        const { topRunScorers, topWicketTakers } = await getLeaderboards(filters);
        if (statType === 'top_run_scorers') {
            return topRunScorers.map(p => ({ name: `${p.firstName} ${p.lastName}`, value: p.stats.totalRuns }));
        }
        return topWicketTakers.map(p => ({ name: `${p.firstName} ${p.lastName}`, value: p.stats.wicketsTaken }));
    }

    if (statType === 'team_standings') {
        // Note: team standings are not currently filterable in this way. This could be a future enhancement.
        // For now, it returns global standings regardless of filters.
        const standings = await getTeamStandings();
        return standings.map(t => ({ name: t.name, wins: t.stats.matchesWon, nrr: t.stats.netRunRate }));
    }
    
    throw new Error('Invalid stat type');
  }
);
