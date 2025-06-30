import { notFound } from 'next/navigation';
import { getSchool, getSchoolStaff, getSchoolPlayers } from '@/lib/actions/schools';
import { getTeamsBySchool } from '@/lib/actions/teams';
import SchoolDetailsClient from './client';

export default async function SchoolDetailsPage({ params }: { params: { schoolId: string } }) {
  const school = await getSchool(params.schoolId);

  if (!school) {
    notFound();
  }

  const [teams, staff, players] = await Promise.all([
    getTeamsBySchool(params.schoolId),
    getSchoolStaff(params.schoolId),
    getSchoolPlayers(params.schoolId),
  ]);

  return <SchoolDetailsClient school={school} teams={teams} staff={staff} players={players} />;
}
