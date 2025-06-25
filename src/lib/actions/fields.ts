'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initialFields, type Field } from '@/lib/data';

// This is a placeholder for a database call to get all fields.
export async function getFields() {
  // In a real app, you'd fetch this from your database.
  return Promise.resolve(initialFields);
}

const fieldSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  surfaceType: z.string().optional(),
  facilities: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

// This is a placeholder for a database insert.
export async function addFieldAction(data: FieldFormValues) {
  const validatedFields = fieldSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid field data.');
  }

  const { name, surfaceType, facilities } = validatedFields.data;

  const newField: Field = {
    name,
    surfaceType,
    facilities,
    fieldId: `field_${new Date().getTime()}`, // Temporary unique ID
  };

  // In a real app, you'd insert this into your database.
  initialFields.push(newField);

  // Revalidate the path to show the new field in the list.
  revalidatePath('/fields');

  return { success: true, field: newField };
}
