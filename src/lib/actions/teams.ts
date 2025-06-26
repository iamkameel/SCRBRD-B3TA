
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import type { Team, RosterMember, TeamStats } from '@/lib/data';
import { getPerson } from './players';
import { getScorecard } from './matches';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getTeams(): Promise<Team[]> {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'teams'), where("userId", "==", userId));
    const teamSnapshot = await getDocs(q);
    return teamSnapshot.docs.map(doc => ({ teamId: doc.id, ...doc.data() } as Team));
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function getTeam(teamId: string): Promise<Team | null> {
  if (!userId) return null;
  try {
    const teamDocRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamDocRef);
    if (!teamSnap.exists() || teamSnap.data().userId !== userId) return null;
    return { teamId: teamSnap.id, ...teamSnap.data() } as Team;
  } catch (error) {
    console.error(`Error fetching team with ID ${teamId}:`, error);
    return null;
  }
}

export async function getTeamRoster(teamId: string): Promise<RosterMember[]> {
  if (!await getTeam(teamId)) return [];
  try {
    const rosterCol = collection(db, 'teams', teamId, 'roster');
    const rosterSnapshot = await getDocs(rosterCol);
    const rosterPromises = rosterSnapshot.docs.map(async (rosterDoc) => {
        const personSnap = await getDoc(doc(db, 'people', rosterDoc.data().personId));
        if (!personSnap.exists()) return null;
        return {
            assignmentId: rosterDoc.id, personName: `${personSnap.data().firstName} ${personSnap.data().lastName}`,
            ...rosterDoc.data()
        } as RosterMember;
    });
    return (await Promise.all(rosterPromises)).filter((m): m is RosterMember => m !== null);
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error);
    return [];
  }
}

export async function getTeamStats(teamId: string): Promise<TeamStats> {
    const defaultStats: TeamStats = {
        matchesPlayed: 0, matchesWon: 0, matchesLost: 0, matchesDrawn: 0,
        totalRunsScored: 0, totalWicketsTaken: 0, netRunRate: 0.0
    };

    const team = await getTeam(teamId);
    if (!team) return defaultStats;

    const matchesCollection = collection(db, 'matches');
    const teamAQuery = query(matchesCollection, where("userId", "==", userId), where("status", "==", "completed"), where("teamAId", "==", teamId));
    const teamBQuery = query(matchesCollection, where("userId", "==", userId), where("status", "==", "completed"), where("teamBId", "==", teamId));
    
    const [teamAMatchesSnapshot, teamBMatchesSnapshot] = await Promise.all([getDocs(teamAQuery), getDocs(teamBQuery)]);
    const allMatches = [...teamAMatchesSnapshot.docs, ...teamBMatchesSnapshot.docs];
    const uniqueMatches = Array.from(new Map(allMatches.map(doc => [doc.id, doc])).values());

    let stats = { ...defaultStats };
    let totalOversFaced = 0;
    let totalRunsConceded = 0;
    let totalOversBowled = 0;

    for (const matchDoc of uniqueMatches) {
        const scorecard = await getScorecard(matchDoc.id);
        if (!scorecard) continue;

        stats.matchesPlayed++;
        
        const { innings1, innings2 } = scorecard;
        
        const teamInnings = innings1.teamName === team.name ? innings1 : (innings2.teamName === team.name ? innings2 : undefined);
        const opponentInnings = innings1.teamName !== team.name ? innings1 : (innings2.teamName !== team.name ? innings2 : undefined);
        
        if (teamInnings) {
            stats.totalRunsScored += teamInnings.totalRuns;
            totalOversFaced += teamInnings.overs;
        }
        if (opponentInnings) {
            stats.totalWicketsTaken += opponentInnings.wickets;
            totalRunsConceded += opponentInnings.totalRuns;
            totalOversBowled += opponentInnings.overs;
        }

        if (innings2.totalRuns > innings1.totalRuns) {
            if (innings2.teamName === team.name) stats.matchesWon++; else stats.matchesLost++;
        } else if (innings1.totalRuns > innings2.totalRuns) {
            if (innings1.teamName === team.name) stats.matchesWon++; else stats.matchesLost++;
        } else {
            stats.matchesDrawn++;
        }
    }
    
    const runRateFor = totalOversFaced > 0 ? stats.totalRunsScored / totalOversFaced : 0;
    const runRateAgainst = totalOversBowled > 0 ? totalRunsConceded / totalOversBowled : 0;
    stats.netRunRate = runRateFor - runRateAgainst;

    return stats;
}


const assignmentSchema = z.object({
  personId: z.string(), role: z.string(), status: z.string(),
  isCaptain: z.boolean().default(false), isViceCaptain: z.boolean().default(false),
});

export async function addPlayerToRosterAction(teamId: string, data: z.infer<typeof assignmentSchema>) {
  if (!userId) throw new Error("User not authenticated");
  if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");
  if (!await getPerson(data.personId)) throw new Error("Person not found or permission denied.");
  if (!assignmentSchema.safeParse(data).success) throw new Error('Invalid assignment data.');

  const rosterCol = collection(db, 'teams', teamId, 'roster');
  const q = query(rosterCol, where("personId", "==", data.personId));
  const existingAssignment = await getDocs(q);
  if (!existingAssignment.empty) {
    throw new Error("This person is already on the team's roster.");
  }

  try {
    await addDoc(rosterCol, data);
  } catch (error) {
    console.error("Error adding player to roster: ", error);
    if (error instanceof Error) { throw error; }
    throw new Error("Could not add player to roster.");
  }
  revalidatePath(`/teams/${teamId}`);
}

export async function removeRosterAssignmentAction(teamId: string, assignmentId: string) {
    if (!userId) throw new Error("User not authenticated");
    if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");
    try {
        await deleteDoc(doc(db, 'teams', teamId, 'roster', assignmentId));
    } catch (error) {
        console.error("Error removing roster assignment:", error);
        throw new Error("Could not remove player from roster.");
    }
    revalidatePath(`/teams/${teamId}`);
}

const updateAssignmentSchema = z.object({
  teamId: z.string(),
  assignmentId: z.string(),
  role: z.string(),
  status: z.string(),
  isCaptain: z.boolean(),
  isViceCaptain: z.boolean(),
});

export async function updateRosterAssignmentAction(data: z.infer<typeof updateAssignmentSchema>) {
  if (!userId) throw new Error("User not authenticated");
  const validated = updateAssignmentSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid assignment data.');
  
  const { teamId, assignmentId, ...updateData } = validated.data;
  
  if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");

  try {
    const assignmentRef = doc(db, 'teams', teamId, 'roster', assignmentId);
    await updateDoc(assignmentRef, updateData);
  } catch (error) {
    console.error("Error updating roster assignment:", error);
    throw new Error("Could not update roster assignment.");
  }
  
  revalidatePath(`/teams/${teamId}`);
}

const teamSchema = z.object({
  name: z.string().min(1), schoolId: z.string(), divisionId: z.string(), seasonId: z.string(),
  primaryColor: z.string().optional(), secondaryColor: z.string().optional(),
});

async function validateTeamRefs(schoolId: string, divisionId: string, seasonId: string) {
    const refs = [doc(db, 'schools', schoolId), doc(db, 'divisions', divisionId), doc(db, 'seasons', seasonId)];
    const snapshots = await Promise.all(refs.map(ref => getDoc(ref)));
    if (snapshots.some(snap => !snap.exists() || snap.data()?.userId !== userId)) {
        throw new Error("Invalid selection for school, division, or season.");
    }
    return snapshots.map(s => s.data()?.name);
}

export async function addTeamAction(data: z.infer<typeof teamSchema>) {
  if (!userId) throw new Error("User not authenticated");
  const validated = teamSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid team data.');
  const { name, schoolId, divisionId, seasonId, primaryColor, secondaryColor } = validated.data;
  const [schoolName, divisionName, seasonName] = await validateTeamRefs(schoolId, divisionId, seasonId);
  try {
    await addDoc(collection(db, 'teams'), {
        name, schoolId, schoolName, divisionId, divisionName, seasonId, seasonName,
        teamColors: { primary: primaryColor || '#000000', secondary: secondaryColor || '#ffffff' },
        userId,
    });
  } catch (error) {
    console.error("Error adding team: ", error);
    throw new Error("Could not add team.");
  }
  revalidatePath('/teams');
}

const updateTeamSchema = teamSchema.extend({ teamId: z.string() });
export async function updateTeamAction(data: z.infer<typeof updateTeamSchema>) {
  if (!userId) throw new Error("User not authenticated");
  const validated = updateTeamSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid team data.');
  const { teamId, name, schoolId, divisionId, seasonId, primaryColor, secondaryColor } = validated.data;
  if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");
  const [schoolName, divisionName, seasonName] = await validateTeamRefs(schoolId, divisionId, seasonId);
  try {
    await updateDoc(doc(db, 'teams', teamId), {
        name, schoolId, schoolName, divisionId, divisionName, seasonId, seasonName,
        teamColors: { primary: primaryColor, secondary: secondaryColor },
    });
  } catch (error) {
    console.error("Error updating team: ", error);
    throw new Error("Could not update team.");
  }
  revalidatePath('/teams');
  revalidatePath(`/teams/${teamId}`);
}

export async function deleteTeamAction(teamId: string) {
    if (!userId) throw new Error("User not authenticated");
    if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");

    const batch = writeBatch(db);

    // 1. Delete team's roster
    const rosterSnapshot = await getDocs(collection(db, 'teams', teamId, 'roster'));
    rosterSnapshot.forEach(doc => batch.delete(doc.ref));

    // 2. Find and delete associated matches and their subcollections
    const matchesCollection = collection(db, 'matches');
    const teamAMatchesQuery = query(matchesCollection, where("userId", "==", userId), where("teamAId", "==", teamId));
    const teamBMatchesQuery = query(matchesCollection, where("userId", "==", userId), where("teamBId", "==", teamId));
    const [teamAMatchesSnap, teamBMatchesSnap] = await Promise.all([ getDocs(teamAMatchesQuery), getDocs(teamBMatchesQuery) ]);
    const allMatches = [...teamAMatchesSnap.docs, ...teamBMatchesSnap.docs];
    const uniqueMatches = Array.from(new Map(allMatches.map(doc => [doc.id, doc])).values());

    for (const matchDoc of uniqueMatches) {
        const matchRef = matchDoc.ref;
        const subcollections = ['lineups', 'officials', 'scorecards'];
        for (const sub of subcollections) {
            const subColRef = collection(db, 'matches', matchDoc.id, sub);
            const subColSnap = await getDocs(subColRef);
            subColSnap.forEach(doc => batch.delete(doc.ref));
        }
        batch.delete(matchRef);
    }
    
    // 3. Delete the team document itself
    batch.delete(doc(db, 'teams', teamId));
    
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error deleting team and associated data: ", error);
        throw new Error("Could not delete team.");
    }

    revalidatePath('/teams');
    revalidatePath('/matches');
    revalidatePath('/');
}
