

import { notFound } from 'next/navigation';
import { getSchool, getSchoolStaff, getSchoolPlayers, getMatchesBySchool } from '@/lib/actions/schools';
import { getTeamsBySchool } from '@/lib/actions/teams';
import SchoolDetailsClient from './client';
import { getPlayers } from '@/lib/actions/players';

export default async function SchoolDetailsPage({ params }: { params: { schoolId: string } }) {
  const school = await getSchool(params.schoolId);

  if (!school) {
    notFound();
  }

  const [teams, staff, players, allPeople, matches] = await Promise.all([
    getTeamsBySchool(params.schoolId),
    getSchoolStaff(params.schoolId),
    getSchoolPlayers(params.schoolId),
    getPlayers(),
    getMatchesBySchool(params.schoolId),
  ]);

  const allStaff = allPeople.filter(p => !p.roles.includes('Player'));

  return <SchoolDetailsClient school={school} teams={teams} staff={staff} players={players} allStaff={allStaff} matches={matches} />;
}
