
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Competition, StandingTeam, LeaderboardPlayer, Team, Person, Match } from '@/lib/data';
import { getSeason } from './seasons';
import { getDivision } from './divisions';
import { getTeam, getTeams } from './teams';
import { getPlayerStats } from './stats';
import { cache } from 'react';
import { getUserId } from '@/lib/auth';
import { getPerson } from './players';

const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        throw new Error("You do not have permission to manage competitions.");
    }
}

export async function getCompetitions(): Promise<Competition[]> {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const competitionsCollection = collection(db, 'competitions');
    const q = query(competitionsCollection, where("userId", "==", userId));
    const [competitionSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(q),
        getTeams()
    ]);

    const teamLogoMap = new Map<string, string>();
    teamsSnapshot.forEach(team => {
        if (team.logoUrl) {
            teamLogoMap.set(team.teamId, team.logoUrl);
        }
    });

    const competitionsList = competitionSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            competitionId: doc.id,
            ...data,
            winnerTeamLogoUrl: data.winnerTeamId ? teamLogoMap.get(data.winnerTeamId) : undefined,
        } as Competition
    });

    return competitionsList;
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return [];
  }
}

export const getCompetition = cache(async (competitionId: string): Promise<Competition | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  try {
    const competitionDocRef = doc(db, 'competitions', competitionId);
    const competitionSnap = await getDoc(competitionDocRef);
    if (!competitionSnap.exists() || competitionSnap.data().userId !== userId) {
      return null;
    }
    return {
      competitionId: competitionSnap.id,
      ...competitionSnap.data(),
    } as Competition;
  } catch (error) {
    console.error(`Error fetching competition with ID ${competitionId}:`, error);
    return null;
  }
});

const competitionSchema = z.object({
  name: z.string().min(1, { message: "Competition name is required." }),
  competitionClass: z.string().optional(),
  type: z.enum(['League', 'Cup', 'Tournament', 'Festival', 'Friendlies']),
  seasonId: z.string({ required_error: "Please select a season." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  status: z.enum(['Draft', 'In Progress', 'Completed']).default('Draft'),
  winnerTeamId: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
});

type CompetitionFormValues = z.infer<typeof competitionSchema>;

export async function addCompetitionAction(data: CompetitionFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = competitionSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid competition data.');
  }

  const { name, type, competitionClass, seasonId, divisionId, status, winnerTeamId, teamIds } = validatedFields.data;

  const [season, division] = await Promise.all([
      getSeason(seasonId),
      getDivision(divisionId)
  ]);

  if (!season || !division) {
      throw new Error("Invalid season or division selected.");
  }
  
  const newCompetitionData: { [key: string]: any } = {
    name, type, competitionClass: competitionClass || '', seasonId, seasonName: season.name, divisionId, divisionName: division.name, status, userId, teamIds: teamIds || [],
  };
  
  if (status === 'Completed' && winnerTeamId) {
    const winnerTeamSnap = await getDoc(doc(db, 'teams', winnerTeamId));
    if (winnerTeamSnap.exists()) {
      newCompetitionData.winnerTeamId = winnerTeamId;
      newCompetitionData.winnerTeamName = winnerTeamSnap.data().name;
    }
  }

  try {
    await addDoc(collection(db, 'competitions'), newCompetitionData);
  } catch (error) {
    console.error("Error adding competition: ", error);
    throw new Error("Could not add competition.");
  }
  
  revalidatePath('/competitions');
}

const updateCompetitionSchema = competitionSchema.extend({
  competitionId: z.string(),
});

export async function updateCompetitionAction(data: z.infer<typeof updateCompetitionSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateCompetitionSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid competition data.');
    }

    const { competitionId, name, type, competitionClass, seasonId, divisionId, status, winnerTeamId, teamIds } = validatedFields.data;
    const competitionDocRef = doc(db, 'competitions', competitionId);

    const competitionSnap = await getDoc(competitionDocRef);
    if (!competitionSnap.exists() || competitionSnap.data().userId !== userId) {
        throw new Error("Competition not found or you do not have permission to edit it.");
    }
    
    const [season, division] = await Promise.all([
      getSeason(seasonId),
      getDivision(divisionId)
    ]);

    if (!season || !division) {
        throw new Error("Invalid season or division selected.");
    }
    
    const updatePayload: { [key: string]: any } = {
        name, type, competitionClass: competitionClass || '', seasonId, seasonName: season.name, divisionId, divisionName: division.name, status, teamIds: teamIds || [],
    };

    if (status === 'Completed' && winnerTeamId) {
        const winnerTeamSnap = await getDoc(doc(db, 'teams', winnerTeamId));
        if (winnerTeamSnap.exists()) {
            updatePayload.winnerTeamId = winnerTeamId;
            updatePayload.winnerTeamName = winnerTeamSnap.data().name;
        } else {
            updatePayload.winnerTeamId = null;
            updatePayload.winnerTeamName = null;
        }
    } else {
        updatePayload.winnerTeamId = null;
        updatePayload.winnerTeamName = null;
    }


    try {
        await updateDoc(competitionDocRef, updatePayload);
    } catch (error) {
        console.error("Error updating competition:", error);
        throw new Error("Could not update competition.");
    }

    revalidatePath('/competitions');
}

export async function deleteCompetitionAction(competitionId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  if (!competitionId) throw new Error("Competition ID is required.");
  
  const competitionDocRef = doc(db, 'competitions', competitionId);

  const competitionSnap = await getDoc(competitionDocRef);
  if (!competitionSnap.exists() || competitionSnap.data().userId !== userId) {
    throw new Error("Competition not found or you do not have permission to delete it.");
  }
  
  // In a real app, you would check for associated matches before deleting
  
  try {
    await deleteDoc(competitionDocRef);
  } catch (error) {
    console.error("Error deleting competition:", error);
    throw new Error("Could not delete competition.");
  }

  revalidatePath('/competitions');
}


export async function getCompetitionStandings(competitionId: string): Promise<StandingTeam[]> {
    const competition = await getCompetition(competitionId);
    if (!competition) return [];

    const matches = await getMatchesByCompetition(competitionId);
    if (matches.length === 0) return [];
    
    // Get unique team IDs from the matches
    const teamIds = new Set<string>();
    matches.forEach(match => {
        teamIds.add(match.teamAId);
        if (match.teamBId) teamIds.add(match.teamBId);
    });

    const teams: Team[] = [];
    for (const teamId of teamIds) {
        const team = await getTeam(teamId);
        if (team) teams.push(team);
    }
    
    const teamsWithStats: StandingTeam[] = await Promise.all(
        teams.map(async (team) => {
            // Note: This re-uses the global getTeamStats. For a large-scale app, we might
            // want a getTeamStatsForCompetition function that only considers matches from this competition.
            // For this demo, using the season-wide stats is acceptable.
            const stats = await getTeamStats(team.teamId);
            return { ...team, stats };
        })
    );

    return teamsWithStats.sort((a, b) => {
        if (b.stats.matchesWon !== a.stats.matchesWon) {
            return b.stats.matchesWon - a.stats.matchesWon;
        }
        return b.stats.netRunRate - a.stats.netRunRate;
    });
}


export async function getCompetitionLeaderboards(competitionId: string): Promise<{ topRunScorers: LeaderboardPlayer[], topWicketTakers: LeaderboardPlayer[] }> {
    const matches = await getMatchesByCompetition(competitionId);
    if (matches.length === 0) return { topRunScorers: [], topWicketTakers: [] };

    const playerIds = new Set<string>();
    for (const match of matches) {
        const lineupAref = doc(db, 'matches', match.matchId, 'lineups', match.teamAId);
        const lineupPromises: Promise<any>[] = [getDoc(lineupAref)];

        if (match.teamBId) {
            const lineupBref = doc(db, 'matches', match.matchId, 'lineups', match.teamBId);
            lineupPromises.push(getDoc(lineupBref));
        }
        
        const lineupSnapshots = await Promise.all(lineupPromises);

        for (const lineupSnap of lineupSnapshots) {
            if (lineupSnap && lineupSnap.exists()) {
                const lineupData = lineupSnap.data();
                if (lineupData && lineupData.playerIds && Array.isArray(lineupData.playerIds)) {
                    lineupData.playerIds.forEach((id: string) => playerIds.add(id));
                }
            }
        }
    }
    
    // Note: This is a simplification for the demo.
    // A real-world app would calculate these stats based only on the matches in this competition.
    // Here we are showing the players from this competition, but with their overall season stats.

    const allPlayersInCompetition: Person[] = [];
    for (const playerId of playerIds) {
        const player = await getPerson(playerId);
        if (player) allPlayersInCompetition.push(player);
    }

    const playersWithStats: LeaderboardPlayer[] = await Promise.all(
        allPlayersInCompetition.map(async (player) => {
            const stats = await getPlayerStats(player.personId); // Re-using global stats
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


export async function getMatchesByCompetition(competitionId: string): Promise<Match[]> {
  const userId = await getUserId();
  if (!userId) return [];
  if (!competitionId) return [];
  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId), where("competitionId", "==", competitionId));
    
    const [teams, matchSnapshot] = await Promise.all([
      getTeams(),
      getDocs(q),
    ]);
    
    const teamInfoMap = new Map<string, Team>();
    teams.forEach(team => {
      teamInfoMap.set(team.teamId, team);
    });

    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      const teamA = teamInfoMap.get(data.teamAId);
      const teamB = teamInfoMap.get(data.teamBId);
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
        teamAColor: teamA?.teamColors?.primary,
        teamBColor: teamB?.teamColors?.primary,
        teamALogoUrl: teamA?.logoUrl,
        teamBLogoUrl: teamB?.logoUrl,
      } as Match;
    });
    return matchesList.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  } catch (error) {
    console.error(`Error fetching matches for competition ${competitionId}:`, error);
    return [];
  }
}
