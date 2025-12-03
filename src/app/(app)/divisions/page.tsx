'use server';

import { getDivisions } from '@/lib/actions/divisions';
import DivisionsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';

export default async function DivisionsPage() {
  const divisions = await getDivisions();
  
  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  return <DivisionsClient divisions={divisions} isAdmin={isAdmin} />;
}
