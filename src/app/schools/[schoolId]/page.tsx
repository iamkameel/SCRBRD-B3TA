import { notFound } from 'next/navigation';
import { getSchool, getSchoolStaff, getSchoolPlayers } from '@/lib/actions/schools';
import { getTeamsBySchool } from '@/lib/actions/teams';
import SchoolDetailsClient from './client';
import { getPeopleByRole } from '@/lib/actions/players';

export default async function SchoolDetailsPage({ params }: { params: { schoolId: string } }) {
  const school = await getSchool(params.schoolId);

  if (!school) {
    notFound();
  }

  const [teams, staff, players, allStaff] = await Promise.all([
    getTeamsBySchool(params.schoolId),
    getSchoolStaff(params.schoolId),
    getSchoolPlayers(params.schoolId),
    getPeopleByRole('Coach'), // Example, you can expand roles here
  ]);

  return <SchoolDetailsClient school={school} teams={teams} staff={staff} players={players} allStaff={allStaff} />;
}
