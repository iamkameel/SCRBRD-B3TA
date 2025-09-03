
'use client';

import { notFound } from 'next/navigation';
import { getField } from '@/lib/actions/fields';
import { getMatchesByField } from '@/lib/actions/matches';
import { getSchools } from '@/lib/actions/schools';
import { getPeopleByRole } from '@/lib/actions/players';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Field, Match, School, Person } from '@/lib/data';

const FieldDetailsClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => <Skeleton className="h-screen w-full" />,
});

export default function FieldDetailsPage({ params }: { params: { fieldId: string } }) {
  const [data, setData] = useState<{
    field: Field;
    matches: Match[];
    schools: School[];
    groundkeepers: Person[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [field, matches, schools, groundkeepers] = await Promise.all([
          getField(params.fieldId),
          getMatchesByField(params.fieldId),
          getSchools(),
          getPeopleByRole('Grounds-Keeper'),
        ]);

        if (!field) {
          notFound();
          return;
        }

        setData({ field, matches, schools, groundkeepers });
      } catch (error) {
        console.error("Failed to fetch field data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.fieldId]);
  

  if (loading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!data) {
    return <div>Field not found.</div>;
  }

  return <FieldDetailsClient field={data.field} matches={data.matches} schools={data.schools} groundkeepers={data.groundkeepers} />;
}
