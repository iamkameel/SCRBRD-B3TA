
import { notFound } from 'next/navigation';
import { getCompetition, getCompetitionStandings, getCompetitionLeaderboards, getMatchesByCompetition } from '@/lib/actions/competitions';
import CompetitionDetailsClient from './client';
import { getSeasons } from '@/lib/actions/seasons';

export default async function CompetitionDetailsPage({ params }: { params: { competitionId: string } }) {
  const competition = await getCompetition(params.competitionId);

  if (!competition) {
    notFound();
  }

  const [standings, matches, leaderboards, seasons] = await Promise.all([
    getCompetitionStandings(params.competitionId),
    getMatchesByCompetition(params.competitionId),
    getCompetitionLeaderboards(params.competitionId),
    getSeasons(),
  ]);

  return (
    <CompetitionDetailsClient
      competition={competition}
      standings={standings}
      matches={matches}
      leaderboards={leaderboards}
      seasons={seasons}
    />
  );
}
