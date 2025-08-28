

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
import { getPlayerStats, getPlayerMatchHistory } from '@/lib/actions/stats';
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
            profileImageUrl: personDetails?.profileImageUrl,
            physicalAttributes: personDetails?.physicalAttributes,
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
    user,
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
    userId ? getPerson(userId) : Promise.resolve(null),
    isTeamManagerOrAdmin(match.teamAId, userId),
    match.teamBId ? isTeamManagerOrAdmin(match.teamBId, userId) : Promise.resolve(false)
  ]);
  
  const [teamARosterWithStats, teamBRosterWithStats] = await Promise.all([
    getRosterWithStats(teamARoster),
    getRosterWithStats(teamBRoster)
  ]);
  
  const canManage = isManagerForA || isManagerForB;
  const isAdminOrSportsmaster = user?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;
  const isOfficial = officials.some(o => o.personId === userId && o.confirmed);
  const isOfficialForMatch = isAdminOrSportsmaster || isOfficial;

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

