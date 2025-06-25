'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initialSchools, type School } from '@/lib/data';

// This is a placeholder for a database call to get all schools.
export async function getSchools() {
  // In a real app, you'd fetch this from your database.
  return Promise.resolve(initialSchools);
}

const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

// This is a placeholder for a database insert.
export async function addSchoolAction(data: SchoolFormValues) {
  const validatedFields = schoolSchema.safeParse(data);

  if (!validatedFields.success) {
    // This is a simple error handling. A real app might return more detailed errors.
    throw new Error('Invalid school name.');
  }

  const { name } = validatedFields.data;

  const newSchool: School = {
    name,
    schoolId: `school_${new Date().getTime()}`, // Temporary unique ID
  };

  // In a real app, you'd insert this into your database.
  initialSchools.push(newSchool);

  // Revalidate the path to show the new school in the list.
  revalidatePath('/schools');

  return { success: true, school: newSchool };
}
