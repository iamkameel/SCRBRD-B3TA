
import { getTeam, getTeamRoster } from '@/lib/actions/teams';
import { getPlayers } from '@/lib/actions/players';
import TeamDetailsClient from './client';
import { notFound } from 'next/navigation';
import type { Team } from '@/lib/data';

export default async function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const [team, roster, people] = await Promise.all([
    getTeam(params.teamId),
    getTeamRoster(params.teamId),
    getPlayers(), // for the 'Add to Roster' dialog
  ]);

  if (!team) {
    notFound();
  }

  // Placeholder for real stats implementation
  const teamStats = {
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    matchesDrawn: 0,
    totalRunsScored: 0,
    totalWicketsTaken: 0,
    netRunRate: 0.0,
  };

  return <TeamDetailsClient team={team} initialRoster={roster} people={people} teamStats={teamStats} />;
}
