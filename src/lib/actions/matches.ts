

      
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, Timestamp, query, where, setDoc, deleteDoc, writeBatch, updateDoc, collectionGroup } from 'firebase/firestore';
import type { Match, Official, Innings, PlayerOfTheMatch, MatchStatus, AvailabilityStatus, Team, LiveScore, BowlingAngle, BatsmanStats, Lineup, Partnership } from '@/lib/data';
import { getPerson } from './players';
import { getCompetition } from './competitions';
import { getTeamRoster, getTeams, isTeamManagerOrAdmin, getTeam } from './teams';
import { cache } from 'react';
import { getUserId } from '@/lib/auth';
import { generatePlayerOfTheMatch, getTopPerformers } from '@/ai/flows/generate-top-performers-flow';
import { logAuditEvent } from './audit';
import { getSchool } from './schools';

export const getMatches = cache(async (): Promise<Match[]> => {
  const userId = await getUserId();
  if (!userId) return [];
  
  const currentUser = await getPerson(userId);
  if (!currentUser) return [];

  const matchesCollection = collection(db, 'matches');
  let q;

  // Admins and Sportsmasters should see all matches
  if (currentUser.roles.includes('Admin') || currentUser.roles.includes('Sportsmaster')) {
    q = query(matchesCollection);
  } else {
    // Other users see matches they created
    q = query(matchesCollection, where("userId", "==", userId));
  }

  try {
    const teamsData = await getTeams();
    const teams = new Map(teamsData.map(t => [t.teamId, t]));
    
    const matchSnapshot = await getDocs(q);

    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      const teamA = teams.get(data.teamAId);
      const teamB = teams.get(data.teamBId);
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
        teamAAbbreviation: teamA?.abbreviation,
        teamBAbbreviation: teamB?.abbreviation,
        teamAColor: teamA?.teamColors?.primary,
        teamBColor: teamB?.teamColors?.secondary,
        teamALogoUrl: teamA?.logoUrl,
        teamBLogoUrl: teamB?.logoUrl,
      } as Match;
    });
    return matchesList.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
});

export const getMatch = cache(async (matchId: string): Promise<Match | null> => {
  if (!matchId) return null;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchDocRef);

    if (!matchSnap.exists()) {
      return null;
    }

    const data = matchSnap.data();
    const [teamA, teamB] = await Promise.all([
        getTeam(data.teamAId),
        data.teamBId ? getTeam(data.teamBId) : Promise.resolve(null),
    ]);

    return {
      matchId: matchSnap.id,
      ...data,
      dateTime: (data.dateTime as Timestamp).toDate(),
      teamAAbbreviation: teamA?.abbreviation,
      teamBAbbreviation: teamB?.abbreviation,
    } as Match;
  } catch (error) {
    console.error(`Error fetching match with ID ${matchId}:`, error);
    return null;
  }
});

const fixtureSchema = z.object({
  teamAId: z.string(),
  teamBId: z.string(),
  competitionId: z.string(),
  fieldId: z.string(),
  dateTime: z.date(),
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

export async function addMatchAction(data: FixtureFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = fixtureSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid match data.');
  }

  const { teamAId, teamBId, competitionId, fieldId, dateTime } = validatedFields.data;

  // --- Clash Detection Logic ---
  const MATCH_DURATION_HOURS = 4;
  const newMatchStartTime = dateTime.getTime();
  const newMatchEndTime = new Date(newMatchStartTime).setHours(dateTime.getHours() + MATCH_DURATION_HOURS);

  const teamANameTemp = (await getDoc(doc(db, 'teams', teamAId))).data()?.name || 'Team A';
  const teamBNameTemp = (await getDoc(doc(db, 'teams', teamBId))).data()?.name || 'Team B';
  const fieldNameTemp = (await getDoc(doc(db, 'fields', fieldId))).data()?.name || 'The selected field';

  const matchesRef = collection(db, 'matches');

  const checkClashes = (snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>, entityName: string, entityType: 'team' | 'field') => {
    for (const matchDoc of snapshot.docs) {
      const existingMatch = matchDoc.data();
      const existingMatchStartTime = (existingMatch.dateTime as Timestamp).toMillis();
      const existingMatchEndTime = new Date(existingMatchStartTime).setHours(new Date(existingMatchStartTime).getHours() + MATCH_DURATION_HOURS);

      const timesOverlap = (newMatchStartTime < existingMatchEndTime) && (newMatchEndTime > existingMatchStartTime);
      
      if (timesOverlap) {
        if (entityType === 'team') {
          throw new Error(`Clash detected: ${entityName} is already scheduled for a match around this time.`);
        }
        if (entityType === 'field') {
          throw new Error(`Clash detected: ${entityName} is already booked for a match around this time.`);
        }
      }
    }
  };

  const queries = [
    // Team A clashes
    query(matchesRef, where("userId", "==", userId), where("teamAId", "==", teamAId)),
    query(matchesRef, where("userId", "==", userId), where("teamBId", "==", teamAId)),
    // Team B clashes
    query(matchesRef, where("userId", "==", userId), where("teamAId", "==", teamBId)),
    query(matchesRef, where("userId", "==", userId), where("teamBId", "==", teamBId)),
    // Field clashes
    query(matchesRef, where("userId", "==", userId), where("fieldId", "==", fieldId)),
  ];

  const snapshots = await Promise.all(queries.map(q => getDocs(q)));

  checkClashes(snapshots[0], teamANameTemp, 'team');
  checkClashes(snapshots[1], teamANameTemp, 'team');
  checkClashes(snapshots[2], teamBNameTemp, 'team');
  checkClashes(snapshots[3], teamBNameTemp, 'team');
  checkClashes(snapshots[4], fieldNameTemp, 'field');
  // --- End of Clash Detection ---

  let newMatchData: Omit<Match, 'matchId'>;
  
  const [teamASnap, teamBSnap, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)),
    getDoc(doc(db, 'teams', teamBId)),
    getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || !teamBSnap.exists() || !fieldSnap.exists()) {
    throw new Error("Invalid team or field reference.");
  }
  
  const defaultExtras = { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0 };
  const defaultLiveScore: LiveScore = { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [], batsmanStats: {}, bowlerStats: {}, extras: defaultExtras, bowlingAngle: 'Over the Wicket', partnerships: [] };

  if (competitionId === 'friendly') {
    newMatchData = {
      teamAId,
      teamAName: teamASnap.data().name,
      teamBId,
      teamBName: teamBSnap.data().name,
      fieldId,
      fieldName: fieldSnap.data().name,
      dateTime: Timestamp.fromDate(dateTime),
      status: 'scheduled',
      competitionName: 'Friendly Match',
      liveScore: defaultLiveScore,
      userId: userId,
      report: '',
      preview: '',
      audioCommentaryUrl: '',
      analysisReports: {},
      availability: {},
      lineupConfirmedByCaptainA: false,
      lineupConfirmedByCaptainB: false,
    };
  } else {
    const competition = await getCompetition(competitionId);
    if (!competition) throw new Error("Invalid competition reference.");
    newMatchData = {
      teamAId,
      teamAName: teamASnap.data().name,
      teamBId,
      teamBName: teamBSnap.data().name,
      competitionId: competition.competitionId,
      competitionName: competition.name,
      seasonId: competition.seasonId,
      seasonName: competition.seasonName,
      divisionId: competition.divisionId,
      divisionName: competition.divisionName,
      fieldId,
      fieldName: fieldSnap.data().name,
      dateTime: Timestamp.fromDate(dateTime),
      status: 'scheduled',
      liveScore: defaultLiveScore,
      userId: userId,
      report: '',
      preview: '',
      audioCommentaryUrl: '',
      analysisReports: {},
      availability: {},
      lineupConfirmedByCaptainA: false,
      lineupConfirmedByCaptainB: false,
    };
  }

  let newMatchId: string;
  try {
    const docRef = await addDoc(collection(db, 'matches'), newMatchData);
    newMatchId = docRef.id;
  } catch (error) {
    console.error("Error adding match: ", error);
    throw new Error("Could not create match.");
  }

  revalidatePath('/matches');
  revalidatePath('/');
  
  redirect(`/matches/${newMatchId}`);
}

const updateMatchFixtureSchema = z.object({
  teamAId: z.string(),
  teamBId: z.string(),
  competitionId: z.string(),
  fieldId: z.string(),
  dateTime: z.date(),
  status: z.enum(['scheduled', 'live', 'completed', 'postponed', 'cancelled', 'abandoned']),
  statusReason: z.string().optional(),
});


export async function updateMatchAction(matchId: string, data: z.infer<typeof updateMatchFixtureSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = updateMatchFixtureSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid match data.');
  }

  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists() || matchSnap.data().userId !== userId) {
      throw new Error("Match not found or you do not have permission to edit it.");
  }

  const { teamAId, teamBId, competitionId, fieldId, dateTime, status, statusReason } = validatedFields.data;

  const [teamASnap, teamBSnap, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)),
    getDoc(doc(db, 'teams', teamBId)),
    getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || !teamBSnap.exists() || !fieldSnap.exists()) {
      throw new Error("Invalid reference for one of the match entities.");
  }
  
  let updatedMatchData: Partial<Match>;

  if (competitionId === 'friendly' || !competitionId) {
    updatedMatchData = {
        teamAId, teamAName: teamASnap.data().name,
        teamBId, teamBName: teamBSnap.data().name,
        fieldId, fieldName: fieldSnap.data().name,
        dateTime,
        status,
        statusReason: ['postponed', 'cancelled', 'abandoned'].includes(status) ? statusReason : '',
        competitionId: undefined, competitionName: "Friendly Match",
        seasonId: undefined, seasonName: undefined,
        divisionId: undefined, divisionName: undefined,
    }
  } else {
     const competition = await getCompetition(competitionId);
     if (!competition) throw new Error("Invalid competition reference.");
     updatedMatchData = {
        teamAId, teamAName: teamASnap.data().name,
        teamBId, teamBName: teamBSnap.data().name,
        fieldId, fieldName: fieldSnap.data().name,
        dateTime,
        status,
        statusReason: ['postponed', 'cancelled', 'abandoned'].includes(status) ? statusReason : '',
        competitionId: competition.competitionId, competitionName: competition.name,
        seasonId: competition.seasonId, seasonName: competition.seasonName,
        divisionId: competition.divisionId, divisionName: competition.divisionName,
     }
  }


  try {
      await updateDoc(matchRef, updatedMatchData as { [key: string]: any });
  } catch (error) {
      console.error("Error updating match:", error);
      throw new Error("Could not update match.");
  }

  revalidatePath('/matches');
  revalidatePath(`/matches/${matchId}`);
}


export const getMatchOfficials = cache(async (matchId: string): Promise<Official[]> => {
  const match = await getMatch(matchId);
  if (!match) return [];

  try {
    const officialsCol = collection(db, 'matches', matchId, 'officials');
    const officialsSnapshot = await getDocs(officialsCol);

    const officialsPromises = officialsSnapshot.docs.map(async (officialDoc) => {
      const officialData = officialDoc.data();
      const personSnap = await getDoc(doc(db, 'people', officialData.personId));

      if (!personSnap.exists()) {
        return null;
      }
      const personData = personSnap.data();
      return {
        assignmentId: officialDoc.id, personId: officialData.personId,
        personName: `${personData.firstName} ${personData.lastName}`,
        role: officialData.role, confirmed: officialData.confirmed || false,
      };
    });

    const officials = (await Promise.all(officialsPromises)).filter((o): o is Official => o !== null);
    return officials;
  } catch (error) {
    console.error(`Error fetching officials for match ${matchId}:`, error);
    return [];
  }
});

const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;


export async function assignOfficialToMatchAction(matchId: string, data: AssignmentFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");

  const match = await getMatch(matchId);
  if (!match) {
    throw new Error("Match not found or you do not have permission to edit it.");
  }
  
  const person = await getPerson(data.personId);
  if (!person) {
    throw new Error("Official not found or you do not have permission to assign them.");
  }

  const validatedFields = assignmentSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid assignment data.');
  }
  
  const { personId, role } = validatedFields.data;
  
  const officialsCol = collection(db, 'matches', matchId, 'officials');
  
  try {
    const q = query(officialsCol, where("personId", "==", personId));
    const existingAssignment = await getDocs(q);
    if (!existingAssignment.empty) {
      throw new Error("This person is already assigned to the match.");
    }
    await addDoc(officialsCol, { personId, role, confirmed: false, userId: match.userId });
  } catch (error) {
    console.error("Error assigning official to match: ", error);
    if (error instanceof Error) { throw error; }
    throw new Error("Could not assign official to match.");
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function acceptAssignmentAction(matchId: string, assignmentId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const officialDocRef = doc(db, 'matches', matchId, 'officials', assignmentId);
    const officialSnap = await getDoc(officialDocRef);

    if (!officialSnap.exists()) {
        throw new Error("Assignment not found.");
    }

    const assignmentData = officialSnap.data();
    if (assignmentData.personId !== userId) {
        throw new Error("You do not have permission to accept this assignment.");
    }

    if (assignmentData.confirmed) {
        return { success: true, message: "Assignment already confirmed." };
    }

    try {
        await updateDoc(officialDocRef, { confirmed: true });
    } catch (error) {
        console.error("Error confirming assignment:", error);
        throw new Error("Could not confirm assignment.");
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export const getMatchLineup = cache(async (matchId: string, teamId: string): Promise<Lineup> => {
  const defaultLineup: Lineup = { playingXI: [], twelfthMan: null };
  const match = await getMatch(matchId);
  if (!match || !teamId) return defaultLineup;
  try {
    const lineupDocRef = doc(db, 'matches', matchId, 'lineups', teamId);
    const lineupSnap = await getDoc(lineupDocRef);
    if (lineupSnap.exists()) {
      return lineupSnap.data() as Lineup;
    }
    return defaultLineup;
  } catch (error) {
    console.error(`Error fetching lineup for match ${matchId}, team ${teamId}:`, error);
    return defaultLineup;
  }
});

const lineupSchema = z.object({
  playingXI: z.array(z.string()).min(0).max(11, "Playing XI can have at most 11 players."),
  twelfthMan: z.string().nullable(),
});

export async function saveMatchLineupAction(matchId: string, teamId: string, lineup: Lineup) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  
  const hasPermission = await isTeamManagerOrAdmin(teamId, userId);
  if (!hasPermission) {
    throw new Error("You do not have permission to edit this team's lineup.");
  }

  if (!lineupSchema.safeParse(lineup).success) {
      throw new Error('Invalid lineup data.');
  }

  try {
    await setDoc(doc(db, 'matches', matchId, 'lineups', teamId), lineup);
  } catch (error) {
    console.error("Error saving lineup: ", error);
    throw new Error("Could not save lineup.");
  }
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function confirmLineupAction(matchId: string, teamId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found.");

    const roster = await getTeamRoster(teamId);
    const captainAssignment = roster.find(m => m.personId === userId && m.isCaptain);
    if (!captainAssignment) {
        throw new Error("You are not the captain of this team.");
    }

    const matchRef = doc(db, 'matches', matchId);
    const updateField = match.teamAId === teamId ? 'lineupConfirmedByCaptainA' : 'lineupConfirmedByCaptainB';
    
    try {
        await updateDoc(matchRef, { [updateField]: true });
        revalidatePath(`/matches/${matchId}`);
        return { success: true, message: 'Lineup confirmed successfully!' };
    } catch (error) {
        console.error("Error confirming lineup:", error);
        throw new Error("Could not confirm lineup.");
    }
}

export async function removeOfficialFromMatchAction(matchId: string, assignmentId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");
    try {
        await deleteDoc(doc(db, 'matches', matchId, 'officials', assignmentId));
    } catch (error) {
        console.error("Error removing official:", error);
        throw new Error("Could not remove official.");
    }
    revalidatePath(`/matches/${matchId}`);
}

export async function deleteMatchAction(matchId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists() || matchSnap.data().userId !== userId) {
        throw new Error("Match not found or you do not have permission to delete it.");
    }

    const batch = writeBatch(db);

    const subcollections = ['lineups', 'officials', 'scorecards', 'transportAssignments'];
    for (const sub of subcollections) {
        const subColRef = collection(db, 'matches', matchId, sub);
        const subColSnap = await getDocs(subColRef);
        subColSnap.forEach(doc => batch.delete(doc.ref));
    }

    batch.delete(matchRef);
    
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error deleting match and its subcollections:", error);
        throw new Error("Could not delete match.");
    }
    revalidatePath('/matches');
    revalidatePath('/');
}

// SCORECARD ACTIONS
export const getScorecard = cache(async (matchId: string): Promise<{ innings1: Innings; innings2: Innings } | null> => {
  const match = await getMatch(matchId);
  if (!match) return null;

  try {
    const innings1Ref = doc(db, 'matches', matchId, 'scorecards', 'innings1');
    const innings2Ref = doc(db, 'matches', matchId, 'scorecards', 'innings2');
    const [innings1Snap, innings2Snap] = await Promise.all([getDoc(innings1Ref), getDoc(innings2Ref)]);
    
    if (innings1Snap.exists() && innings2Snap.exists()) {
      return {
        innings1: innings1Snap.data() as Innings,
        innings2: innings2Snap.data() as Innings,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching scorecard for match ${matchId}:`, error);
    return [];
  }
});

export async function saveScorecard(matchId: string, scorecardData: { innings1: Innings; innings2: Innings }, potmData: PlayerOfTheMatch) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  const match = await getMatch(matchId);
  if (!match) throw new Error("Match not found or permission denied.");

  const batch = writeBatch(db);

  const innings1Ref = doc(db, 'matches', matchId, 'scorecards', 'innings1');
  batch.set(innings1Ref, scorecardData.innings1);
  
  const innings2Ref = doc(db, 'matches', matchId, 'scorecards', 'innings2');
  batch.set(innings2Ref, scorecardData.innings2);
  
  const { innings1, innings2 } = scorecardData;
  let winnerTeamId: string | null = null;
  let result = "Match Drawn";

  if (innings1.totalRuns > innings2.totalRuns) {
      const winnerTeamName = innings1.teamName;
      winnerTeamId = match.teamAName === winnerTeamName ? match.teamAId : match.teamBId;
      const margin = innings1.totalRuns - innings2.totalRuns;
      result = `${winnerTeamName} won by ${margin} runs`;
  } else if (innings2.totalRuns > innings1.totalRuns) {
      const winnerTeamName = innings2.teamName;
      winnerTeamId = match.teamAName === winnerTeamName ? match.teamAId : match.teamBId;
      const wicketsRemaining = 10 - innings2.wickets;
      result = `${winnerTeamName} won by ${wicketsRemaining} wickets`;
  }
  
  const matchRef = doc(db, 'matches', matchId);
  batch.update(matchRef, { 
    status: 'completed', 
    playerOfTheMatch: potmData,
    winnerTeamId,
    result,
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error(`Error saving scorecard for match ${matchId}:`, error);
    throw new Error("Could not save scorecard.");
  }
  
  revalidatePath(`/matches/${matchId}`);
  revalidatePath('/matches');
  revalidatePath('/');
}

export const getMatchesByField = cache(async (fieldId: string): Promise<Match[]> => {
  const userId = await getUserId();
  if (!userId) return [];
  if (!fieldId) return [];

  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId), where("fieldId", "==", fieldId));
    const matchSnapshot = await getDocs(q);

    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
      } as Match;
    });

    return matchesList.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  } catch (error) {
    console.error(`Error fetching matches for field ${fieldId}:`, error);
    return [];
  }
});

// LIVE SCORING ACTIONS
async function checkScoringPermission(matchId: string, userId: string): Promise<boolean> {
    const user = await getPerson(userId);
    if (!user) return false;
    if (user.roles.includes('Admin') || user.roles.includes('Sportsmaster')) {
        return true;
    }
    const officials = await getMatchOfficials(matchId);
    const isOfficial = officials.some(o => o.personId === userId && o.confirmed);
    return isOfficial;
}


export async function updateLivePlayersAction(matchId: string, updates: Partial<LiveScore>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");
    
    if (!(await checkScoringPermission(matchId, userId))) {
        throw new Error("You do not have permission to score this match.");
    }
    
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
        throw new Error("Match not found or permission denied.");
    }

    const currentLiveScore: LiveScore = matchSnap.data().liveScore || {};
    
    const liveScoreUpdate: { [key: string]: any } = {};
    if (updates.onStrikeBatsmanId !== undefined) {
        liveScoreUpdate['liveScore.onStrikeBatsmanId'] = updates.onStrikeBatsmanId;
        const batsmanStatsKey = `liveScore.batsmanStats.${updates.onStrikeBatsmanId!}`;
        if (!currentLiveScore.batsmanStats?.[updates.onStrikeBatsmanId!]) {
            liveScoreUpdate[batsmanStatsKey] = { runs: 0, balls: 0, timeIn: Timestamp.now() };
            liveScoreUpdate['liveScore.extras.partnership'] = 0;
            liveScoreUpdate['liveScore.extras.partnershipStartTime'] = Timestamp.now();
        }
    }
     if (updates.nonStrikerBatsmanId !== undefined) {
        liveScoreUpdate['liveScore.nonStrikerBatsmanId'] = updates.nonStrikerBatsmanId;
        const batsmanStatsKey = `liveScore.batsmanStats.${updates.nonStrikerBatsmanId}`;
        if (!currentLiveScore.batsmanStats?.[updates.nonStrikerBatsmanId!]) {
            liveScoreUpdate[batsmanStatsKey] = { runs: 0, balls: 0, timeIn: Timestamp.now() };
            if(!liveScoreUpdate['liveScore.extras.partnershipStartTime']) {
                liveScoreUpdate['liveScore.extras.partnershipStartTime'] = Timestamp.now();
            }
        }
    }
    if (updates.bowlerId !== undefined) {
        liveScoreUpdate['liveScore.bowlerId'] = updates.bowlerId;
        liveScoreUpdate['liveScore.endOfOver'] = false;
    }
    if (updates.bowlingAngle) liveScoreUpdate['liveScore.bowlingAngle'] = updates.bowlingAngle;
    if (updates.newBatsmanRequired !== undefined) liveScoreUpdate['liveScore.newBatsmanRequired'] = updates.newBatsmanRequired;
    
    await updateDoc(matchRef, liveScoreUpdate);
    revalidatePath(`/matches/${matchId}`);
}

export async function recordBallAction(matchId: string, ball: { runs?: number, event: string, angle?: number, distance?: number, dismissal?: { type: string, fielderIds?: string[] } }): Promise<{ liveScore: LiveScore, milestone?: number, isHatTrick?: boolean, isDuck?: boolean, isMaidenOver?: boolean } | null> {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    if (!(await checkScoringPermission(matchId, userId))) {
        throw new Error("You do not have permission to score this match.");
    }

    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
        throw new Error("Match not found or permission denied.");
    }
    
    const match = matchSnap.data() as Match;
    const liveScore: LiveScore = match.liveScore || {
        runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [], batsmanStats: {}, bowlerStats: {}, extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0 }, bowlingAngle: 'Over the Wicket'
    };
    
    if (!liveScore.batsmanStats) liveScore.batsmanStats = {};
    if (!liveScore.bowlerStats) liveScore.bowlerStats = {};
    if (!liveScore.shots) liveScore.shots = [];
    if (!liveScore.extras) liveScore.extras = { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0 };
    if (!liveScore.batsmenOut) liveScore.batsmenOut = [];
    if (!liveScore.ballHistory) liveScore.ballHistory = [];
    if (!liveScore.partnerships) liveScore.partnerships = [];
    if (!liveScore.fallOfWickets) liveScore.fallOfWickets = [];


    if (!liveScore.onStrikeBatsmanId || !liveScore.nonStrikerBatsmanId || !liveScore.bowlerId) {
        throw new Error("Live scoring players are not set up.");
    }
    
    const bowlerCurrentStats = liveScore.bowlerStats[liveScore.bowlerId] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0, consecutiveWickets: 0 };
    if (liveScore.balls === 0 && liveScore.bowlerId === liveScore.lastBowlerId) {
        throw new Error("A bowler cannot bowl consecutive overs.");
    }
    if (bowlerCurrentStats.overs >= 4) {
        throw new Error("This bowler has already bowled their maximum of 4 overs.");
    }

    if (liveScore.overs >= 20) {
        throw new Error("The innings is complete. No more balls can be bowled.");
    }
    
    const previousLiveScore = JSON.parse(JSON.stringify(liveScore));

    const onStrikeId = liveScore.onStrikeBatsmanId;
    const bowlerId = liveScore.bowlerId;
    
    
    const isWicket = ball.event === 'W';
    const isNoBall = ball.event === 'nb';
    const isWide = ball.event === 'wd';
    const isLegalDelivery = !isNoBall && !isWide;
    
    const runsFromBall = ball.runs ?? 0;
    
    const scoreBefore = liveScore.batsmanStats[onStrikeId]?.runs || 0;
    let milestone: number | undefined = undefined;
    let isHatTrick = false;
    let isDuck = false;
    let isMaidenOver = false;
    
    if (isWide) {
        liveScore.runs += 1 + runsFromBall;
        liveScore.extras.total += 1 + runsFromBall;
        liveScore.extras.wides += 1 + runsFromBall;
    } else if (isNoBall) {
        liveScore.runs += 1 + runsFromBall;
        liveScore.extras.total++;
        liveScore.extras.noBalls++;
        liveScore.batsmanStats[onStrikeId] = liveScore.batsmanStats[onStrikeId] || { runs: 0, balls: 0, timeIn: new Date() };
        liveScore.batsmanStats[onStrikeId].runs += runsFromBall;
        liveScore.extras.partnership += runsFromBall;
    } else if (ball.event === 'b' || ball.event === 'lb') {
        liveScore.runs += runsFromBall;
        liveScore.extras.total += runsFromBall;
        if (ball.event === 'b') liveScore.extras.byes += runsFromBall;
        if (ball.event === 'lb') liveScore.extras.legByes += runsFromBall;
    } else if (!isWicket) {
        liveScore.runs += runsFromBall;
        liveScore.extras.partnership += runsFromBall;
        liveScore.batsmanStats[onStrikeId] = liveScore.batsmanStats[onStrikeId] || { runs: 0, balls: 0, timeIn: new Date() };
        liveScore.batsmanStats[onStrikeId].runs += runsFromBall;
    }

    const scoreAfter = liveScore.batsmanStats[onStrikeId]?.runs || 0;
    const milestones = [50, 100, 150, 200, 250, 300];
    for (const m of milestones) {
        if (scoreBefore < m && scoreAfter >= m) {
            milestone = m;
            break;
        }
    }


    if (onStrikeId && isLegalDelivery) {
        liveScore.batsmanStats[onStrikeId] = liveScore.batsmanStats[onStrikeId] || { runs: 0, balls: 0, timeIn: new Date() };
        liveScore.batsmanStats[onStrikeId].balls++;
    }
    
    if (bowlerId) {
        liveScore.bowlerStats[bowlerId] = liveScore.bowlerStats[bowlerId] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0, consecutiveWickets: 0 };
        if (isWide) {
            liveScore.bowlerStats[bowlerId].runsConceded += 1 + runsFromBall;
        } else if (isNoBall) {
             liveScore.bowlerStats[bowlerId].runsConceded += 1;
        } else if(!isWicket && ball.event !== 'b' && ball.event !== 'lb') {
            liveScore.bowlerStats[bowlerId].runsConceded += runsFromBall;
        }
        
        if (isWicket && ball.dismissal?.type !== 'Run Out') liveScore.bowlerStats[bowlerId].wickets++;

        if (isLegalDelivery) {
            if (isWicket) {
                liveScore.bowlerStats[bowlerId].consecutiveWickets = (liveScore.bowlerStats[bowlerId].consecutiveWickets || 0) + 1;
                if (liveScore.bowlerStats[bowlerId].consecutiveWickets === 3) {
                    isHatTrick = true;
                }
            } else if (runsFromBall > 0) {
                liveScore.bowlerStats[bowlerId].consecutiveWickets = 0;
            }
        }
    }

    if (isWicket) {
        if (liveScore.wickets < 10) {
            liveScore.wickets++;
            if (onStrikeId) {
                const batsmanCurrentScore = liveScore.batsmanStats[onStrikeId]?.runs || 0;
                if (batsmanCurrentScore === 0 && liveScore.batsmanStats[onStrikeId].balls === 1) {
                    isDuck = true;
                }
                liveScore.batsmenOut.push(onStrikeId);
                const outBatsmanStats = liveScore.batsmanStats[onStrikeId];
                outBatsmanStats.timeOut = new Date();
                
                const bowler = bowlerId ? await getPerson(bowlerId) : null;
                const fielder = ball.dismissal?.fielderIds?.[0] ? await getPerson(ball.dismissal.fielderIds[0]) : null;
                
                let status = `${ball.dismissal?.type}`;
                if (fielder) status += ` c. ${fielder.firstName.charAt(0)}. ${fielder.lastName}`;
                if (bowler) status += ` b. ${bowler.firstName.charAt(0)}. ${bowler.lastName}`;
                outBatsmanStats.status = status;

                const onStrikeBatsman = await getPerson(onStrikeId);
                if (onStrikeBatsman) {
                    liveScore.fallOfWickets.push({
                        wicketNumber: liveScore.wickets,
                        runs: liveScore.runs,
                        batsmanName: `${onStrikeBatsman.firstName} ${onStrikeBatsman.lastName}`,
                        timestamp: new Date(),
                    });
                }
                
                // Finalize partnership
                const nonStriker = await getPerson(liveScore.nonStrikerBatsmanId!);
                if (liveScore.partnerships && onStrikeBatsman && nonStriker) {
                  liveScore.partnerships.push({
                      batsman1Id: onStrikeId,
                      batsman2Id: liveScore.nonStrikerBatsmanId!,
                      batsman1Name: `${onStrikeBatsman.firstName} ${onStrikeBatsman.lastName}`,
                      batsman2Name: `${nonStriker.firstName} ${nonStriker.lastName}`,
                      totalRuns: liveScore.extras.partnership || 0,
                      totalBalls: 0, // Not yet tracked
                      batsman1Runs: liveScore.batsmanStats[onStrikeId]?.runs,
                      batsman1Balls: liveScore.batsmanStats[onStrikeId]?.balls,
                      batsman2Runs: liveScore.batsmanStats[liveScore.nonStrikerBatsmanId!]?.runs,
                      batsman2Balls: liveScore.batsmanStats[liveScore.nonStrikerBatsmanId!]?.balls,
                  });
                }
            }
            liveScore.onStrikeBatsmanId = null; 
            liveScore.extras.partnership = 0;
            liveScore.extras.partnershipStartTime = new Date();
            liveScore.newBatsmanRequired = true; 
        }
    }
    
    if (ball.angle !== undefined && ball.distance !== undefined && onStrikeId) {
        if (!liveScore.shots) liveScore.shots = [];
        liveScore.shots.push({ runs: runsFromBall, angle: ball.angle, distance: ball.distance, batsmanId: onStrikeId });
    }
    
    liveScore.currentOver.push(ball.event);
    
    if (liveScore.ballHistory) {
      liveScore.ballHistory.push(ball.event);
      if (liveScore.ballHistory.length > 18) {
        liveScore.ballHistory.shift();
      }
    }

    if (isLegalDelivery) {
        liveScore.balls++;
    }
    
    const endOfOver = liveScore.balls >= 6 && isLegalDelivery;

    if (endOfOver) {
        liveScore.overs++;
        liveScore.balls = 0;
        const overRuns = liveScore.currentOver.reduce((sum, e) => {
            if (e.includes('wd') || e.includes('nb')) {
                const extraRun = parseInt(e.replace(/[^0-9]/g, '')) || 0;
                return sum + 1 + extraRun;
            }
            if (!isNaN(parseInt(e, 10))) {
                return sum + parseInt(e, 10);
            }
            return sum;
        }, 0);
        
        if(liveScore.bowlerStats[bowlerId]) {
            liveScore.bowlerStats[bowlerId].overs = (liveScore.bowlerStats[bowlerId].overs || 0) + 1;
            liveScore.bowlerStats[bowlerId].balls = 0;
            if(overRuns === 0) {
                liveScore.bowlerStats[bowlerId].maidens++;
                isMaidenOver = true;
            }
        }
        
        liveScore.currentOver = [];
        liveScore.endOfOver = true; // Flag for UI
        liveScore.lastBowlerId = bowlerId; // Use the correct ID
        liveScore.bowlerId = null; // Clear bowler for next over selection
        
        const lastBallWicket = isWicket && liveScore.balls === 0;
        if (!lastBallWicket) {
             [liveScore.onStrikeBatsmanId, liveScore.nonStrikerBatsmanId] = [liveScore.nonStrikerBatsmanId, liveScore.onStrikeBatsmanId];
        }
    } else {
        liveScore.endOfOver = false;
        const runsThatRotateStrike = (isWide || isNoBall) ? runsFromBall : (isLegalDelivery ? runsFromBall : 0);
        const isOddRun = runsThatRotateStrike % 2 !== 0;

        if (isOddRun) {
            [liveScore.onStrikeBatsmanId, liveScore.nonStrikerBatsmanId] = [liveScore.nonStrikerBatsmanId, liveScore.onStrikeBatsmanId];
        }
    }
    

    await updateDoc(matchRef, { liveScore, previousLiveScore });
    revalidatePath(`/matches/${matchId}`);
    return { liveScore, milestone, isHatTrick, isDuck, isMaidenOver };
}


export async function simulateBallAction(matchId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");
    if (!(await checkScoringPermission(matchId, userId))) {
        throw new Error("You do not have permission to score this match.");
    }

    const outcomes = [
        { event: '.', runs: 0, probability: 0.4 },
        { event: '1', runs: 1, probability: 0.3 },
        { event: '2', runs: 2, probability: 0.1 },
        { event: '4', runs: 4, probability: 0.1 },
        { event: 'W', runs: 0, probability: 0.05 },
        { event: 'wd', probability: 0.02 },
        { event: '6', runs: 6, probability: 0.02 },
        { event: 'nb', probability: 0.01 },
    ];

    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedOutcome = outcomes[0];

    for (const outcome of outcomes) {
        cumulativeProbability += outcome.probability;
        if (random <= cumulativeProbability) {
            selectedOutcome = outcome;
            break;
        }
    }
    
    const angle = Math.random() * 360;
    const distance = 0.5 + Math.random() * 0.5;

    await recordBallAction(matchId, { ...selectedOutcome, angle, distance });
}

export async function undoLastBallAction(matchId: string, reason: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");
    if (!(await checkScoringPermission(matchId, userId))) {
        throw new Error("You do not have permission to score this match.");
    }
    
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
        throw new Error("Match not found or permission denied.");
    }

    const match = matchSnap.data() as Match;
    if (!match.previousLiveScore) {
        throw new Error("No action to undo.");
    }

    await updateDoc(matchRef, {
        liveScore: match.previousLiveScore,
        previousLiveScore: null,
    });
    
    await logAuditEvent({
        action: 'match.live_score.undo',
        target: { type: 'Match', id: matchId, name: `${match.teamAName} vs ${match.teamBName}` },
        details: { reason }
    });

    revalidatePath(`/matches/${matchId}`);
}

export async function endInningsAction(matchId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");
    if (!(await checkScoringPermission(matchId, userId))) {
        throw new Error("You do not have permission to score this match.");
    }
    
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
        throw new Error("Match not found or permission denied.");
    }
    
    const match = matchSnap.data() as Match;
    const currentLiveScore = match.liveScore;

    if (!currentLiveScore) {
        throw new Error("No live score data available to end innings.");
    }

    if (currentLiveScore.liveInnings === 1) {
        // Record timeOut for not-out batsmen
        if (currentLiveScore.onStrikeBatsmanId && currentLiveScore.batsmanStats?.[currentLiveScore.onStrikeBatsmanId]) {
            currentLiveScore.batsmanStats[currentLiveScore.onStrikeBatsmanId].timeOut = new Date();
        }
        if (currentLiveScore.nonStrikerBatsmanId && currentLiveScore.batsmanStats?.[currentLiveScore.nonStrikerBatsmanId]) {
            currentLiveScore.batsmanStats[currentLiveScore.nonStrikerBatsmanId].timeOut = new Date();
        }
        
        const newLiveScore: LiveScore = {
            runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 2, shots: [],
            onStrikeBatsmanId: null,
            nonStrikerBatsmanId: null,
            bowlerId: null,
            batsmanStats: {}, bowlerStats: {}, extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0, partnershipStartTime: new Date() }, bowlingAngle: 'Over the Wicket'
        };
        
        await updateDoc(matchRef, { 
            firstInningsLiveScore: currentLiveScore, // Save the completed innings data
            liveScore: newLiveScore,
            firstInningsTotal: currentLiveScore.runs,
        });
        revalidatePath(`/matches/${matchId}`);
        return { message: "First innings ended. Second innings is ready." };

    } else if (currentLiveScore.liveInnings === 2) {
         if (currentLiveScore.onStrikeBatsmanId && currentLiveScore.batsmanStats?.[currentLiveScore.onStrikeBatsmanId]) {
            currentLiveScore.batsmanStats[currentLiveScore.onStrikeBatsmanId].timeOut = new Date();
        }
        if (currentLiveScore.nonStrikerBatsmanId && currentLiveScore.batsmanStats?.[currentLiveScore.nonStrikerBatsmanId]) {
            currentLiveScore.batsmanStats[currentLiveScore.nonStrikerBatsmanId].timeOut = new Date();
        }
        
        const firstInningsRuns = match.firstInningsTotal || 0;
        const secondInningsRuns = currentLiveScore.runs;

        let winnerTeamId: string | null = null;
        let result: string;
        let winnerTeamName: string | null = null;

        if (secondInningsRuns > firstInningsRuns) {
            winnerTeamId = match.teamBId; 
            winnerTeamName = match.teamBName;
            const wicketsRemaining = 10 - currentLiveScore.wickets;
            result = `${winnerTeamName} won by ${wicketsRemaining} wickets`;
        } else if (firstInningsRuns > secondInningsRuns) {
            winnerTeamId = match.teamAId; 
            winnerTeamName = match.teamAName;
            const margin = firstInningsRuns - secondInningsRuns;
            result = `${winnerTeamName} won by ${margin} runs`;
        } else {
            result = "Match Tied";
        }
        
        // Finalize scorecard from live data
        const scorecard = await createScorecardFromLive(matchId);
        
        await updateDoc(matchRef, {
            status: 'completed', winnerTeamId, result,
            liveScore: null, previousLiveScore: null,
        });
        
        if (scorecard) {
            const innings1Ref = doc(db, 'matches', matchId, 'scorecards', 'innings1');
            const innings2Ref = doc(db, 'matches', matchId, 'scorecards', 'innings2');
            const batch = writeBatch(db);
            batch.set(innings1Ref, scorecard.innings1);
            batch.set(innings2Ref, scorecard.innings2);
            await batch.commit();
        }

        revalidatePath(`/matches/${matchId}`);
        revalidatePath('/');
        return { message: "Match completed!" };
    }
}

async function createScorecardFromLive(matchId: string) {
    const match = await getMatch(matchId);
    if (!match || !match.firstInningsLiveScore || !match.liveScore) return null;

    const createInningsData = async (liveScore: LiveScore, teamId: string): Promise<Innings> => {
        const team = (await getTeam(teamId))!;
        const roster = await getTeamRoster(teamId);
        const opponentRoster = await getTeamRoster(teamId === match.teamAId ? match.teamBId : match.teamAId);
        
        const battingCard: BatsmanStats[] = roster.map(player => {
            const stats = liveScore.batsmanStats[player.personId];
            if (!stats) {
                return { name: player.personName, status: 'did not bat', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, timeAtCrease: 0 };
            }
            
            // Check if timeIn and timeOut are Firebase Timestamps or JS Dates
            const timeIn = stats.timeIn instanceof Timestamp ? stats.timeIn.toDate() : (stats.timeIn ? new Date(stats.timeIn) : null);
            const timeOut = stats.timeOut instanceof Timestamp ? stats.timeOut.toDate() : (stats.timeOut ? new Date(stats.timeOut) : null);

            const timeAtCrease = timeIn && timeOut ? Math.round((timeOut.getTime() - timeIn.getTime()) / 60000) : 0;
            return {
                name: player.personName,
                status: liveScore.batsmenOut?.includes(player.personId) ? (stats.status || 'out') : 'not out',
                runs: stats.runs,
                balls: stats.balls,
                fours: 0, // This detail isn't tracked yet
                sixes: 0,
                strikeRate: stats.balls > 0 ? (stats.runs / stats.balls) * 100 : 0,
                timeAtCrease,
            };
        });

        const bowlingCard = Object.entries(liveScore.bowlerStats).map(([bowlerId, stats]) => {
            const bowler = opponentRoster.find(p => p.personId === bowlerId);
            const oversWhole = Math.floor(stats.overs || 0);
            const ballsFraction = stats.balls || 0;
            const totalBalls = (oversWhole * 6) + ballsFraction;
            const economy = totalBalls > 0 ? ((stats.runsConceded || 0) / totalBalls) * 6 : 0;
            return {
                name: bowler?.personName || 'Unknown Bowler',
                overs: stats.overs,
                maidens: stats.maidens,
                runs: stats.runsConceded,
                wickets: stats.wickets,
                economy: economy,
            };
        });

        const oversDecimal = liveScore.overs + ((liveScore.balls || 0) / 6);

        return {
            teamName: team.name,
            totalRuns: liveScore.runs,
            wickets: liveScore.wickets,
            overs: parseFloat(oversDecimal.toFixed(1)),
            battingCard,
            bowlingCard,
            fallOfWickets: [], // Not tracked yet
            extras: { total: liveScore.extras.total, details: '' },
        };
    };
    
    const innings1Data = await createInningsData(match.firstInningsLiveScore, match.teamAId);
    const innings2Data = await createInningsData(match.liveScore, match.teamBId);
    
    // This action is now separate. The flow that calls this will save the PotM.
    // const potmData = await generatePlayerOfTheMatch({ innings1: innings1Data, innings2: innings2Data });

    return { scorecard: { innings1: innings1Data, innings2: innings2Data } };
}

export const getOfficialAssignmentsForPerson = cache(async (personId: string): Promise<(Official & { matchId: string; matchName: string; dateTime: Date; status: MatchStatus; })[]> => {
    const userId = await getUserId();
    if (!userId || !personId) return [];
    try {
        const assignmentsQuery = query(collectionGroup(db, 'officials'), where("personId", "==", personId));
        const snapshot = await getDocs(assignmentsQuery);
        if (snapshot.empty) return [];

        const assignmentsPromises = snapshot.docs.map(async (docSnap) => {
            const assignmentData = docSnap.data();
            const matchRef = docSnap.ref.parent.parent; 
            if (!matchRef) return null;
            
            const match = await getMatch(matchRef.id);
            if (!match) return null;
            
            return {
                assignmentId: docSnap.id,
                matchId: match.matchId,
                matchName: `${match.teamAName} vs ${match.teamBName}`,
                dateTime: match.dateTime,
                status: match.status,
                personId: assignmentData.personId,
                personName: (await getPerson(assignmentData.personId))?.firstName + ' ' + (await getPerson(assignmentData.personId))?.lastName,
                role: assignmentData.role,
                confirmed: assignmentData.confirmed,
            }
        });
        const results = (await Promise.all(assignmentsPromises)).filter((a): a is any => a !== null);
        return results.sort((a: any, b: any) => a.dateTime.getTime() - b.dateTime.getTime());

    } catch (error) {
        console.error("Error fetching official assignments:", error);
        return [];
    }
});


export async function updatePlayerAvailabilityAction(matchId: string, status: AvailabilityStatus, note?: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated.");

  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error("Match not found.");
  }
  
  const availabilityUpdate = {
    [`availability.${userId}.status`]: status,
    [`availability.${userId}.note`]: note || '',
  };

  try {
    await updateDoc(matchRef, availabilityUpdate);
    revalidatePath('/dashboard');
    revalidatePath(`/matches/${matchId}`);
  } catch (error) {
    console.error("Error updating availability:", error);
    throw new Error("Could not update availability.");
  }
}
      
    

    





