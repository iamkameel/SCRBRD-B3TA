
import { getSchools } from '@/lib/actions/schools';
import SchoolsClient from './client';

export default async function SchoolsPage() {
  const schools = await getSchools();
  return <SchoolsClient schools={schools} />;
}
