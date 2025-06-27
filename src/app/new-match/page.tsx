
import { getTeams } from '@/lib/actions/teams';
import { getCompetitions } from '@/lib/actions/competitions';
import { getFields } from '@/lib/actions/fields';
import NewMatchClient from './client';

export default async function NewMatchPage() {
  const [teams, competitions, fields] = await Promise.all([
    getTeams(),
    getCompetitions(),
    getFields(),
  ]);
  
  return <NewMatchClient teams={teams} competitions={competitions} fields={fields} />;
}
