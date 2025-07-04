
'use server';

import type { Person, Team, PlayerStats, TeamStats, LeaderboardPlayer, StandingTeam, Match, Field, Competition, AssignmentRequest, TrainingSession } from '@/lib/data';
import { getPlayers, getPerson, getPersonLinks } from './players';
import { getTeams, getTeamStats, getTeamRoster, getPersonTeamAssignments, getTeamMatches } from './teams';
import { getPlayerStats } from './stats';
import { getFieldsForGroundskeeper, getFields } from './fields';
import { getMatchTransportAssignments, getMatches, getMatchLineup } from './matches';
import { getCompetitions } from './competitions';
import { getPendingAssignmentRequests } from './requests';
import { getSessionsByTeam } from './sessions';
import { cache } from 'react';
import { getSchools } from './schools';
import { getVehicles } from './transport';


export async function getLeaderboards(filters: { seasonId?: string, competitionId?: string, teamId?: string } = {}): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    let players: Person[];

    if (filters.teamId) {
        const roster = await getTeamRoster(filters.teamId);
        const playerPromises = roster.filter(m => m.role === 'Player').map(m => getPerson(m.personId));
        players = (await Promise.all(playerPromises)).filter((p): p is Person => p !== null);
    } else {
        players = await getPlayers();
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

export async function getTeamManagerDashboardData(personId: string) {
    const assignments = await getPersonTeamAssignments(personId);
    const managedTeamIds = assignments.filter(a => ['Team Manager'].includes(a.role)).map(a => a.teamId);

    const [allSchools, allTeamsData] = await Promise.all([getSchools(), getTeams()]);

    if (managedTeamIds.length === 0) {
        return { 
            kpis: { upcomingFixtures: 0, pendingAvailability: 0, transportNeeded: 0, managedTeams: 0 },
            upcomingMatches: [],
            teams: [],
            allSchools,
            allTeams: allTeamsData,
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
        const lineup = [...lineupA, ...lineupB];
        
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
    const coachAssignment = assignments.find(a => ['Coach', 'Assistant Coach', 'Captain', 'Team Manager'].includes(a.role));

    const pendingRequests = await getPendingAssignmentRequests();

    if (!coachAssignment) {
        return { team: null, nextMatch: null, recentMatches: [], teamStats: null, leaderboards: { topRunScorers: [], topWicketTakers: [] }, upcomingSessions: [], pendingRequests };
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
    
    return { team, nextMatch, recentMatches, teamStats, leaderboards, upcomingSessions: futureSessions, pendingRequests };
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

