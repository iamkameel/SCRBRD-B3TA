

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, Timestamp, query, where, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import type { Match, Official, Innings, MatchForecast, PlayerOfTheMatch } from '@/lib/data';
import { getPerson } from './players';
import type { GenerateScorecardOutput, GenerateMatchReportInput, PlayerOfTheMatchOutput } from '@/ai/schemas';
import { generateScorecard } from '@/ai/flows/generate-scorecard-flow';
import { generateMatchReport } from '@/ai/flows/generate-match-summary-flow';
import { getMatchForecast } from '@/ai/flows/get-match-forecast-flow';
import { generateMatchPreview } from '@/ai/flows/generate-match-preview-flow';
import { generatePlayerOfTheMatch } from '@/ai/flows/generate-player-of-the-match-flow';
import { generateMatchCommentary } from '@/ai/flows/generate-match-commentary-flow';
import { getCompetition } from './competitions';
import { getTeams } from './teams';
import { selectLineup } from '@/ai/flows/select-lineup-flow';
import { generateOppositionAnalysis } from '@/ai/flows/generate-opposition-analysis-flow';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getMatches(): Promise<Match[]> {
  if (!userId) return [];
  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId));
    
    const [teams, matchSnapshot] = await Promise.all([
      getTeams(),
      getDocs(q),
    ]);
    
    const teamColorMap = new Map<string, { primary?: string; secondary?: string }>();
    teams.forEach(team => {
      teamColorMap.set(team.teamId, team.teamColors || {});
    });

    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
        teamAColor: teamColorMap.get(data.teamAId)?.primary,
        teamBColor: teamColorMap.get(data.teamBId)?.primary,
      } as Match;
    });
    return matchesList.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

export async function getMatch(matchId: string): Promise<Match | null> {
  if (!userId) return null;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchDocRef);

    if (!matchSnap.exists() || matchSnap.data().userId !== userId) {
      return null;
    }

    const data = matchSnap.data();
    return {
      matchId: matchSnap.id,
      ...data,
      dateTime: (data.dateTime as Timestamp).toDate(),
    } as Match;
  } catch (error) {
    console.error(`Error fetching match with ID ${matchId}:`, error);
    return null;
  }
}

const fixtureSchema = z.object({
  teamAId: z.string(),
  teamBId: z.string(),
  competitionId: z.string(),
  fieldId: z.string(),
  dateTime: z.date(),
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

export async function addMatchAction(data: FixtureFormValues) {
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

  const startOfDay = new Date(dateTime);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateTime);
  endOfDay.setHours(23, 59, 59, 999);

  const matchesRef = collection(db, 'matches');
  const clashQuery = query(
    matchesRef,
    where("userId", "==", userId),
    where("dateTime", ">=", Timestamp.fromDate(startOfDay)),
    where("dateTime", "<=", Timestamp.fromDate(endOfDay))
  );
  const conflictingMatchesSnapshot = await getDocs(clashQuery);
  const teamANameTemp = (await getDoc(doc(db, 'teams', teamAId))).data()?.name || 'Team A';
  const teamBNameTemp = (await getDoc(doc(db, 'teams', teamBId))).data()?.name || 'Team B';
  const fieldNameTemp = (await getDoc(doc(db, 'fields', fieldId))).data()?.name || 'The selected field';


  for (const matchDoc of conflictingMatchesSnapshot.docs) {
      const existingMatch = matchDoc.data();
      const existingMatchStartTime = (existingMatch.dateTime as Timestamp).toMillis();
      const existingMatchEndTime = new Date(existingMatchStartTime).setHours(new Date(existingMatchStartTime).getHours() + MATCH_DURATION_HOURS);
      
      const timesOverlap = (newMatchStartTime < existingMatchEndTime) && (newMatchEndTime > existingMatchStartTime);

      if (timesOverlap) {
          if (existingMatch.teamAId === teamAId || existingMatch.teamBId === teamAId) {
              throw new Error(`Clash detected: ${teamANameTemp} is already scheduled for a match around this time.`);
          }
          if (existingMatch.teamAId === teamBId || existingMatch.teamBId === teamBId) {
              throw new Error(`Clash detected: ${teamBNameTemp} is already scheduled for a match around this time.`);
          }
          if (existingMatch.fieldId === fieldId) {
              throw new Error(`Clash detected: ${fieldNameTemp} is already booked around this time.`);
          }
      }
  }
  // --- End of Clash Detection ---

  const [teamASnap, teamBSnap, competition, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)),
    getDoc(doc(db, 'teams', teamBId)),
    getCompetition(competitionId),
    getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || teamASnap.data().userId !== userId ||
      !teamBSnap.exists() || teamBSnap.data().userId !== userId ||
      !competition ||
      !fieldSnap.exists() || fieldSnap.data().userId !== userId) {
    throw new Error("Invalid reference for one of the match entities. Ensure they belong to you.");
  }
  
  const newMatchData = {
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
    userId: userId,
    report: '',
    preview: '',
    audioCommentaryUrl: '',
    analysisReports: {},
  };

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

export async function updateMatchAction(matchId: string, data: FixtureFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = fixtureSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid match data.');
  }

  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists() || matchSnap.data().userId !== userId) {
      throw new Error("Match not found or you do not have permission to edit it.");
  }

  const { teamAId, teamBId, competitionId, fieldId, dateTime } = validatedFields.data;

  const [teamASnap, teamBSnap, competition, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)),
    getDoc(doc(db, 'teams', teamBId)),
    getCompetition(competitionId),
    getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || !teamBSnap.exists() || !competition || !fieldSnap.exists()) {
      throw new Error("Invalid reference for one of the match entities.");
  }

  const updatedMatchData = {
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
  };

  try {
      await updateDoc(matchRef, updatedMatchData);
  } catch (error) {
      console.error("Error updating match:", error);
      throw new Error("Could not update match.");
  }

  revalidatePath('/matches');
  revalidatePath(`/matches/${matchId}`);
}


export async function getMatchOfficials(matchId: string): Promise<Official[]> {
  const match = await getMatch(matchId);
  if (!match) return [];

  try {
    const officialsCol = collection(db, 'matches', matchId, 'officials');
    const officialsSnapshot = await getDocs(officialsCol);

    const officialsPromises = officialsSnapshot.docs.map(async (officialDoc) => {
      const officialData = officialDoc.data();
      const personSnap = await getDoc(doc(db, 'people', officialData.personId));

      if (!personSnap.exists() || personSnap.data().userId !== userId) {
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
}

const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;


export async function assignOfficialToMatchAction(matchId: string, data: AssignmentFormValues) {
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
    await addDoc(officialsCol, { personId, role, confirmed: false });
  } catch (error) {
    console.error("Error assigning official to match: ", error);
    if (error instanceof Error) { throw error; }
    throw new Error("Could not assign official to match.");
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function getMatchLineup(matchId: string, teamId: string): Promise<string[]> {
  const match = await getMatch(matchId);
  if (!match) return [];
  
  try {
    const lineupDocRef = doc(db, 'matches', matchId, 'lineups', teamId);
    const lineupSnap = await getDoc(lineupDocRef);
    return lineupSnap.exists() ? lineupSnap.data().playerIds || [] : [];
  } catch (error) {
    console.error(`Error fetching lineup for match ${matchId}, team ${teamId}:`, error);
    return [];
  }
}

const lineupSchema = z.object({ playerIds: z.array(z.string()) });

export async function saveMatchLineupAction(matchId: string, teamId: string, playerIds: string[]) {
  if (!userId) throw new Error("User not authenticated");
  const match = await getMatch(matchId);
  if (!match) throw new Error("Match not found or you do not have permission to edit it.");
  if (!lineupSchema.safeParse({ playerIds }).success) throw new Error('Invalid lineup data.');
  try {
    await setDoc(doc(db, 'matches', matchId, 'lineups', teamId), { playerIds });
  } catch (error) {
    console.error("Error saving lineup: ", error);
    throw new Error("Could not save lineup.");
  }
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function removeOfficialFromMatchAction(matchId: string, assignmentId: string) {
    if (!userId) throw new Error("User not authenticated");
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or you do not have permission to edit it.");
    try {
        await deleteDoc(doc(db, 'matches', matchId, 'officials', assignmentId));
    } catch (error) {
        console.error("Error removing official:", error);
        throw new Error("Could not remove official.");
    }
    revalidatePath(`/matches/${matchId}`);
}

export async function deleteMatchAction(matchId: string) {
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
export async function getScorecard(matchId: string): Promise<{ innings1: Innings; innings2: Innings } | null> {
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
}

export async function saveScorecard(matchId: string, scorecardData: GenerateScorecardOutput, potmData: PlayerOfTheMatchOutput) {
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

export async function generateAndSaveScorecardAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const [teamALineup, teamBLineup] = await Promise.all([
        getMatchLineup(matchId, match.teamAId),
        getMatchLineup(matchId, match.teamBId),
    ]);

    if (teamALineup.length !== 11 || teamBLineup.length !== 11) {
        throw new Error("Both teams must have exactly 11 players selected in their lineup to generate a scorecard.");
    }
    
    const getPlayerNames = async (playerIds: string[]): Promise<string[]> => {
        const personPromises = playerIds.map(id => getPerson(id));
        const people = await Promise.all(personPromises);
        return people.map(p => {
            if (!p) throw new Error("A player in the lineup could not be found.");
            return `${p.firstName} ${p.lastName}`;
        });
    };

    const [teamAPlayerNames, teamBPlayerNames] = await Promise.all([
        getPlayerNames(teamALineup),
        getPlayerNames(teamBLineup),
    ]);
    
    const scorecardData = await generateScorecard({
        teamAName: match.teamAName,
        teamAPlayers: teamAPlayerNames,
        teamBName: match.teamBName,
        teamBPlayers: teamBPlayerNames,
    });
    
    if (!scorecardData) {
        throw new Error("AI failed to generate scorecard data.");
    }
    
    const potmData = await generatePlayerOfTheMatch(scorecardData);

    if (!potmData) {
        throw new Error("AI failed to generate Player of the Match data.");
    }
    
    await saveScorecard(matchId, scorecardData, potmData);

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Scorecard generated successfully!" };
}

export async function generateMatchReportAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const scorecard = await getScorecard(matchId);
    if (!scorecard) throw new Error("A complete scorecard is required to generate a report.");

    const reportInput: GenerateMatchReportInput = {
        teamAName: match.teamAName,
        teamBName: match.teamBName,
        innings1: scorecard.innings1,
        innings2: scorecard.innings2,
    };

    const reportText = await generateMatchReport(reportInput);

    if (!reportText) {
        throw new Error("AI failed to generate a match report.");
    }

    try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { report: reportText });
    } catch (error) {
        console.error(`Error saving report for match ${matchId}:`, error);
        throw new Error("Could not save match report.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Match report generated successfully!" };
}

export async function getMatchForecastAction(matchId: string): Promise<MatchForecast | { error: string }> {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) {
        return { error: "Match not found or permission denied." };
    }

    try {
        const forecast = await getMatchForecast(matchId);
        return forecast;
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        console.error(`Error getting forecast for match ${matchId}:`, error);
        return { error: message };
    }
}

export async function generateMatchPreviewAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match || !match.teamBId) throw new Error("Match not found or opponent is not set.");

    const previewText = await generateMatchPreview(matchId);

    if (!previewText) {
        throw new Error("AI failed to generate a match preview.");
    }

    try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { preview: previewText });
    } catch (error) {
        console.error(`Error saving preview for match ${matchId}:`, error);
        throw new Error("Could not save match preview.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Match preview generated successfully!" };
}

export async function generateMatchCommentaryAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const scorecard = await getScorecard(matchId);
    if (!scorecard) throw new Error("A complete scorecard is required to generate commentary.");
    
    try {
        const { audioUrl } = await generateMatchCommentary({
            innings1: scorecard.innings1,
            innings2: scorecard.innings2,
        });

        if (!audioUrl) {
            throw new Error("AI failed to generate audio commentary.");
        }

        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { audioCommentaryUrl: audioUrl });

        revalidatePath(`/matches/${matchId}`);
        return { success: true, message: "Audio commentary generated successfully!" };

    } catch (error) {
        console.error(`Error generating commentary for match ${matchId}:`, error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate audio commentary.");
    }
}


export async function getMatchesByCompetition(competitionId: string): Promise<Match[]> {
  if (!userId) return [];
  if (!competitionId) return [];
  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId), where("competitionId", "==", competitionId));
    
    const [teams, matchSnapshot] = await Promise.all([
      getTeams(),
      getDocs(q),
    ]);
    
    const teamColorMap = new Map<string, { primary?: string; secondary?: string }>();
    teams.forEach(team => {
      teamColorMap.set(team.teamId, team.teamColors || {});
    });

    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
        teamAColor: teamColorMap.get(data.teamAId)?.primary,
        teamBColor: teamColorMap.get(data.teamBId)?.primary,
      } as Match;
    });
    return matchesList.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  } catch (error) {
    console.error(`Error fetching matches for competition ${competitionId}:`, error);
    return [];
  }
}

export async function autoSelectLineupAction(matchId: string, teamId: string): Promise<{ playerIds: string[], justification: string }> {
    if (!userId) throw new Error("User not authenticated");
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    try {
        const { playerIds, justification } = await selectLineup({ matchId, teamId });
        
        // This action does not save the lineup, it just returns the suggestion.
        // The user will review and click "Save Lineup".
        // The justification will be shown in a toast.

        return { playerIds, justification };
    } catch (error) {
        console.error("Error auto-selecting lineup:", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not auto-select lineup.");
    }
}

export async function generateOppositionAnalysisAction(matchId: string, opponentTeamId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    if (match.status !== 'scheduled') {
        throw new Error("Opposition analysis can only be generated for scheduled matches.");
    }
    
    const opponentTeamName = opponentTeamId === match.teamAId ? match.teamAName : match.teamBName;

    const analysisText = await generateOppositionAnalysis({ opponentTeamId, opponentTeamName });

    if (!analysisText) {
        throw new Error("AI failed to generate an opposition analysis.");
    }

    try {
        const matchRef = doc(db, 'matches', matchId);
        // Use dot notation to update a field in a map
        const updateKey = `analysisReports.${opponentTeamId}`;
        await updateDoc(matchRef, { [updateKey]: analysisText });
    } catch (error) {
        console.error(`Error saving opposition analysis for match ${matchId}:`, error);
        throw new Error("Could not save opposition analysis.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Opposition analysis generated successfully!" };
}

