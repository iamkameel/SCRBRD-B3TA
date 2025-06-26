
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, Timestamp, query, where, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import type { Match, Official, Innings } from '@/lib/data';
import { getPerson } from './players';
import type { GenerateScorecardOutput } from '@/ai/flows/generate-scorecard-flow';
import { generateScorecard } from '@/ai/flows/generate-scorecard-flow';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getMatches(): Promise<Match[]> {
  if (!userId) return [];
  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId));
    const matchSnapshot = await getDocs(q);
    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
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
  teamAId: z.string(), teamBId: z.string(), seasonId: z.string(), fieldId: z.string(), dateTime: z.date(),
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

export async function addMatchAction(data: FixtureFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = fixtureSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid match data.');
  }

  const { teamAId, teamBId, seasonId, fieldId, dateTime } = validatedFields.data;

  const [teamASnap, teamBSnap, seasonSnap, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)), getDoc(doc(db, 'teams', teamBId)),
    getDoc(doc(db, 'seasons', seasonId)), getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || teamASnap.data().userId !== userId || !teamBSnap.exists() || teamBSnap.data().userId !== userId || !seasonSnap.exists() || seasonSnap.data().userId !== userId || !fieldSnap.exists() || fieldSnap.data().userId !== userId) {
    throw new Error("Invalid reference for one of the match entities. Ensure they belong to you.");
  }
  
  const newMatchData = {
    teamAId, teamAName: teamASnap.data().name, teamBId, teamBName: teamBSnap.data().name,
    seasonId, seasonName: seasonSnap.data().name, fieldId, fieldName: fieldSnap.data().name,
    dateTime: Timestamp.fromDate(dateTime), status: 'scheduled', userId: userId,
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

  const { teamAId, teamBId, seasonId, fieldId, dateTime } = validatedFields.data;

  const [teamASnap, teamBSnap, seasonSnap, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)), getDoc(doc(db, 'teams', teamBId)),
    getDoc(doc(db, 'seasons', seasonId)), getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || !teamBSnap.exists() || !seasonSnap.exists() || !fieldSnap.exists()) {
      throw new Error("Invalid reference for one of the match entities.");
  }

  const updatedMatchData = {
    teamAId, teamAName: teamASnap.data().name, teamBId, teamBName: teamBSnap.data().name,
    seasonId, seasonName: seasonSnap.data().name, fieldId, fieldName: fieldSnap.data().name,
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

    const subcollections = ['lineups', 'officials', 'scorecards'];
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
    return null;
  }
}

export async function saveScorecard(matchId: string, scorecardData: GenerateScorecardOutput) {
  if (!userId) throw new Error("User not authenticated");
  const match = await getMatch(matchId);
  if (!match) throw new Error("Match not found or permission denied.");

  const batch = writeBatch(db);

  const innings1Ref = doc(db, 'matches', matchId, 'scorecards', 'innings1');
  batch.set(innings1Ref, scorecardData.innings1);
  
  const innings2Ref = doc(db, 'matches', matchId, 'scorecards', 'innings2');
  batch.set(innings2Ref, scorecardData.innings2);
  
  const matchRef = doc(db, 'matches', matchId);
  batch.update(matchRef, { status: 'completed' });

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

    // Check if scorecard already exists
    const existingScorecard = await getScorecard(matchId);
    if (existingScorecard) {
        throw new Error("A scorecard for this match already exists.");
    }

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
    
    const generatedData = await generateScorecard({
        teamAName: match.teamAName,
        teamAPlayers: teamAPlayerNames,
        teamBName: match.teamBName,
        teamBPlayers: teamBPlayerNames,
    });
    
    if (generatedData) {
        await saveScorecard(matchId, generatedData);
    } else {
        throw new Error("AI failed to generate scorecard data.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Scorecard generated successfully!" };
}
