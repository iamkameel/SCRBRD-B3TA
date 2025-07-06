
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MatchDetailsClient from './client';
import { getMatch, getMatchOfficials, getMatchLineup, getScorecard } from '@/lib/actions/matches';
import { getPlayers, getPerson, getPeopleByRole } from '@/lib/actions/players';
import { getTeamRoster, getTeams, isTeamManagerOrAdmin } from '@/lib/actions/teams';
import { getVehicles, getMatchTransportAssignments } from '@/lib/actions/transport';
import { Button } from '@/components/ui/button';
import type { RosterMember, PlayerStats, RosterMemberWithStats } from '@/lib/data';
import { getPlayerStats } from '@/lib/actions/stats';
import { getUserId } from '@/lib/auth';

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  
  const [match, userId] = await Promise.all([
    getMatch(matchId),
    getUserId(),
  ]);
  
  if (!match) {
    notFound();
  }
  
  const getRosterWithStats = async (roster: RosterMember[]): Promise<RosterMemberWithStats[]> => {
    return Promise.all(roster.map(async (member) => {
        const [stats, personDetails] = await Promise.all([
            getPlayerStats(member.personId),
            getPerson(member.personId)
        ]);
        return { 
            ...member, 
            stats, 
            profileImageUrl: personDetails?.profileImageUrl 
        };
    }));
  };

  const [
    officials,
    people,
    teamARoster,
    teamBRoster,
    teamALineup,
    teamBLineup,
    scorecard,
    transportAssignments,
    vehicles,
    drivers,
    isManagerForA,
    isManagerForB
  ] = await Promise.all([
    getMatchOfficials(matchId),
    getPlayers(),
    getTeamRoster(match.teamAId),
    match.teamBId ? getTeamRoster(match.teamBId) : Promise.resolve([]),
    getMatchLineup(match.matchId, match.teamAId),
    match.teamBId ? getMatchLineup(match.matchId, match.teamBId) : Promise.resolve([]),
    getScorecard(matchId),
    getMatchTransportAssignments(matchId),
    getVehicles(),
    getPeopleByRole('Driver'),
    isTeamManagerOrAdmin(match.teamAId, userId),
    match.teamBId ? isTeamManagerOrAdmin(match.teamBId, userId) : Promise.resolve(false)
  ]);
  
  const [teamARosterWithStats, teamBRosterWithStats] = await Promise.all([
    getRosterWithStats(teamARoster),
    getRosterWithStats(teamBRoster)
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const canManage = isManagerForA || isManagerForB;
  const isOfficialForMatch = officials.some(o => o.personId === userId);

  return <MatchDetailsClient 
    match={match} 
    initialOfficials={officials} 
    people={people} 
    teamARosterWithStats={teamARosterWithStats}
    teamBRosterWithStats={teamBRosterWithStats}
    teamALineup={teamALineup}
    teamBLineup={teamBLineup}
    scorecard={scorecard}
    transportAssignments={transportAssignments}
    vehicles={vehicles}
    drivers={drivers}
    canManage={canManage}
    isManagerForA={isManagerForA}
    isManagerForB={isManagerForB}
    isOfficialForMatch={isOfficialForMatch}
  />;
}
