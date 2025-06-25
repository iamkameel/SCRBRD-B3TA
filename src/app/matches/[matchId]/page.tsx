
import { getMatch } from '@/lib/actions/matches';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const match = await getMatch(params.matchId);

  if (!match) {
    notFound();
  }

  return <MatchDetailsClient match={match} />;
}
