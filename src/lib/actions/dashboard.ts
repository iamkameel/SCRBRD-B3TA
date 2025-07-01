
'use server';

import type { Person, Team, PlayerStats, TeamStats, LeaderboardPlayer, StandingTeam, Match, Field, Competition, AssignmentRequest } from '@/lib/data';
import { getPlayers, getPerson, getPersonLinks } from './players';
import { getTeams, getTeamStats, getTeamRoster, getPersonTeamAssignments, getTeamMatches } from './teams';
import { getPlayerStats } from './stats';
import { getFieldsForGroundskeeper, getFields } from './fields';
import { getMatchesByField, getMatches } from './matches';
import { getCompetitions } from './competitions';
import { getPendingAssignmentRequests } from './requests';
import { getSessionsByTeam } from './sessions';
import { cache } from 'react';


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

export async function getAdminDashboardData() {
    const [
        competitions,
        teams,
        players,
        fields
    ] = await Promise.all([
        getCompetitions(),
        getTeams(),
        getPlayers(),
        getFields()
    ]);

    return {
        kpis: {
            competitions: competitions.length,
            teams: teams.length,
            players: players.length,
            fields: fields.length,
        },
    };
}


export async function getSportsmasterDashboardData() {
    const [
        competitions,
        teams,
        players,
        fields,
        pendingRequests,
    ] = await Promise.all([
        getCompetitions(),
        getTeams(),
        getPlayers(),
        getFields(),
        getPendingAssignmentRequests(),
    ]);

    return {
       kpis: {
            competitions: competitions.length,
            teams: teams.length,
            players: players.length,
            fields: fields.length,
        },
        pendingRequests,
    };
}


export async function getCoachDashboardData(personId: string) {
    const assignments = await getPersonTeamAssignments(personId);
    const coachAssignment = assignments.find(a => ['Coach', 'Assistant Coach', 'Captain', 'Team Manager'].includes(a.role));

    if (!coachAssignment) {
        return { team: null, nextMatch: null, recentMatches: [], teamStats: null, leaderboards: { topRunScorers: [], topWicketTakers: [] }, upcomingSessions: [] };
    }
    
    const teamId = coachAssignment.teamId;
    const [team, allMatches, teamStats, leaderboards, upcomingSessions] = await Promise.all([
        getTeam(teamId),
        getTeamMatches(teamId),
        getTeamStats(teamId),
        getTeamLeaderboard(teamId),
        getSessionsByTeam(teamId),
    ]);

    const now = new Date();
    const nextMatch = allMatches.filter(m => m.status === 'scheduled' && m.dateTime >= now).sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime())[0] || null;
    const recentMatches = allMatches.filter(m => m.status === 'completed').sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime()).slice(0, 3);
    const futureSessions = upcomingSessions.filter(s => s.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
    
    return { team, nextMatch, recentMatches, teamStats, leaderboards, upcomingSessions: futureSessions };
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

export const getGuardianDashboardData = cache(async (personId: string): Promise<{ child: Person, teamName: string, nextMatch: Match | null }[]> => {
    const { children } = await getPersonLinks(personId);
    if (children.length === 0) return [];
    
    const dashboardData = await Promise.all(
        children.map(async (child) => {
            const assignments = await getPersonTeamAssignments(child.personId);
            const primaryTeamAssignment = assignments.find(a => a.role === 'Player');
            const teamName = primaryTeamAssignment ? primaryTeamAssignment.teamName : 'No Team Assigned';
            
            let nextMatch: Match | null = null;
            if (primaryTeamAssignment) {
                const teamMatches = await getTeamMatches(primaryTeamAssignment.teamId);
                nextMatch = teamMatches
                    .filter(m => m.status === 'scheduled' && m.dateTime >= new Date())
                    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0] || null;
            }
            
            return {
                child,
                teamName,
                nextMatch,
            };
        })
    );
    
    return dashboardData;
});
