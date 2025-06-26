
import { getTeam, getTeamRoster, getTeamStats, getTeamMatches } from '@/lib/actions/teams';
import { getPlayers } from '@/lib/actions/players';
import TeamDetailsClient from './client';
import { notFound } from 'next/navigation';

export default async function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const [team, roster, allPeople, teamStats, teamMatches] = await Promise.all([
    getTeam(params.teamId),
    getTeamRoster(params.teamId),
    getPlayers(), // for the 'Add to Roster' dialog
    getTeamStats(params.teamId),
    getTeamMatches(params.teamId),
  ]);

  if (!team) {
    notFound();
  }

  // Filter out people who are already on the roster to prevent duplicates.
  const rosterPersonIds = new Set(roster.map(member => member.personId));
  const availablePeople = allPeople.filter(person => !rosterPersonIds.has(person.personId));

  return <TeamDetailsClient 
    team={team} 
    initialRoster={roster} 
    people={availablePeople} 
    teamStats={teamStats}
    teamMatches={teamMatches} 
  />;
}
