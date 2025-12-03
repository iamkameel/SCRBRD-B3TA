

'use server';

import { getSchools } from '@/lib/actions/schools';
import SchoolsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';

export default async function SchoolsPage() {
  const [schools, userId] = await Promise.all([
    getSchools(),
    getUserId(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const canManage = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  return <SchoolsClient schools={schools} canManage={canManage} />;
}
