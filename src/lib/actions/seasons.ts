'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initialSeasons, type Season } from '@/lib/data';

// This is a placeholder for a database call to get all seasons.
export async function getSeasons() {
  // In a real app, you'd fetch this from your database.
  return Promise.resolve(initialSeasons);
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

// This is a placeholder for a database insert.
export async function addSeasonAction(data: SeasonFormValues) {
  const validatedFields = seasonSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid season data.');
  }

  const newSeason: Season = {
    ...validatedFields.data,
    seasonId: `season_${new Date().getTime()}`, // Temporary unique ID
  };

  // In a real app, you'd insert this into your database.
  initialSeasons.push(newSeason);

  // Revalidate the path to show the new season in the list.
  revalidatePath('/seasons');

  return { success: true, season: newSeason };
}
