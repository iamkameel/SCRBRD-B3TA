'use server';

import type { Person, Team, PlayerStats, TeamStats, LeaderboardPlayer, StandingTeam } from '@/lib/data';
import { getPlayers } from './players';
import { getTeams, getTeamStats } from './teams';
import { getPlayerStats } from './stats';

export async function getLeaderboards(): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    const players = await getPlayers();
    
    const playersWithStats: LeaderboardPlayer[] = await Promise.all(
        players.map(async (player) => {
            const stats = await getPlayerStats(player.personId);
            return { ...player, stats };
        })
    );

    const topRunScorers = [...playersWithStats]
        .filter(p => p.stats.totalRuns > 0)
        .sort((a, b) => b.stats.totalRuns - a.stats.totalRuns)
        .slice(0, 5);

    const topWicketTakers = [...playersWithStats]
        .filter(p => p.stats.wicketsTaken > 0)
        .sort((a, b) => b.stats.wicketsTaken - a.stats.wicketsTaken || a.stats.bowlingAverage - b.stats.bowlingAverage)
        .slice(0, 5);
        
    return { topRunScorers, topWicketTakers };
}

export async function getTeamStandings(): Promise<StandingTeam[]> {
    const teams = await getTeams();

    const teamsWithStats: StandingTeam[] = await Promise.all(
        teams.map(async (team) => {
            const stats = await getTeamStats(team.teamId);
            return { ...team, stats };
        })
    );

    // Simple sorting: by wins, then NRR. Can be made more complex later.
    const sortedStandings = teamsWithStats.sort((a, b) => {
        if (b.stats.matchesWon !== a.stats.matchesWon) {
            return b.stats.matchesWon - a.stats.matchesWon;
        }
        return b.stats.netRunRate - a.stats.netRunRate;
    });

    return sortedStandings;
}
