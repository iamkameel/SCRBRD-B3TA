
import { notFound } from 'next/navigation';
import { getField, getFields } from '@/lib/actions/fields';
import { getMatchesByField } from '@/lib/actions/matches';
import FieldDetailsClient from './client';
import { getSchools } from '@/lib/actions/schools';
import { getPeopleByRole } from '@/lib/actions/players';

export default async function FieldDetailsPage({ params }: { params: { fieldId: string } }) {
  const [field, matches, schools, groundskeepers] = await Promise.all([
    getField(params.fieldId),
    getMatchesByField(params.fieldId),
    getSchools(),
    getPeopleByRole('Grounds-Keeper'),
  ]);

  if (!field) {
    notFound();
  }

  return <FieldDetailsClient field={field} matches={matches} schools={schools} groundskeepers={groundkeepers} />;
}
