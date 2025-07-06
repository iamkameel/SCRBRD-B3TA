
import { notFound } from 'next/navigation';
import ManageLineupClient from './client';
import { getMatch, getMatchLineup } from '@/lib/actions/matches';
import { getTeamRoster, isTeamManagerOrAdmin } from '@/lib/actions/teams';
import { getPlayerStats } from '@/lib/actions/stats';
import { getPerson } from '@/lib/actions/players';
import type { RosterMember, PlayerStats, RosterMemberWithStats } from '@/lib/data';
import { getUserId } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';


export default async function ManageLineupPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  
  const [match, userId] = await Promise.all([
    getMatch(matchId),
    getUserId(),
  ]);
  
  if (!match) {
    notFound();
  }
  
  if (match.status === 'completed') {
    return (
        <Card className="w-full max-w-md mx-auto mt-16">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4">Match Completed</CardTitle>
                <CardDescription>
                    Lineups can no longer be edited for a completed match.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }

  const [isManagerForA, isManagerForB] = await Promise.all([
      isTeamManagerOrAdmin(match.teamAId, userId),
      match.teamBId ? isTeamManagerOrAdmin(match.teamBId, userId) : Promise.resolve(false)
  ]);

  if (!isManagerForA && !isManagerForB) {
     return (
        <Card className="w-full max-w-md mx-auto mt-16">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4">Access Denied</CardTitle>
                <CardDescription>
                    You do not have permission to manage the lineup for this match.
                </CardDescription>
            </CardHeader>
        </Card>
    );
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
    teamARoster,
    teamBRoster,
    teamALineup,
    teamBLineup,
  ] = await Promise.all([
    getTeamRoster(match.teamAId),
    match.teamBId ? getTeamRoster(match.teamBId) : Promise.resolve([]),
    getMatchLineup(match.matchId, match.teamAId),
    match.teamBId ? getMatchLineup(match.matchId, match.teamBId) : Promise.resolve([]),
  ]);
  
  const [teamARosterWithStats, teamBRosterWithStats] = await Promise.all([
    getRosterWithStats(teamARoster),
    getRosterWithStats(teamBRoster)
  ]);

  return <ManageLineupClient 
    match={match} 
    teamARosterWithStats={teamARosterWithStats}
    teamBRosterWithStats={teamBRosterWithStats}
    teamALineup={teamALineup}
    teamBLineup={teamBLineup}
    isManagerForA={isManagerForA}
    isManagerForB={isManagerForB}
  />;
}
