

'use server';

import { getTeams } from '@/lib/actions/teams';
import { getSchools } from '@/lib/actions/schools';
import { getDivisions } from '@/lib/actions/divisions';
import { getSeasons } from '@/lib/actions/seasons';
import TeamsClient from './client';
import { getPerson, getPeopleByRole } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';
import type { Person } from '@/lib/data';

export default async function TeamsPage() {
  const [userId, divisions, seasons] = await Promise.all([
    getUserId(),
    getDivisions(),
    getSeasons(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const canManage = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  // These functions are now role-aware and will fetch the appropriate data.
  const [teams, schools, allCoaches] = await Promise.all([
    getTeams(),
    getSchools(),
    getPeopleByRole('Coach'),
  ]);

  // Coaches list still needs to be filtered based on the schools the current user can see.
  let coaches: Person[];
  if (user?.activeRole === 'Sportsmaster' || user?.activeRole === 'Coach') {
    const visibleSchoolIds = new Set(schools.map(s => s.schoolId));
    coaches = allCoaches.filter(c => c.assignedSchools?.some(sId => visibleSchoolIds.has(sId)));
  } else {
    // Admins and others see all coaches
    coaches = allCoaches;
  }
  
  return <TeamsClient teams={teams} schools={schools} divisions={divisions} seasons={seasons} canManage={canManage} coaches={coaches} />;
}
