

import { getCompetitions } from '@/lib/actions/competitions';
import { getSeasons } from '@/lib/actions/seasons';
import { getDivisions } from '@/lib/actions/divisions';
import { getTeams } from '@/lib/actions/teams';
import CompetitionsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';
import { getSponsors } from '@/lib/actions/sponsors';

export default async function CompetitionsPage() {
  const [competitions, seasons, divisions, teams, userId, sponsors] = await Promise.all([
    getCompetitions(),
    getSeasons(),
    getDivisions(),
    getTeams(),
    getUserId(),
    getSponsors(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;
  
  return <CompetitionsClient competitions={competitions} seasons={seasons} divisions={divisions} teams={teams} sponsors={sponsors} isAdmin={isAdmin} />;
}

    