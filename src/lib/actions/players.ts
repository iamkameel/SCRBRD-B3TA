'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initialPlayers, type Person } from '@/lib/data';

// This is a placeholder for a database call to get all players.
export async function getPlayers() {
  // In a real app, you'd fetch this from your database.
  return Promise.resolve(initialPlayers);
}

type PlayerFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  roles: string[];
}

// This is a placeholder for a database insert.
export async function addPlayerAction(data: PlayerFormValues) {
  const playerSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().optional(),
    roles: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one role.",
    }),
  });

  const validatedFields = playerSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid person data.');
  }

  const newPerson: Person = {
    ...validatedFields.data,
    personId: `person_${new Date().getTime()}`, // Temporary unique ID
  };

  // In a real app, you'd insert this into your database.
  initialPlayers.push(newPerson);

  // Revalidate the path to show the new person in the list.
  revalidatePath('/players');

  return { success: true, person: newPerson };
}
