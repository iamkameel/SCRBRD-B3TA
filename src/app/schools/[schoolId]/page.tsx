import { notFound } from 'next/navigation';
import { getSchool, getSchoolStaff } from '@/lib/actions/schools';
import { getTeamsBySchool } from '@/lib/actions/teams';
import SchoolDetailsClient from './client';

export default async function SchoolDetailsPage({ params }: { params: { schoolId: string } }) {
  const school = await getSchool(params.schoolId);

  if (!school) {
    notFound();
  }

  const [teams, staff] = await Promise.all([
    getTeamsBySchool(params.schoolId),
    getSchoolStaff(params.schoolId),
  ]);

  return <SchoolDetailsClient school={school} teams={teams} staff={staff} />;
}
