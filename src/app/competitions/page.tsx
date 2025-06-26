import { getCompetitions } from '@/lib/actions/competitions';
import { getSeasons } from '@/lib/actions/seasons';
import { getDivisions } from '@/lib/actions/divisions';
import CompetitionsClient from './client';

export default async function CompetitionsPage() {
  const [competitions, seasons, divisions] = await Promise.all([
    getCompetitions(),
    getSeasons(),
    getDivisions(),
  ]);
  
  return <CompetitionsClient competitions={competitions} seasons={seasons} divisions={divisions} />;
}
