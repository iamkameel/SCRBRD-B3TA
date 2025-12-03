'use server';

import { getSeasons } from '@/lib/actions/seasons';
import SeasonsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';

export default async function SeasonsPage() {
  const seasons = await getSeasons();
  
  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  return <SeasonsClient seasons={seasons} isAdmin={isAdmin} />;
}
