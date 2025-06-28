
import { notFound } from 'next/navigation';
import { getField } from '@/lib/actions/fields';
import { getMatchesByField } from '@/lib/actions/matches';
import FieldDetailsClient from './client';

export default async function FieldDetailsPage({ params }: { params: { fieldId: string } }) {
  const [field, matches] = await Promise.all([
    getField(params.fieldId),
    getMatchesByField(params.fieldId),
  ]);

  if (!field) {
    notFound();
  }

  return <FieldDetailsClient field={field} matches={matches} />;
}
