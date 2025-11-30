

'use server';

import { getCompetitions } from './competitions';
import { getLeaderboards } from '../services/stats-service';
import type { Competition, LeaderboardPlayer, AwardsData } from '@/lib/data';

export async function getAwardsData(): Promise<AwardsData> {
    const [competitions, { topRunScorers, topWicketTakers }] = await Promise.all([
        getCompetitions(),
        getLeaderboards(), // This gets the overall leaders
    ]);

    const trophyCabinet = competitions.filter(c => c.status === 'Completed' && c.winnerTeamId);
    const topRunScorer = topRunScorers.length > 0 ? topRunScorers[0] : null;
    const topWicketTaker = topWicketTakers.length > 0 ? topWicketTakers[0] : null;

    return {
        trophyCabinet,
        topRunScorer,
        topWicketTaker,
    };
}
