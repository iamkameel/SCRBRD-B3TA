
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Users, BarChart2, ClipboardList, Target, Medal } from 'lucide-react';
import type { Team, Match, PlayerStats, AvailabilityStatus } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getPlayerDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updatePlayerAvailabilityAction } from '@/lib/actions/matches';
import { StatItem } from '@/components/stat-item';

function PlayerAvailabilityCard({ match }: { match: Match }) {
    const { person } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [note, setNote] = React.useState('');

    if (!person) return null;

    const currentAvailability = match.availability?.[person.personId];

    React.useEffect(() => {
        if (currentAvailability?.note) {
            setNote(currentAvailability.note);
        }
    }, [currentAvailability]);

    const handleStatusChange = (status: AvailabilityStatus) => {
        startTransition(async () => {
            try {
                await updatePlayerAvailabilityAction(match.matchId, status, note);
                toast({ title: "Availability Updated" });
            } catch (error) {
                 toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update availability.", variant: "destructive" });
            }
        });
    };

    const handleNoteBlur = () => {
        // Only update if there's a status already set
        if(currentAvailability?.status) {
            handleStatusChange(currentAvailability.status);
        }
    }
    
    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg">Set Your Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup 
                    defaultValue={currentAvailability?.status} 
                    onValueChange={(value) => handleStatusChange(value as AvailabilityStatus)}
                    className="grid grid-cols-3 gap-4"
                    disabled={isPending}
                >
                    <div><RadioGroupItem value="attending" id="attending" className="peer sr-only" /><Label htmlFor="attending" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Attending</Label></div>
                    <div><RadioGroupItem value="unavailable" id="unavailable" className="peer sr-only" /><Label htmlFor="unavailable" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Unavailable</Label></div>
                    <div><RadioGroupItem value="tentative" id="tentative" className="peer sr-only" /><Label htmlFor="tentative" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Maybe</Label></div>
                </RadioGroup>
                <div className="space-y-2">
                    <Label htmlFor="availability-note">Note (Optional)</Label>
                    <Textarea 
                        id="availability-note" 
                        placeholder="e.g., Will be 15 minutes late" 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={handleNoteBlur}
                        disabled={isPending}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function PlayerDashboardInternal({ data }: { data: PlayerDashboardProps['data'] }) {
  const { person } = useAuth();
  const { team, nextMatch, playerStats } = data;

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">Player Dashboard</h1>
            <p className="text-sm opacity-90">Welcome, {person?.firstName || 'Player'}!</p>
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
      <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Player Dashboard</h1>
        <p className="text-sm opacity-90">Your hub for personal stats and upcoming fixtures for {team.name}.</p>
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
                <div className="space-y-6">
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
                    <PlayerAvailabilityCard match={nextMatch} />
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

interface PlayerDashboardProps {
  data: {
    team: Team | null;
    nextMatch: Match | null;
    playerStats: PlayerStats;
  }
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
