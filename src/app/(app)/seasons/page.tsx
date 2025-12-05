
'use server';

import { getSeasons } from '@/lib/actions/seasons';
import SeasonsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';

export default async function SeasonsPage() {
  const seasonsData = await getSeasons();
  
  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  // Serialize date objects to be safe to pass to a client component
  const seasons = seasonsData.map(season => ({
    ...season,
    startDate: season.startDate.toISOString(),
    endDate: season.endDate.toISOString(),
  }));

  return <SeasonsClient seasons={seasons as any} isAdmin={isAdmin} />;
}
