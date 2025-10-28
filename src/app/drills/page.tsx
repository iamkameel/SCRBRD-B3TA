
'use server';

import { getDrills } from '@/lib/actions/drills';
import DrillsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function DrillsPage() {
  const [drills, userId] = await Promise.all([
    getDrills(),
    getUserId()
  ]);
  const user = userId ? await getPerson(userId) : null;
  const canManage = user?.roles.some(r => ['Admin', 'Sportsmaster', 'Coach'].includes(r)) ?? false;

  return <DrillsClient initialDrills={drills} canManage={canManage} />;
}
