import { getTeams } from '@/lib/actions/teams';
import { getSeasons } from '@/lib/actions/seasons';
import { getFields } from '@/lib/actions/fields';
import NewMatchClient from './client';

export default async function NewMatchPage() {
  const [teams, seasons, fields] = await Promise.all([
    getTeams(),
    getSeasons(),
    getFields(),
  ]);
  
  return <NewMatchClient teams={teams} seasons={seasons} fields={fields} />;
}
