

import { getTeam, getTeamRoster, getTeamStats, getTeamMatches } from '@/lib/actions/teams';
import { getPlayers, getPerson } from '@/lib/actions/players';
import TeamDetailsClient from './client';
import { notFound } from 'next/navigation';
import { getUserId } from '@/lib/auth';

export default async function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const [team, roster, allPeople, teamStats, teamMatches, userId] = await Promise.all([
    getTeam(params.teamId),
    getTeamRoster(params.teamId),
    getPlayers(), // for the 'Add to Roster' dialog
    getTeamStats(params.teamId),
    getTeamMatches(params.teamId),
    getUserId(),
  ]);

  if (!team) {
    notFound();
  }
  
  const user = userId ? await getPerson(userId) : null;
  const isAdminOrSportsmaster = user?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;
  const isTeamStaff = roster.some(m => m.personId === userId && ['Coach', 'Team Manager'].includes(m.role));
  const canManage = isAdminOrSportsmaster || isTeamStaff;

  // Filter out people who are already on the roster to prevent duplicates.
  const rosterPersonIds = new Set(roster.map(member => member.personId));
  const availablePeople = allPeople.filter(person => !rosterPersonIds.has(person.personId));

  return <TeamDetailsClient 
    team={team} 
    initialRoster={roster} 
    people={availablePeople} 
    teamStats={teamStats}
    teamMatches={teamMatches} 
    canManage={canManage}
  />;
}
