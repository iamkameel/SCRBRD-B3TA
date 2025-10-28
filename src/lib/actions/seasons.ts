
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp, query, where } from 'firebase/firestore';
import type { Season } from '@/lib/data';
import { cache } from 'react';
import { getPerson } from './players';
import { getUserId } from '@/lib/firebase-admin';


const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        throw new Error("You do not have permission to manage seasons.");
    }
}

export async function getSeasons(): Promise<Season[]> {
  try {
    const seasonsCollection = collection(db, 'seasons');
    // Seasons are global, so no user-based query needed for reads.
    const q = query(seasonsCollection);
    const seasonSnapshot = await getDocs(q);
    const seasonsList = seasonSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        seasonId: doc.id, name: data.name,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        active: data.active,
      };
    });
    return seasonsList.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return [];
  }
}

export const getSeason = cache(async (seasonId: string): Promise<Season | null> => {
  try {
    const seasonDocRef = doc(db, 'seasons', seasonId);
    const seasonSnap = await getDoc(seasonDocRef);
    if (!seasonSnap.exists()) {
      return null;
    }
    const data = seasonSnap.data();
    return {
      seasonId: seasonSnap.id,
      name: data.name,
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
      active: data.active,
    };
  } catch (error) {
    console.error(\`Error fetching season with ID \${seasonId}:\`, error);
    return null;
  }
});

const baseSeasonSchema = z.object({
  name: z.string().min(1, { message: "Season name is required." }),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  active: z.boolean().default(false),
});

const seasonSchema = baseSeasonSchema.refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});


type SeasonFormValues = z.infer<typeof seasonSchema>;

export async function addSeasonAction(data: SeasonFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = seasonSchema.safeParse(data);
  if (!validatedFields.success) throw new Error('Invalid season data.');
  const { name, startDate, endDate, active } = validatedFields.data;
  try {
    await addDoc(collection(db, 'seasons'), { name, startDate: Timestamp.fromDate(startDate), endDate: Timestamp.fromDate(endDate), active, userId: userId });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add season.");
  }
  revalidatePath('/seasons'); revalidatePath('/teams'); revalidatePath('/new-match');
}

const updateSeasonSchema = baseSeasonSchema.extend({ seasonId: z.string() }).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});


export async function updateSeasonAction(data: z.infer<typeof updateSeasonSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateSeasonSchema.safeParse(data);
    if (!validatedFields.success) throw new Error('Invalid season data.');
    
    const { seasonId, name, startDate, endDate, active } = validatedFields.data;
    const seasonDocRef = doc(db, 'seasons', seasonId);
    const seasonSnap = await getDoc(seasonDocRef);
    if (!seasonSnap.exists()) throw new Error("Season not found or you do not have permission to edit it.");

    try {
        await updateDoc(seasonDocRef, { name, startDate: Timestamp.fromDate(startDate), endDate: Timestamp.fromDate(endDate), active });
    } catch (error) {
        console.error("Error updating season:", error);
        throw new Error("Could not update season.");
    }
    revalidatePath('/seasons'); revalidatePath('/teams'); revalidatePath('/new-match');
}

export async function deleteSeasonAction(seasonId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  if (!seasonId) throw new Error("Season ID is required.");
  
  const seasonDocRef = doc(db, 'seasons', seasonId);
  const seasonSnap = await getDoc(seasonDocRef);
  if (!seasonSnap.exists()) throw new Error("Season not found or you do not have permission to delete it.");
  
  try {
    await deleteDoc(seasonDocRef);
  } catch (error) {
    console.error("Error deleting season:", error);
    throw new Error("Could not delete season.");
  }
  revalidatePath('/seasons'); revalidatePath('/teams'); revalidatePath('/new-match');
}
