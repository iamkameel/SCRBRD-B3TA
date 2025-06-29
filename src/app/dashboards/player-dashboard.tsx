
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Users, BarChart2, ClipboardList, Target, Medal } from 'lucide-react';
import type { Team, Match, PlayerStats } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getPlayerDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';

interface PlayerDashboardProps {
  data: {
    team: Team | null;
    nextMatch: Match | null;
    playerStats: PlayerStats;
  }
}

function StatItem({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="flex flex-col items-center">
            <p className="font-bold text-2xl text-primary">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    )
}

function PlayerDashboardInternal({ data }: PlayerDashboardProps) {
  const { person } = useAuth();
  const { team, nextMatch, playerStats } = data;

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Player Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {person?.firstName || 'Player'}!</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>No Team Assignment Found</CardTitle>
            <CardDescription>You are not currently assigned to a team as a player. Please contact your coach or administrator.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Player Dashboard</h1>
        <p className="text-muted-foreground">Your hub for personal stats and upcoming fixtures.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Next Match */}
          <Card>
            <CardHeader>
              <CardTitle>Next Match</CardTitle>
              {nextMatch ? (
                <CardDescription>Your upcoming fixture with {team.name}.</CardDescription>
              ) : (
                <CardDescription>No upcoming matches scheduled for your team.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {nextMatch ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">vs {nextMatch.teamAId === team.teamId ? nextMatch.teamBName : nextMatch.teamAName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {format(nextMatch.dateTime, 'PPP, p')} at {nextMatch.fieldName}
                    </p>
                  </div>
                  <Button asChild><Link href={`/matches/${nextMatch.matchId}`}>View Match Details</Link></Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No upcoming matches.</p>
              )}
            </CardContent>
          </Card>
          {/* Quick Actions */}
          <Card>
                <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button asChild variant="outline" className="flex-1"><Link href={`/people/${person?.personId}`}><BarChart2 className="mr-2"/>My Full Stats</Link></Button>
                    <Button asChild variant="outline" className="flex-1"><Link href={`/teams/${team.teamId}`}><Users className="mr-2"/>My Team Hub</Link></Button>
                    <Button asChild variant="outline" className="flex-1"><Link href="/matches"><ClipboardList className="mr-2"/>All Fixtures</Link></Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            {/* My Stats */}
            <Card>
                <CardHeader><CardTitle>My Season Stats</CardTitle></CardHeader>
                <CardContent>
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-4"><Target className="text-primary"/>Batting</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <StatItem label="Runs" value={playerStats.totalRuns} />
                        <StatItem label="Average" value={playerStats.battingAverage.toFixed(2)} />
                        <StatItem label="Strike Rate" value={playerStats.strikeRate.toFixed(2)} />
                    </div>
                     <h4 className="font-semibold text-sm flex items-center gap-2 mt-6 mb-4"><Medal className="text-primary"/>Bowling</h4>
                     <div className="grid grid-cols-3 gap-4 text-center">
                        <StatItem label="Wickets" value={playerStats.wicketsTaken} />
                        <StatItem label="Average" value={playerStats.bowlingAverage.toFixed(2)} />
                        <StatItem label="Economy" value={playerStats.economyRate.toFixed(2)} />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function PlayerDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<PlayerDashboardProps['data'] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person?.personId) {
      getPlayerDashboardData(person.personId).then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      });
    }
  }, [person]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return <PlayerDashboardInternal data={data} />;
}
