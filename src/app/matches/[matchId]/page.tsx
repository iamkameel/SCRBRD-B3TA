
import { getMatch, getMatchOfficials } from '@/lib/actions/matches';
import { getPlayers } from '@/lib/actions/players';
import MatchDetailsClient from './client';
import { notFound } from 'next/navigation';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const [match, officials, people] = await Promise.all([
    getMatch(params.matchId),
    getMatchOfficials(params.matchId),
    getPlayers(), // To populate the assignment dialog
  ]);

  if (!match) {
    notFound();
  }

  return <MatchDetailsClient match={match} initialOfficials={officials} people={people} />;
}
