

'use server';

import { getSponsors } from '@/lib/actions/sponsors';
import SponsorsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  return <SponsorsClient sponsors={sponsors} isAdmin={isAdmin} />;
}
