
import { getPlayers, getPerson } from '@/lib/actions/players';
import { getTeamRoster, getTeamStats, getTeams, getTeamsByDivision } from '@/lib/actions/teams';
import { getPlayerStats } from '@/lib/actions/stats';
import type { Person, TeamStats, LeaderboardPlayer, StandingTeam, PlayerStats } from '@/lib/data';

export async function getLeaderboards(filters: { divisionId?: string; teamClass?: string; seasonId?: string; competitionId?: string; teamId?: string } = {}): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    let players: Person[];

    if (filters.teamId) {
        const roster = await getTeamRoster(filters.teamId);
        const playerPromises = roster.filter(m => m.role === 'Player').map(m => getPerson(m.personId));
        players = (await Promise.all(playerPromises)).filter((p): p is Person => p !== null);
    } else {
        const teams = await getTeamsByDivision(filters.divisionId);
        const teamsToConsider = filters.teamClass ? teams.filter(t => t.teamClass === filters.teamClass) : teams;

        const playerIds = new Set<string>();
        for(const team of teamsToConsider) {
            const roster = await getTeamRoster(team.teamId);
            roster.forEach(member => {
                if(member.role === 'Player') playerIds.add(member.personId);
            });
        }
        
        if (playerIds.size === 0) {
            return { topRunScorers: [], topWicketTakers: [] };
        }

        const playerPromises = Array.from(playerIds).map(id => getPerson(id));
        players = (await Promise.all(playerPromises)).filter((p): p is Person => p !== null);
    }
    
    const playersWithStats: LeaderboardPlayer[] = await Promise.all(
        players.map(async (player) => {
            const stats = await getPlayerStats(player.personId, { seasonId: filters.seasonId, competitionId: filters.competitionId });
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


export async function getTeamStandings(divisionId?: string, teamClass?: string): Promise<StandingTeam[]> {
    const teamsInDivision = divisionId ? await getTeamsByDivision(divisionId) : await getTeams();
    const teams = teamClass ? teamsInDivision.filter(t => t.teamClass === teamClass) : teamsInDivision;

    const teamsWithStats: StandingTeam[] = await Promise.all(
        teams.map(async (team) => {
            const stats = await getTeamStats(team.teamId);
            return { ...team, stats };
        })
    );

    const sortedStandings = teamsWithStats.sort((a, b) => {
        if (b.stats.matchesWon !== a.stats.matchesWon) {
            return b.stats.matchesWon - a.stats.matchesWon;
        }
        return b.stats.netRunRate - a.stats.netRunRate;
    });

    return sortedStandings;
}
