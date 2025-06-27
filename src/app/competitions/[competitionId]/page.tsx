import { notFound } from 'next/navigation';
import { getCompetition, getCompetitionStandings, getCompetitionLeaderboards } from '@/lib/actions/competitions';
import { getMatchesByCompetition } from '@/lib/actions/matches';
import CompetitionDetailsClient from './client';

export default async function CompetitionDetailsPage({ params }: { params: { competitionId: string } }) {
  const competition = await getCompetition(params.competitionId);

  if (!competition) {
    notFound();
  }

  const [standings, matches, leaderboards] = await Promise.all([
    getCompetitionStandings(params.competitionId),
    getMatchesByCompetition(params.competitionId),
    getCompetitionLeaderboards(params.competitionId),
  ]);

  return (
    <CompetitionDetailsClient
      competition={competition}
      standings={standings}
      matches={matches}
      leaderboards={leaderboards}
    />
  );
}
