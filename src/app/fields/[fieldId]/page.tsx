

import { notFound } from 'next/navigation';
import { getField } from '@/lib/actions/fields';
import { getMatchesByField } from '@/lib/actions/matches';
import { getSchools } from '@/lib/actions/schools';
import { getPeopleByRole } from '@/lib/actions/players';
import FieldDetailsClient from './client';

export default async function FieldDetailsPage({ params }: { params: { fieldId: string } }) {
  const { fieldId } = params;

  const [field, matches, schools, groundkeepers] = await Promise.all([
    getField(fieldId),
    getMatchesByField(fieldId),
    getSchools(),
    getPeopleByRole('Grounds-Keeper'),
  ]);

  if (!field) {
    notFound();
  }

  return <FieldDetailsClient field={field} matches={matches} schools={schools} groundkeepers={groundkeepers} />;
}
