

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
  const canManage = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect', 'Team Manager'].includes(r)) ?? false;

  // These functions are now role-aware and will fetch the appropriate data.
  const [teams, schools, allCoaches] = await Promise.all([
    getTeams(),
    getSchools(),
    getPeopleByRole('Coach'),
  ]);

  // Coaches list still needs to be filtered based on the schools the current user can see.
  let coaches: Person[];
  if (user?.activeRole === 'Sportsmaster' && user.assignedSchools && user.assignedSchools.length > 0) {
    const visibleSchoolIds = new Set(user.assignedSchools);
    coaches = allCoaches.filter(c => c.assignedSchools?.some(sId => visibleSchoolIds.has(sId)));
  } else if (canManage) { // Admins and System Architects see all coaches
    coaches = allCoaches;
  } else {
    coaches = [];
  }
  
  return <TeamsClient teams={teams} schools={schools} divisions={divisions} seasons={seasons} canManage={canManage} coaches={coaches} />;
}
