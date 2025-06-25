'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initialDivisions, type Division } from '@/lib/data';

// This is a placeholder for a database call to get all divisions.
export async function getDivisions() {
  // In a real app, you'd fetch this from your database.
  return Promise.resolve(initialDivisions);
}

const divisionSchema = z.object({
  name: z.string().min(1, { message: "Division name is required." }),
});

type DivisionFormValues = z.infer<typeof divisionSchema>;

// This is a placeholder for a database insert.
export async function addDivisionAction(data: DivisionFormValues) {
  const validatedFields = divisionSchema.safeParse(data);

  if (!validatedFields.success) {
    // This is a simple error handling. A real app might return more detailed errors.
    throw new Error('Invalid division name.');
  }

  const { name } = validatedFields.data;

  const newDivision: Division = {
    name,
    divisionId: `div_${new Date().getTime()}`, // Temporary unique ID
  };

  // In a real app, you'd insert this into your database.
  initialDivisions.push(newDivision);

  // Revalidate the path to show the new division in the list.
  revalidatePath('/divisions');

  return { success: true, division: newDivision };
}
