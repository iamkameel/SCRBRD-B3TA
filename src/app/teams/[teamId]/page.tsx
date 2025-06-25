
import { getTeam, getTeamRoster } from '@/lib/actions/teams';
import { getPlayers } from '@/lib/actions/players';
import TeamDetailsClient from './client';
import { notFound } from 'next/navigation';
import type { Team } from '@/lib/data';
import { mockTeamStats } from '@/lib/data'; // Keep mock stats for now

export default async function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const [team, roster, people] = await Promise.all([
    getTeam(params.teamId),
    getTeamRoster(params.teamId),
    getPlayers(), // for the 'Add to Roster' dialog
  ]);

  if (!team) {
    notFound();
  }

  // TODO: Replace with real stats once stat tracking is implemented
  const teamStats = mockTeamStats;

  return <TeamDetailsClient team={team} initialRoster={roster} people={people} teamStats={teamStats} />;
}
