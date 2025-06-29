'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp, query, where } from 'firebase/firestore';
import type { Season } from '@/lib/data';
import { cache } from 'react';
import { getUserId } from '@/lib/auth';

export const getSeasons = cache(async (): Promise<Season[]> => {
  const userId = getUserId();
  if (!userId) return [];
  try {
    const seasonsCollection = collection(db, 'seasons');
    const q = query(seasonsCollection, where("userId", "==", userId));
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
});

export const getSeason = cache(async (seasonId: string): Promise<Season | null> => {
  const userId = getUserId();
  if (!userId) return null;
  try {
    const seasonDocRef = doc(db, 'seasons', seasonId);
    const seasonSnap = await getDoc(seasonDocRef);
    if (!seasonSnap.exists() || seasonSnap.data().userId !== userId) {
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
    console.error(`Error fetching season with ID ${seasonId}:`, error);
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
  const userId = getUserId();
  if (!userId) throw new Error("User not authenticated");
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
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    const validatedFields = updateSeasonSchema.safeParse(data);
    if (!validatedFields.success) throw new Error('Invalid season data.');
    
    const { seasonId, name, startDate, endDate, active } = validatedFields.data;
    const seasonDocRef = doc(db, 'seasons', seasonId);
    const seasonSnap = await getDoc(seasonDocRef);
    if (!seasonSnap.exists() || seasonSnap.data().userId !== userId) throw new Error("Season not found or you do not have permission to edit it.");

    try {
        await updateDoc(seasonDocRef, { name, startDate: Timestamp.fromDate(startDate), endDate: Timestamp.fromDate(endDate), active });
    } catch (error) {
        console.error("Error updating season:", error);
        throw new Error("Could not update season.");
    }
    revalidatePath('/seasons'); revalidatePath('/teams'); revalidatePath('/new-match');
}

export async function deleteSeasonAction(seasonId: string) {
  const userId = getUserId();
  if (!userId) throw new Error("User not authenticated");
  if (!seasonId) throw new Error("Season ID is required.");
  
  const seasonDocRef = doc(db, 'seasons', seasonId);
  const seasonSnap = await getDoc(seasonDocRef);
  if (!seasonSnap.exists() || seasonSnap.data().userId !== userId) throw new Error("Season not found or you do not have permission to delete it.");
  
  try {
    await deleteDoc(seasonDocRef);
  } catch (error) {
    console.error("Error deleting season:", error);
    throw new Error("Could not delete season.");
  }
  revalidatePath('/seasons'); revalidatePath('/teams'); revalidatePath('/new-match');
}
