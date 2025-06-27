
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Competition } from '@/lib/data';
import { getSeason } from './seasons';
import { getDivision } from './divisions';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getCompetitions(): Promise<Competition[]> {
  if (!userId) return [];
  try {
    const competitionsCollection = collection(db, 'competitions');
    const q = query(competitionsCollection, where("userId", "==", userId));
    const competitionSnapshot = await getDocs(q);
    const competitionsList = competitionSnapshot.docs.map(doc => ({
      competitionId: doc.id,
      ...doc.data(),
    } as Competition));
    return competitionsList;
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return [];
  }
}

export async function getCompetition(competitionId: string): Promise<Competition | null> {
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
}

const competitionSchema = z.object({
  name: z.string().min(1, { message: "Competition name is required." }),
  type: z.enum(['League', 'Knockout', 'Series']),
  seasonId: z.string({ required_error: "Please select a season." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  status: z.enum(['Draft', 'In Progress', 'Completed']).default('Draft'),
  winnerTeamId: z.string().optional(),
});

type CompetitionFormValues = z.infer<typeof competitionSchema>;

export async function addCompetitionAction(data: CompetitionFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = competitionSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid competition data.');
  }

  const { name, type, seasonId, divisionId, status, winnerTeamId } = validatedFields.data;

  const [season, division] = await Promise.all([
      getSeason(seasonId),
      getDivision(divisionId)
  ]);

  if (!season || !division) {
      throw new Error("Invalid season or division selected.");
  }
  
  const newCompetitionData: { [key: string]: any } = {
    name, type, seasonId, seasonName: season.name, divisionId, divisionName: division.name, status, userId,
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
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateCompetitionSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid competition data.');
    }

    const { competitionId, name, type, seasonId, divisionId, status, winnerTeamId } = validatedFields.data;
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
        name, type, seasonId, seasonName: season.name, divisionId, divisionName: division.name, status
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
  if (!userId) throw new Error("User not authenticated");
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
