
import { getTeams } from '@/lib/actions/teams';
import AnalysisClient from './client';

export default async function AnalysisPage() {
  const teams = await getTeams();
  return <AnalysisClient teams={teams} />;
}
