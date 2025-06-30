

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import type { Team, RosterMember, TeamStats, Match, Innings, PlayerTeamAssignment, Person, Division } from '@/lib/data';
import { getPerson } from './players';
import { cache } from 'react';
import { getUserId } from '@/lib/auth';
import { getDivisions } from './divisions';

export const getTeams = cache(async (): Promise<Team[]> => {
  const userId = await getUserId();
  if (!userId) return [];
  
  const currentUser = await getPerson(userId);
  if (!currentUser) return [];

  const teamsCollection = collection(db, 'teams');
  let q;

  const activeRole = currentUser.activeRole;
  
  // Admin role sees all teams within their organization.
  if (activeRole === 'Admin') {
     q = query(teamsCollection);
  }
  // Sportsmaster role sees only teams from their assigned schools.
  else if (activeRole === 'Sportsmaster') {
    if (!currentUser.assignedSchools || currentUser.assignedSchools.length === 0) {
      return []; // No schools assigned, so no teams to see.
    }
    // Firestore 'in' query is limited to 30 items. This should be sufficient for assigned schools.
    q = query(
      teamsCollection, 
      where("schoolId", "in", currentUser.assignedSchools)
    );
  }
  // For other roles, they see all teams. This can be refined later if needed.
  else {
      q = query(teamsCollection);
  }

  try {
    const teamSnapshot = await getDocs(q);
    return teamSnapshot.docs.map(doc => ({ teamId: doc.id, ...doc.data() } as Team));
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
});

export const getTeam = cache(async (teamId: string): Promise<Team | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  try {
    const teamDocRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamDocRef);
    if (!teamSnap.exists()) return null;
    return { teamId: teamSnap.id, ...teamSnap.data() } as Team;
  } catch (error) {
    console.error(`Error fetching team with ID ${teamId}:`, error);
    return null;
  }
});

export const getTeamRoster = cache(async (teamId: string): Promise<RosterMember[]> => {
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
});

export const getTeamStats = cache(async (teamId: string): Promise<TeamStats> => {
    const defaultStats: TeamStats = {
        matchesPlayed: 0, matchesWon: 0, matchesLost: 0, matchesDrawn: 0,
        totalRunsScored: 0, totalWicketsTaken: 0, netRunRate: 0.0
    };

    const team = await getTeam(teamId);
    if (!team) return defaultStats;

    const matchesCollection = collection(db, 'matches');
    const teamAQuery = query(matchesCollection, where("status", "==", "completed"), where("teamAId", "==", teamId));
    const teamBQuery = query(matchesCollection, where("status", "==", "completed"), where("teamBId", "==", teamId));
    
    const [teamAMatchesSnapshot, teamBMatchesSnapshot] = await Promise.all([getDocs(teamAQuery), getDocs(teamBQuery)]);
    const allMatches = [...teamAMatchesSnapshot.docs, ...teamBMatchesSnapshot.docs];
    const uniqueMatches = Array.from(new Map(allMatches.map(doc => [doc.id, doc])).values());

    let stats = { ...defaultStats };
    let totalOversFaced = 0;
    let totalRunsConceded = 0;
    let totalOversBowled = 0;

    for (const matchDoc of uniqueMatches) {
        // Replicating getScorecard logic directly to break circular dependency
        const innings1Ref = doc(db, 'matches', matchDoc.id, 'scorecards', 'innings1');
        const innings2Ref = doc(db, 'matches', matchDoc.id, 'scorecards', 'innings2');
        const [innings1Snap, innings2Snap] = await Promise.all([getDoc(innings1Ref), getDoc(innings2Ref)]);
        
        let scorecard = null;
        if (innings1Snap.exists() && innings2Snap.exists()) {
             scorecard = {
                innings1: innings1Snap.data() as Innings,
                innings2: innings2Snap.data() as Innings,
            };
        }
        
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
});


const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
  status: z.string({ required_error: "Please select a status." }),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

export async function addPlayerToRosterAction(teamId: string, data: z.infer<typeof assignmentSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");

  const user = await getPerson(userId);
  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
      throw new Error("You do not have permission to modify team rosters.");
  }
  
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
  revalidatePath(`/people/${data.personId}`);
}

export async function removeRosterAssignmentAction(teamId: string, assignmentId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");

    const user = await getPerson(userId);
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        throw new Error("You do not have permission to modify team rosters.");
    }
    
    const team = await getTeam(teamId);
    if (!team) throw new Error("Team not found or permission denied.");

    const assignmentRef = doc(db, 'teams', teamId, 'roster', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    if (!assignmentSnap.exists()) throw new Error("Assignment not found.");
    
    const personId = assignmentSnap.data().personId;

    try {
        await deleteDoc(assignmentRef);
    } catch (error) {
        console.error("Error removing roster assignment:", error);
        throw new Error("Could not remove player from roster.");
    }
    revalidatePath(`/teams/${teamId}`);
    revalidatePath(`/people/${personId}`);
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
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  
  const user = await getPerson(userId);
  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
      throw new Error("You do not have permission to modify team rosters.");
  }

  const validated = updateAssignmentSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid assignment data.');
  
  const { teamId, assignmentId, ...updateData } = validated.data;
  
  if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");

  const assignmentRef = doc(db, 'teams', teamId, 'roster', assignmentId);
  const assignmentSnap = await getDoc(assignmentRef);
  if (!assignmentSnap.exists()) throw new Error("Assignment not found.");
  
  const personId = assignmentSnap.data().personId;

  try {
    await updateDoc(assignmentRef, updateData);
  } catch (error) {
    console.error("Error updating roster assignment:", error);
    throw new Error("Could not update roster assignment.");
  }
  
  revalidatePath(`/teams/${teamId}`);
  revalidatePath(`/people/${personId}`);
}

const teamSchema = z.object({
  name: z.string().min(1),
  alias: z.string().optional(),
  schoolId: z.string(),
  divisionId: z.string(),
  seasonId: z.string(),
  teamClass: z.string(),
});

async function validateTeamRefs(schoolId: string, divisionId: string, seasonId: string) {
    const refs = [doc(db, 'schools', schoolId), doc(db, 'divisions', divisionId), doc(db, 'seasons', seasonId)];
    const snapshots = await Promise.all(refs.map(ref => getDoc(ref)));
    
    // Validate that all selected entities exist.
    if (snapshots.some(snap => !snap.exists())) {
        throw new Error("Invalid selection for school, division, or season.");
    }

    // Return the data for use in the new team document.
    return snapshots.map(s => s.data());
}

export async function addTeamAction(data: z.infer<typeof teamSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");

  const user = await getPerson(userId);
  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
      throw new Error("You do not have permission to add teams.");
  }
  
  const validated = teamSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid team data.');
  const { name, alias, schoolId, divisionId, seasonId, teamClass } = validated.data;
  const [schoolData, divisionData, seasonData] = await validateTeamRefs(schoolId, divisionId, seasonId);

  try {
    await addDoc(collection(db, 'teams'), {
        name,
        alias: alias || '',
        schoolId, schoolName: schoolData?.name,
        divisionId, divisionName: divisionData?.name,
        seasonId, seasonName: seasonData?.name,
        teamClass,
        teamColors: schoolData?.brandColors || { primary: '#000000', secondary: '#ffffff' },
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
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");

  const user = await getPerson(userId);
  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
      throw new Error("You do not have permission to update teams.");
  }

  const validated = updateTeamSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid team data.');
  const { teamId, name, alias, schoolId, divisionId, seasonId, teamClass } = validated.data;
  if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");
  const [schoolData, divisionData, seasonData] = await validateTeamRefs(schoolId, divisionId, seasonId);
  try {
    await updateDoc(doc(db, 'teams', teamId), {
        name,
        alias: alias || '',
        schoolId, schoolName: schoolData?.name,
        divisionId, divisionName: divisionData?.name,
        seasonId, seasonName: seasonData?.name,
        teamClass,
        teamColors: schoolData?.brandColors || { primary: '#000000', secondary: '#ffffff' },
    });
  } catch (error) {
    console.error("Error updating team: ", error);
    throw new Error("Could not update team.");
  }
  revalidatePath('/teams');
  revalidatePath(`/teams/${teamId}`);
}

export async function deleteTeamAction(teamId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");

    const user = await getPerson(userId);
    if (!user?.roles.includes('Admin') && !user.roles.includes('Sportsmaster')) {
        throw new Error("You do not have permission to delete teams.");
    }
    
    if (!await getTeam(teamId)) throw new Error("Team not found or permission denied.");

    const batch = writeBatch(db);

    // 1. Delete team's roster
    const rosterSnapshot = await getDocs(collection(db, 'teams', teamId, 'roster'));
    rosterSnapshot.forEach(doc => batch.delete(doc.ref));

    // 2. Find and delete associated matches and their subcollections
    const matchesCollection = collection(db, 'matches');
    const teamAMatchesQuery = query(matchesCollection, where("teamAId", "==", teamId));
    const teamBMatchesQuery = query(matchesCollection, where("teamBId", "==", teamId));
    const [teamAMatchesSnap, teamBMatchesSnap] = await Promise.all([ getDocs(teamAMatchesQuery), getDocs(teamBMatchesQuery) ]);
    const allMatches = [...teamAMatchesSnap.docs, ...teamBMatchesSnap.docs];
    const uniqueMatches = Array.from(new Map(allMatches.map(doc => [doc.id, doc])).values());

    for (const matchDoc of uniqueMatches) {
        const matchRef = matchDoc.ref;
        const subcollections = ['lineups', 'officials', 'scorecards', 'transportAssignments'];
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

export const getTeamMatches = cache(async (teamId: string): Promise<Match[]> => {
  if (!await getTeam(teamId)) return [];

  const matchesCollection = collection(db, 'matches');
  const teamAQuery = query(matchesCollection, where("teamAId", "==", teamId));
  const teamBQuery = query(matchesCollection, where("teamBId", "==", teamId));

  try {
    const [teamAMatchesSnap, teamBMatchesSnap] = await Promise.all([
      getDocs(teamAQuery),
      getDocs(teamBQuery),
    ]);

    const allMatches = [...teamAMatchesSnap.docs, ...teamBMatchesSnap.docs];
    
    const uniqueMatchesMap = new Map<string, Match>();
    allMatches.forEach(doc => {
      const data = doc.data();
      const match = {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
      } as Match;
      uniqueMatchesMap.set(doc.id, match);
    });

    const sortedMatches = Array.from(uniqueMatchesMap.values()).sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    
    return sortedMatches;
  } catch (error) {
    console.error(`Error fetching matches for team ${teamId}:`, error);
    return [];
  }
});

export const getPersonTeamAssignments = cache(async (personId: string): Promise<PlayerTeamAssignment[]> => {
    if (!await getPerson(personId)) return [];

    const assignments: PlayerTeamAssignment[] = [];
    const teamsCollection = collection(db, 'teams');
    const q = query(teamsCollection);

    try {
        const teamsSnapshot = await getDocs(q);
        for (const teamDoc of teamsSnapshot.docs) {
            const rosterCol = collection(db, 'teams', teamDoc.id, 'roster');
            const rosterQuery = query(rosterCol, where("personId", "==", personId));
            const rosterSnapshot = await getDocs(rosterQuery);

            if (!rosterSnapshot.empty) {
                const rosterData = rosterSnapshot.docs[0].data();
                assignments.push({
                    assignmentId: rosterSnapshot.docs[0].id,
                    teamId: teamDoc.id,
                    teamName: teamDoc.data().name,
                    role: rosterData.role,
                    status: rosterData.status,
                    isCaptain: rosterData.isCaptain ?? false,
                    isViceCaptain: rosterData.isViceCaptain ?? false,
                });
            }
        }
    } catch (error) {
        console.error(`Error fetching team assignments for person ${personId}:`, error);
        return [];
    }

    return assignments;
});

// Helper function for ranking
const getDivisionRank = (divisionName: string | undefined): number => {
    if (!divisionName) return 0;
    const name = divisionName.toLowerCase();
    if (name.includes('open')) return 5;
    if (name.includes('u16')) return 4;
    if (name.includes('u15')) return 3;
    if (name.includes('u14')) return 2;
    if (name.includes('u13')) return 1;
    return 0;
}

// Helper function for class ranking
const getClassRank = (className: string | undefined): number => {
    if (!className) return 0;
    const name = className.toUpperCase();
    if (name.includes('A') || name.includes('1ST')) return 3;
    if (name.includes('B') || name.includes('2ND')) return 2;
    if (name.includes('C') || name.includes('3RD')) return 1;
    return 0;
}

export const getEligiblePlayersForTeam = cache(async (teamId: string): Promise<(Person & { eligibilityContext: string })[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    const [targetTeam, allTeams, allPeople] = await Promise.all([
        getTeam(teamId),
        getTeams(),
        getPerson(userId).then(user => user?.roles.includes('Admin') ? getDocs(collection(db, 'people')).then(snap => snap.docs.map(d => ({ personId: d.id, ...d.data() } as Person))) : getDocs(query(collection(db, 'people'), where('userId', '==', userId))).then(snap => snap.docs.map(d => ({ personId: d.id, ...d.data() } as Person)))),
    ]);
    
    if (!targetTeam) return [];

    // Create a map of all roster assignments for efficiency
    const rosterMap = new Map<string, { teamId: string; teamName: string; divisionName: string; teamClass: string; }>();
    for (const team of allTeams) {
        const roster = await getTeamRoster(team.teamId);
        for (const member of roster) {
            if (member.role === 'Player' && !rosterMap.has(member.personId)) { // Prioritize first assignment found
                rosterMap.set(member.personId, { teamId: team.teamId, teamName: team.name, divisionName: team.divisionName, teamClass: team.teamClass || '' });
            }
        }
    }
    
    const targetTeamRosterIds = new Set((await getTeamRoster(teamId)).map(m => m.personId));
    const targetDivisionRank = getDivisionRank(targetTeam.divisionName);

    const eligiblePlayers: (Person & { eligibilityContext: string })[] = [];

    for (const person of allPeople) {
        // Rule: Must be a player
        if (!person.roles.includes('Player')) continue;

        // Rule: Exclude players already on the target team's roster
        if (targetTeamRosterIds.has(person.personId)) continue;
        
        const assignment = rosterMap.get(person.personId);
        
        // Unassigned players are not eligible
        if (!assignment) continue;
        
        const playerTeam = allTeams.find(t => t.teamId === assignment.teamId);
        if (!playerTeam) continue;

        // Rule 1: School Membership Filter
        if (playerTeam.schoolId !== targetTeam.schoolId) continue;

        const playerDivisionRank = getDivisionRank(assignment.divisionName);

        // Rule 2 & 4: Division & Class Hierarchy Filter
        // Players cannot play down a division
        if (playerDivisionRank > targetDivisionRank) {
            continue;
        }
        
        let eligibilityContext = `${assignment.teamName}`;
        if (playerDivisionRank < targetDivisionRank) {
            eligibilityContext += ` - Can play up`;
        } else {
            eligibilityContext += ` - Same division`;
        }
        
        eligiblePlayers.push({ ...person, eligibilityContext });
    }

    return eligiblePlayers;
});

