

import { getTeams } from '@/lib/actions/teams';
import { getCompetitions } from '@/lib/actions/competitions';
import { getFields } from '@/lib/actions/fields';
import { getSeasons } from '@/lib/actions/seasons';
import { getDivisions } from '@/lib/actions/divisions';
import NewMatchClient from './client';

export default async function NewMatchPage() {
  const [teams, competitions, fields, seasons, divisions] = await Promise.all([
    getTeams(),
    getCompetitions(),
    getFields(),
    getSeasons(),
    getDivisions(),
  ]);
  
  return <NewMatchClient teams={teams} competitions={competitions} fields={fields} seasons={seasons} divisions={divisions} />;
}
