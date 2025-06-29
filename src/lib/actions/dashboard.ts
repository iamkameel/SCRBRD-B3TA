

'use server';

import type { Person, Team, PlayerStats, TeamStats, LeaderboardPlayer, StandingTeam, Match, Field, Competition, FixtureConflict, FullTransportAssignment } from '@/lib/data';
import { getPlayers, getPerson } from './players';
import { getTeams, getTeamStats, getTeamRoster, getPersonTeamAssignments, getTeamMatches } from './teams';
import { getPlayerStats } from './stats';
import { getFieldsForGroundskeeper, getFields } from './fields';
import { getMatchesByField, getMatches } from './matches';
import { getCompetitions } from './competitions';
import { getFixtureConflicts, getUnconfirmedAssignmentsCount } from './alerts';
import { getSponsors } from './sponsors';
import { getEquipment } from './equipment';
import { getVehicles, getAllTransportAssignments } from './transport';
import { getTransactions } from './financials';

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

export async function getTeamLeaderboard(teamId: string): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    const roster = await getTeamRoster(teamId);
    const playersInRoster = await Promise.all(
        roster.filter(m => m.role === 'Player').map(m => getPerson(m.personId))
    );

    const playersWithStats: LeaderboardPlayer[] = await Promise.all(
        playersInRoster.filter((p): p is Person => p !== null).map(async (player) => {
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

export async function getAdminDashboardData(personId: string) {
    const [
        allMatches,
        topRunScorers,
        topWicketTakers,
        teamStandings,
        allTeams,
        allPlayers,
        allFields,
        allTransactions,
        allSponsors,
        allVehicles,
        allEquipment,
        allCompetitions,
        conflicts,
        allTransportAssignments,
        unconfirmedAssignmentsCount,
    ] = await Promise.all([
        getMatches(),
        getLeaderboards().then(l => l.topRunScorers),
        getLeaderboards().then(l => l.topWicketTakers),
        getTeamStandings(),
        getTeams(),
        getPlayers(),
        getFields(),
        getTransactions(),
        getSponsors(),
        getVehicles(),
        getEquipment(),
        getCompetitions(),
        getFixtureConflicts(),
        getAllTransportAssignments(),
        getUnconfirmedAssignmentsCount(),
    ]);

    return {
        allMatches,
        topRunScorers,
        topWicketTakers,
        teamStandings,
        allTeams,
        allPlayers,
        allFields,
        allTransactions,
        allSponsors,
        allVehicles,
        allEquipment,
        allCompetitions,
        conflicts,
        allTransportAssignments,
        unconfirmedAssignmentsCount,
    };
}


export async function getSportsmasterDashboardData() {
    const [
        allCompetitions,
        allTeams,
        allPlayers,
        allFields,
        conflicts,
        unconfirmedAssignmentsCount,
        teamStandings,
        leaderboards,
    ] = await Promise.all([
        getCompetitions(),
        getTeams(),
        getPlayers(),
        getFields(),
        getFixtureConflicts(),
        getUnconfirmedAssignmentsCount(),
        getTeamStandings(),
        getLeaderboards(),
    ]);

    return {
        allCompetitions,
        allTeams,
        allPlayers,
        allFields,
        conflicts,
        unconfirmedAssignmentsCount,
        teamStandings,
        leaderboards,
    };
}


export async function getCoachDashboardData(personId: string) {
    const assignments = await getPersonTeamAssignments(personId);
    const coachAssignment = assignments.find(a => ['Coach', 'Assistant Coach', 'Captain', 'Team Manager'].includes(a.role));

    if (!coachAssignment) {
        return { team: null, nextMatch: null, recentMatches: [], teamStats: null, leaderboards: { topRunScorers: [], topWicketTakers: [] } };
    }
    
    const teamId = coachAssignment.teamId;
    const [team, allMatches, teamStats, leaderboards] = await Promise.all([
        getTeam(teamId),
        getTeamMatches(teamId),
        getTeamStats(teamId),
        getTeamLeaderboard(teamId),
    ]);

    const now = new Date();
    const nextMatch = allMatches.filter(m => m.status === 'scheduled' && m.dateTime >= now).sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime())[0] || null;
    const recentMatches = allMatches.filter(m => m.status === 'completed').sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime()).slice(0, 3);
    
    return { team, nextMatch, recentMatches, teamStats, leaderboards };
}

export async function getPlayerDashboardData(personId: string) {
    const assignments = await getPersonTeamAssignments(personId);
    const playerAssignment = assignments.find(a => ['Player', 'Captain', 'Vice-Captain'].includes(a.role));

    const playerStats = await getPlayerStats(personId);

    if (!playerAssignment) {
        return { team: null, nextMatch: null, playerStats };
    }
    
    const teamId = playerAssignment.teamId;
    const [team, allMatches] = await Promise.all([
        getTeam(teamId),
        getTeamMatches(teamId),
    ]);

    const now = new Date();
    const nextMatch = allMatches
        .filter(m => m.status === 'scheduled' && m.dateTime >= now)
        .sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime())[0] || null;
    
    return { team, nextMatch, playerStats };
}


export async function getGroundskeeperDashboardData(personId: string) {
    const fields = await getFieldsForGroundskeeper(personId);
    
    const matchesByField: Record<string, Match[]> = {};
    const matchPromises = fields.map(field => getMatchesByField(field.fieldId));
    const matchesForFields = await Promise.all(matchPromises);

    fields.forEach((field, index) => {
        matchesByField[field.fieldId] = matchesForFields[index];
    });
    
    return { fields, matchesByField };
}
