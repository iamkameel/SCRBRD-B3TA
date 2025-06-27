'use server';
/**
 * @fileOverview An AI flow to generate a "Dream Team" from available players.
 * 
 * - generateDreamTeam - A function that analyzes all players and selects a balanced team.
 * - DreamTeamOutput - The return type for the generateDreamTeam function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPlayers, getPlayerStats } from '@/lib/actions/players';
import { DreamTeamOutputSchema, SimplifiedPlayerStatsSchema, DreamTeamPlayerInputSchema, type DreamTeamOutput } from '@/ai/schemas';

const PromptInputSchema = z.object({
  players: z.array(DreamTeamPlayerInputSchema),
});

const generateDreamTeamPrompt = ai.definePrompt({
    name: 'generateDreamTeamPrompt',
    input: { schema: PromptInputSchema },
    output: { schema: DreamTeamOutputSchema },
    prompt: `You are an expert cricket selector. Your task is to select a "Dream Team" of exactly 11 players from the provided list of available players and their statistics.

The team should be well-balanced for a T20 match, typically consisting of:
- 4-5 specialist batsmen
- 1 wicket-keeper (who can also bat)
- 1 all-rounder
- 4-5 specialist bowlers (a mix of pace and spin if possible)

Analyze the JSON data of players below. For each of the 11 players you select, provide a brief justification for your choice, highlighting their key performance stats (e.g., high batting average, good strike rate, low bowling economy, high wicket count).

Pay attention to player roles (e.g., 'Player', 'Captain') to help make your selections. A player with a 'Captain' role might be a good leadership choice.

Available Players Data:
{{{json players}}}

Select exactly 11 players and provide your response in the specified JSON format.
`,
});

const generateDreamTeamFlow = ai.defineFlow(
    {
        name: 'generateDreamTeamFlow',
        inputSchema: z.void(),
        outputSchema: DreamTeamOutputSchema,
    },
    async () => {
        const allPlayers = await getPlayers();
        const playersWithStats = await Promise.all(
            allPlayers
                .filter(p => p.roles.includes('Player')) // Only consider players
                .map(async (player) => {
                    const stats = await getPlayerStats(player.personId);
                    // Map full stats to the simplified schema for the prompt
                    const simplifiedStats: z.infer<typeof SimplifiedPlayerStatsSchema> = {
                        matchesPlayed: stats.matchesPlayed,
                        totalRuns: stats.totalRuns,
                        battingAverage: parseFloat(stats.battingAverage.toFixed(2)),
                        strikeRate: parseFloat(stats.strikeRate.toFixed(2)),
                        wicketsTaken: stats.wicketsTaken,
                        bowlingAverage: parseFloat(stats.bowlingAverage.toFixed(2)),
                        economyRate: parseFloat(stats.economyRate.toFixed(2)),
                    };

                    return {
                        personId: player.personId,
                        name: `${player.firstName} ${player.lastName}`,
                        roles: player.roles,
                        stats: simplifiedStats,
                    };
                })
        );
        
        // Filter out players with no match data
        const experiencedPlayers = playersWithStats.filter(p => p.stats.matchesPlayed > 0);
        
        if (experiencedPlayers.length < 11) {
            throw new Error('Not enough players with match experience to generate a dream team. At least 11 are required.');
        }

        const { output } = await generateDreamTeamPrompt({ players: experiencedPlayers });
        return output!;
    }
);


export async function generateDreamTeam(): Promise<DreamTeamOutput> {
    return generateDreamTeamFlow();
}
