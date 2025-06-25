import { getMatches } from '@/lib/actions/matches';
import MatchesClient from './client';

export default async function MatchesPage() {
  const matches = await getMatches();
  return <MatchesClient matches={matches} />;
}
