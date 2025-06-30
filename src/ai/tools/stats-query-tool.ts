
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';

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
    description: 'Returns cricket statistics for players and teams. Use this to find out who has the most runs, most wickets, or to see team standings.',
    inputSchema: z.object({
        statType: StatTypeSchema.describe("The type of statistic to retrieve."),
    }),
    outputSchema: z.union([
        z.array(PlayerStatSchema),
        z.array(TeamStatSchema),
    ]),
  },
  async ({ statType }) => {
    if (statType === 'top_run_scorers' || statType === 'top_wicket_takers') {
        const { topRunScorers, topWicketTakers } = await getLeaderboards();
        if (statType === 'top_run_scorers') {
            return topRunScorers.map(p => ({ name: `${p.firstName} ${p.lastName}`, value: p.stats.totalRuns }));
        }
        return topWicketTakers.map(p => ({ name: `${p.firstName} ${p.lastName}`, value: p.stats.wicketsTaken }));
    }

    if (statType === 'team_standings') {
        const standings = await getTeamStandings();
        return standings.map(t => ({ name: t.name, wins: t.stats.matchesWon, nrr: t.stats.netRunRate }));
    }
    
    throw new Error('Invalid stat type');
  }
);
