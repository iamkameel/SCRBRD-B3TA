'use server';

import { getLeaderboards as getLeaderboardsFromService, getTeamStandings as getTeamStandingsFromService } from '@/lib/services/stats-service';
import type { StandingTeam, LeaderboardPlayer, Team, Match, Field, Competition, AssignmentRequest, TrainingSession, Person } from '@/lib/data';
import { getTeams, isTeamManagerOrAdmin } from './teams';
import { getMatches, getMatchLineup } from './matches';
import { getFieldsForGroundskeeper, getFields } from './fields';
import { getCompetitions } from './competitions';
import { getPendingAssignmentRequests } from './requests';
import { getSessionsByTeam } from './sessions';
import { cache } from 'react';
import { getPlayers, getPersonTeamAssignments, getPerson } from './players';
import { getVehicles, getMatchTransportAssignments } from './transport';
import { getUserId } from '@/lib/server-auth';
import { getSchools } from './schools';

// Wrapper functions to maintain the existing public API for the dashboard
export async function getLeaderboards(filters: { divisionId?: string; teamClass?: string; seasonId?: string; competitionId?: string; teamId?: string } = {}): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    return getLeaderboardsFromService(filters);
}

export async function getTeamStandings(divisionId?: string, teamClass?: string): Promise<StandingTeam[]> {
    return getTeamStandingsFromService(divisionId, teamClass);
}

export async function getTeamLeaderboard(teamId: string): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    return getLeaderboardsFromService({ teamId });
}


export async function getAdminDashboardData() {
    const [
        competitions,
        schools,
        teams,
        allPeople,
        fields,
        matches,
        vehicles,
        pendingRequests,
    ] = await Promise.all([
        getCompetitions(),
        getSchools(),
        getTeams(),
        getPlayers(),
        getFields(),
        getMatches(),
        getVehicles(),
        getPendingAssignmentRequests(),
    ]);

    const staffRoles = new Set(['Coach', 'Assistant Coach', 'Team Manager', 'Trainer', 'Physiotherapist', 'Doctor', 'Chiropractor', 'Nutritionist', 'First Aid', 'Umpire', 'Scorer', 'Grounds-Keeper', 'Driver', 'Admin', 'Sportsmaster', 'School Admin']);
    const medicalRoles = new Set(['First Aid', 'Doctor', 'Physiotherapist']);
    const officialRoles = new Set(['Umpire', 'Scorer']);
    const groundStaffRoles = new Set(['Grounds-Keeper']);

    let playerCount = 0;
    let staffCount = 0;
    let medicalCount = 0;
    let officialCount = 0;
    let groundStaffCount = 0;

    allPeople.forEach(person => {
        if (person.roles.includes('Player')) {
            playerCount++;
        }
        if (person.roles.some(r => staffRoles.has(r))) {
            staffCount++;
        }
        if (person.roles.some(r => medicalRoles.has(r))) {
            medicalCount++;
        }
        if (person.roles.some(r => officialRoles.has(r))) {
            officialCount++;
        }
        if (person.roles.some(r => groundStaffRoles.has(r))) {
            groundStaffCount++;
        }
    });

    const awardsCount = competitions.filter(c => c.status === 'Completed' && c.winnerTeamId).length;
    
    const now = new Date();
    const liveMatches = matches.filter(m => m.status === 'live');
    const upcomingFixtures = matches.filter(m => m.status === 'scheduled' && m.dateTime > now).slice(0, 5);
    const recentResults = matches.filter(m => m.status === 'completed').slice(0, 5);


    return {
        kpis: {
            competitions: competitions.length,
            schools: schools.length,
            teams: teams.length,
            players: playerCount,
            staff: staffCount,
            medicalSupport: medicalCount,
            fieldsVenues: fields.length,
            officials: officialCount,
            groundStaff: groundStaffCount,
            fixtures: matches.length,
            transport: vehicles.length,
            awards: awardsCount,
        },
        pendingRequests,
        liveMatches,
        upcomingFixtures,
        recentResults,
    };
}


export async function getSportsmasterDashboardData() {
    const [
        competitions,
        teams,
        players,
        fields,
        pendingRequests,
        matches,
    ] = await Promise.all([
        getCompetitions(),
        getTeams(),
        getPlayers(),
        getFields(),
        getPendingAssignmentRequests(),
        getMatches(),
    ]);

    const now = new Date();
    const liveMatches = matches.filter(m => m.status === 'live');
    const upcomingFixtures = matches.filter(m => m.status === 'scheduled' && m.dateTime > now).slice(0, 5);
    const recentResults = matches.filter(m => m.status === 'completed').slice(0, 5);

    return {
       kpis: {
            competitions: competitions.length,
            teams: teams.length,
            players: players.length,
            fields: fields.length,
        },
        pendingRequests,
        matches,
        liveMatches,
        upcomingFixtures,
        recentResults,
    };
}

export async function getTeamManagerDashboardData(personId: string) {
    const assignments = await getPersonTeamAssignments(personId);
    const managedTeamIds = assignments.filter(a => ['Team Manager'].includes(a.role)).map(a => a.teamId);

    if (managedTeamIds.length === 0) {
        return { 
            kpis: { upcomingFixtures: 0, pendingAvailability: 0, transportNeeded: 0, managedTeams: 0 },
            upcomingMatches: [],
            teams: [],
            pendingRequests: [],
        };
    }
    
    const teams = await Promise.all(managedTeamIds.map(id => getTeam(id)));
    const validTeams = teams.filter((t): t is Team => t !== null);

    const [
        allTeamMatches,
        pendingRequests
    ] = await Promise.all([
        Promise.all(managedTeamIds.map(id => getTeamMatches(id))),
        getPendingAssignmentRequests()
    ]);

    const uniqueMatchIds = new Set<string>();
    const allMatches = allTeamMatches.flat().filter(match => {
        if (uniqueMatchIds.has(match.matchId)) return false;
        uniqueMatchIds.add(match.matchId);
        return true;
    });

    const now = new Date();
    const upcomingMatches = allMatches.filter(m => m.status === 'scheduled' && m.dateTime >= now)
                                     .sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());

    let pendingAvailability = 0;
    let transportNeeded = 0;

    for (const match of upcomingMatches) {
        const lineupA = await getMatchLineup(match.matchId, match.teamAId);
        const lineupB = await getMatchLineup(match.matchId, match.teamBId);
        const lineup = [...(lineupA?.playingXI || []), ...(lineupB?.playingXI || [])];
        
        const availabilityMap = match.availability || {};
        const respondedIds = new Set(Object.keys(availabilityMap));
        pendingAvailability += lineup.filter(playerId => !respondedIds.has(playerId)).length;

        const transport = await getMatchTransportAssignments(match.matchId);
        if (transport.length === 0) {
            transportNeeded++;
        }
    }

    const kpis = {
        managedTeams: validTeams.length,
        upcomingFixtures: upcomingMatches.length,
        pendingAvailability,
        transportNeeded,
    };
    
    return {
        kpis,
        upcomingMatches: upcomingMatches.slice(0, 5),
        teams: validTeams,
        pendingRequests,
    };
}


export async function getCoachDashboardData(personId: string) {
    const assignments = await getPersonTeamAssignments(personId);
    // A user is a coach if they have a coaching role on ANY team, regardless of their activeRole.
    const teamManagementRoles = ['Admin', 'Sportsmaster', 'Coach', 'Assistant Coach', 'Team Manager', 'Captain', 'Vice-Captain'];
    const coachAssignments = assignments.filter(a => teamManagementRoles.some(role => a.role === role));

    const pendingRequests = await getPendingAssignmentRequests();

    if (coachAssignments.length === 0) {
        return { teams: [], team: null, nextMatch: null, recentMatches: [], teamStats: null, leaderboards: { topRunScorers: [], topWicketTakers: [] }, upcomingSessions: [], pendingRequests };
    }
    
    const teams = (await Promise.all(coachAssignments.map(a => getTeam(a.teamId)))).filter((t): t is Team => t !== null);
    
    // Use the first team as the primary for dashboard details, can be made configurable later
    const primaryTeamId = teams[0]?.teamId;
    if (!primaryTeamId) {
        return { teams: [], team: null, nextMatch: null, recentMatches: [], teamStats: null, leaderboards: { topRunScorers: [], topWicketTakers: [] }, upcomingSessions: [], pendingRequests };
    }

    const [allMatches, teamStats, leaderboards, upcomingSessions] = await Promise.all([
        getTeamMatches(primaryTeamId),
        getTeamStats(primaryTeamId),
        getTeamLeaderboard(primaryTeamId),
        getSessionsByTeam(primaryTeamId),
    ]);

    const now = new Date();
    const nextMatch = allMatches.filter(m => m.status === 'scheduled' && m.dateTime >= now).sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime())[0] || null;
    const recentMatches = allMatches.filter(m => m.status === 'completed').sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime()).slice(0, 3);
    const futureSessions = upcomingSessions.filter(s => s.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
    
    return { teams, team: teams[0], nextMatch, recentMatches, teamStats, leaderboards, upcomingSessions: futureSessions, pendingRequests };
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
                const now = new Date();
                nextMatch = teamMatches
                    .filter(m => m.status === 'scheduled' && m.dateTime >= now)
                    .sort((a, b) => a.date.getTime() - b.date.getTime())[0] || null;
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
