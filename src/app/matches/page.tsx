

'use server';

import { getMatches } from '@/lib/actions/matches';
import MatchesClient from './client';
import { getTeams } from '@/lib/actions/teams';
import { getFields } from '@/lib/actions/fields';
import { getCompetitions } from '@/lib/actions/competitions';
import { getPerson, getPeopleByRole } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';
import type { Person } from '@/lib/data';

export default async function MatchesPage() {
  const [matches, teams, fields, competitions, userId] = await Promise.all([
    getMatches(),
    getTeams(),
    getFields(),
    getCompetitions(),
    getUserId(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;
  const canAssignScorer = user?.roles.some(r => ['Admin', 'Sportsmaster', 'Coach', 'Umpire', 'Scorer', 'System Architect'].includes(r)) ?? false;

  const allScorers = await getPeopleByRole('Scorer');
  
  return <MatchesClient matches={matches} teams={teams} fields={fields} competitions={competitions} isAdmin={isAdmin} scorers={allScorers} canAssignScorer={canAssignScorer} />;
}
