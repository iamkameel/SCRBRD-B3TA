'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';
import type { Season } from '@/lib/data';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

// This function now fetches data from Firestore for the current user
export async function getSeasons(): Promise<Season[]> {
  if (!userId) return [];
  try {
    const seasonsCollection = collection(db, 'seasons');
    const q = query(seasonsCollection, where("userId", "==", userId));
    const seasonSnapshot = await getDocs(q);
    const seasonsList = seasonSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        seasonId: doc.id,
        name: data.name,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        active: data.active,
      };
    });
    // Sort seasons by start date descending
    return seasonsList.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return [];
  }
}

const seasonSchema = z.object({
  name: z.string().min(1, { message: "Season name is required." }),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  active: z.boolean().default(false),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

type SeasonFormValues = z.infer<typeof seasonSchema>;

// This function now adds a document to Firestore for the current user
export async function addSeasonAction(data: SeasonFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = seasonSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid season data.');
  }

  const { name, startDate, endDate, active } = validatedFields.data;

  try {
    await addDoc(collection(db, 'seasons'), {
      name,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      active,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add season.");
  }
  
  revalidatePath('/seasons');
  revalidatePath('/teams');
  revalidatePath('/new-match');

  return { success: true };
}
