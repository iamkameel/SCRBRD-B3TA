

import { getSchools } from '@/lib/actions/schools';
import SchoolsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function SchoolsPage() {
  const schools = await getSchools();

  const userId = getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  return <SchoolsClient schools={schools} isAdmin={isAdmin} />;
}
