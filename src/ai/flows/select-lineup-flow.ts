
'use server';
/**
 * @fileOverview An AI flow to select a cricket lineup for a specific match.
 *
 * - selectLineup - A function that analyzes a team's roster, match context, and conditions to select a balanced 11-player lineup.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getMatch } from '@/lib/actions/matches';
import { getTeamRoster, getTeam } from '@/lib/actions/teams';
import { getPlayerStats } from '@/lib/actions/stats';
import { getMatchForecast } from '@/ai/flows/get-match-forecast-flow';
import { RosterPlayerSchema, MatchContextSchema, SelectLineupPromptInputSchema, SelectLineupOutputSchema, type SelectLineupOutput } from '@/ai/schemas';

const prompt = ai.definePrompt({
    name: 'selectLineupPrompt',
    input: { schema: SelectLineupPromptInputSchema },
    output: { schema: SelectLineupOutputSchema },
    prompt: `You are an expert cricket selector. Your task is to select the best possible 11-player lineup for an upcoming match from the provided roster.

Your selection must be based on a comprehensive analysis of the following factors:

1.  **Team Balance:** The team must be well-balanced for a T20 match. Aim for a mix of specialist batsmen, at least one wicket-keeper, one or two all-rounders, and a varied bowling attack (pace and spin).

2.  **Player Form & Stats:** Use the provided player statistics to gauge recent performance. High batting averages/strike rates and low bowling averages/economy rates are desirable. Players with more matches played are generally more reliable.

3.  **Match Context:**
    - Opponent: {{{matchContext.opponentName}}}
    - Competition: {{{matchContext.competitionName}}}
    - Venue: {{{matchContext.venueName}}}

4.  **Weather Forecast:** The forecast is: {{{json weatherForecast}}}.
    - On a "Sunny" day, the pitch might be dry, favoring spinners.
    - If "Rain" or "Showers" are predicted, the conditions might favor seam and swing bowlers.
    - "Cloudy" conditions can also assist swing bowlers.

5.  **Player Roles:** Pay close attention to player roles. The 'Captain' and 'Vice-Captain' are key leaders and should almost always be included if available and in form.

Here is the list of available players on the roster with their career stats. Select exactly 11 players from this list.
Available Roster:
{{{json rosterWithStats}}}

Return your response in the specified JSON format, providing an array of the 11 selected 'personId's and a brief justification for your overall team composition strategy.
`,
});


const selectLineupFlow = ai.defineFlow(
  {
    name: 'selectLineupFlow',
    inputSchema: z.object({ matchId: z.string(), teamId: z.string() }),
    outputSchema: SelectLineupOutputSchema,
  },
  async ({ matchId, teamId }) => {
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found.");

    const team = await getTeam(teamId);
    if (!team) throw new Error("Team not found.");

    const [roster, weatherForecast] = await Promise.all([
        getTeamRoster(teamId),
        getMatchForecast(matchId),
    ]);

    const rosterWithStats = await Promise.all(
        roster
            .filter(p => p.status === 'active') // Only consider active players
            .map(async (member) => {
                const stats = await getPlayerStats(member.personId);
                const simplifiedStats = {
                    matchesPlayed: stats.matchesPlayed,
                    totalRuns: stats.totalRuns,
                    battingAverage: parseFloat(stats.battingAverage.toFixed(2)),
                    strikeRate: parseFloat(stats.strikeRate.toFixed(2)),
                    wicketsTaken: stats.wicketsTaken,
                    bowlingAverage: parseFloat(stats.bowlingAverage.toFixed(2)),
                    economyRate: parseFloat(stats.economyRate.toFixed(2)),
                };

                return {
                    personId: member.personId,
                    name: member.personName,
                    roles: [member.role, ...(member.isCaptain ? ['Captain'] : []), ...(member.isViceCaptain ? ['Vice-Captain'] : [])],
                    stats: simplifiedStats,
                };
            })
    );

    if (rosterWithStats.length < 11) {
        throw new Error(`Not enough active players on the roster to select a team of 11. Found only ${rosterWithStats.length}.`);
    }

    const matchContext: z.infer<typeof MatchContextSchema> = {
        matchId: match.matchId,
        competitionName: match.competitionName,
        opponentName: match.teamAId === teamId ? match.teamBName : match.teamAName,
        venueName: match.fieldName,
        isHomeMatch: match.teamAId === teamId,
    };

    const { output } = await prompt({
        rosterWithStats,
        matchContext,
        weatherForecast,
    });
    
    return output!;
  }
);

export async function selectLineup(input: { matchId: string, teamId: string }): Promise<SelectLineupOutput> {
    return selectLineupFlow(input);
}
