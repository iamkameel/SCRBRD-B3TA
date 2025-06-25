
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, Timestamp, query, where, setDoc } from 'firebase/firestore';
import type { Match, Official } from '@/lib/data';

export async function getMatches(): Promise<Match[]> {
  try {
    const matchesCollection = collection(db, 'matches');
    const matchSnapshot = await getDocs(matchesCollection);
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
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchDocRef);

    if (!matchSnap.exists()) {
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
  seasonId: z.string(),
  fieldId: z.string(),
  dateTime: z.date(),
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

export async function addMatchAction(data: FixtureFormValues) {
  const validatedFields = fixtureSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid match data.');
  }

  const { teamAId, teamBId, seasonId, fieldId, dateTime } = validatedFields.data;

  const [teamASnap, teamBSnap, seasonSnap, fieldSnap] = await Promise.all([
    getDoc(doc(db, 'teams', teamAId)),
    getDoc(doc(db, 'teams', teamBId)),
    getDoc(doc(db, 'seasons', seasonId)),
    getDoc(doc(db, 'fields', fieldId)),
  ]);

  if (!teamASnap.exists() || !teamBSnap.exists() || !seasonSnap.exists() || !fieldSnap.exists()) {
    throw new Error("Invalid reference for one of the match entities.");
  }
  
  const newMatchData = {
    teamAId,
    teamAName: teamASnap.data().name,
    teamBId,
    teamBName: teamBSnap.data().name,
    seasonId,
    seasonName: seasonSnap.data().name,
    fieldId,
    fieldName: fieldSnap.data().name,
    dateTime: Timestamp.fromDate(dateTime),
    status: 'scheduled',
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


export async function getMatchOfficials(matchId: string): Promise<Official[]> {
  try {
    const officialsCol = collection(db, 'matches', matchId, 'officials');
    const officialsSnapshot = await getDocs(officialsCol);

    const officialsPromises = officialsSnapshot.docs.map(async (officialDoc) => {
      const officialData = officialDoc.data();
      const personSnap = await getDoc(doc(db, 'people', officialData.personId));

      if (!personSnap.exists()) {
        console.warn(`Person with ID ${officialData.personId} not found, but is an official for match ${matchId}`);
        return null;
      }
      const personData = personSnap.data();
      return {
        assignmentId: officialDoc.id,
        personId: officialData.personId,
        personName: `${personData.firstName} ${personData.lastName}`,
        role: officialData.role,
        confirmed: officialData.confirmed || false,
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
  const validatedFields = assignmentSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid assignment data.');
  }
  
  const { personId, role } = validatedFields.data;

  // Check if person exists
  const personDocRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personDocRef);
  if (!personSnap.exists()) {
      throw new Error("Selected person does not exist.");
  }
  
  const officialsCol = collection(db, 'matches', matchId, 'officials');
  
  try {
    // Optional: Check if person is already assigned to this match
    const q = query(officialsCol, where("personId", "==", personId));
    const existingAssignment = await getDocs(q);
    if (!existingAssignment.empty) {
      throw new Error("This person is already assigned to the match.");
    }

    await addDoc(officialsCol, {
        personId,
        role,
        confirmed: false, // Default to not confirmed
    });
  } catch (error) {
    console.error("Error assigning official to match: ", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not assign official to match.");
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function getMatchLineup(matchId: string, teamId: string): Promise<string[]> {
  try {
    const lineupDocRef = doc(db, 'matches', matchId, 'lineups', teamId);
    const lineupSnap = await getDoc(lineupDocRef);
    if (!lineupSnap.exists()) {
      return [];
    }
    return lineupSnap.data().playerIds || [];
  } catch (error)
 {
    console.error(`Error fetching lineup for match ${matchId}, team ${teamId}:`, error);
    return [];
  }
}

const lineupSchema = z.object({
  playerIds: z.array(z.string()),
});

export async function saveMatchLineupAction(matchId: string, teamId: string, playerIds: string[]) {
  const validatedFields = lineupSchema.safeParse({ playerIds });
  if (!validatedFields.success) {
    throw new Error('Invalid lineup data.');
  }

  try {
    const lineupDocRef = doc(db, 'matches', matchId, 'lineups', teamId);
    await setDoc(lineupDocRef, { playerIds });
  } catch (error) {
    console.error("Error saving lineup: ", error);
    throw new Error("Could not save lineup.");
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
