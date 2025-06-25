
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Match } from '@/lib/data';

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
