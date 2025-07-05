'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Person, Team, type PlayerStats, type TeamStats } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getPlayerStats } from '@/lib/actions/stats';
import { getTeamStats } from '@/lib/actions/teams';
import { Loader2, Swords, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { StatsQueryCard } from './stats-query-card';

// --- Schemas ---
const playerComparisonSchema = z.object({
  playerAId: z.string().optional(),
  playerBId: z.string().optional(),
}).refine(data => {
  if (data.playerAId && data.playerBId) {
    return data.playerAId !== data.playerBId;
  }
  return true;
}, {
  message: "Players must be different.",
  path: ["playerBId"],
});
type PlayerComparisonFormValues = z.infer<typeof playerComparisonSchema>;
interface PlayerWithStats extends Person {
    stats: PlayerStats;
}

const teamComparisonSchema = z.object({
  teamAId: z.string().optional(),
  teamBId: z.string().optional(),
}).refine(data => {
  if (data.teamAId && data.teamBId) {
    return data.teamAId !== data.teamBId;
  }
  return true;
}, {
  message: "Teams must be different.",
  path: ["teamBId"],
});
type TeamComparisonFormValues = z.infer<typeof teamComparisonSchema>;
interface TeamWithStats extends Team {
    stats: TeamStats;
}

// --- Comparison Components ---

function ComparisonStatRow({ label, valueA, valueB, higherIsBetter = true, isString = false }: { label: string; valueA: string | number; valueB: string | number; higherIsBetter?: boolean; isString?: boolean }) {
    let isABetter = false;
    let isBBetter = false;

    if (!isString) {
        const numA = Number(valueA);
        const numB = Number(valueB);
        if (higherIsBetter) {
            isABetter = numA > numB;
            isBBetter = numB > numA;
        } else {
            // Lower is better for stats like bowling average/economy, but 0 is not better than a positive number
            isABetter = numA > 0 && (numB === 0 || numA < numB);
            isBBetter = numB > 0 && (numA === 0 || numB < numA);
        }
    }

    return (
        <TableRow>
            <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
            <TableCell className={cn("text-center text-lg font-semibold", isABetter && "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md")}>{valueA}</TableCell>
            <TableCell className={cn("text-center text-lg font-semibold", isBBetter && "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md")}>{valueB}</TableCell>
        </TableRow>
    );
}

function PlayerComparisonResult({ playerA, playerB }: { playerA: PlayerWithStats; playerB: PlayerWithStats }) {
    return (
        <div className="space-y-8 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Batting Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-center">{playerA.firstName} {playerA.lastName}</TableHead>
                                <TableHead className="text-center">{playerB.firstName} {playerB.lastName}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <ComparisonStatRow label="Matches" valueA={playerA.stats.matchesPlayed} valueB={playerB.stats.matchesPlayed} />
                            <ComparisonStatRow label="Innings Batted" valueA={playerA.stats.inningsBatted} valueB={playerB.stats.inningsBatted} />
                            <ComparisonStatRow label="Runs Scored" valueA={playerA.stats.totalRuns} valueB={playerB.stats.totalRuns} />
                            <ComparisonStatRow label="Batting Average" valueA={playerA.stats.battingAverage.toFixed(2)} valueB={playerB.stats.battingAverage.toFixed(2)} />
                            <ComparisonStatRow label="Strike Rate" valueA={playerA.stats.strikeRate.toFixed(2)} valueB={playerB.stats.strikeRate.toFixed(2)} />
                            <ComparisonStatRow label="Highest Score" valueA={`${playerA.stats.highestScore}${playerA.stats.highestScoreNotOut ? '*' : ''}`} valueB={`${playerB.stats.highestScore}${playerB.stats.highestScoreNotOut ? '*' : ''}`} isString />
                            <ComparisonStatRow label="100s" valueA={playerA.stats.hundreds} valueB={playerB.stats.hundreds} />
                            <ComparisonStatRow label="50s" valueA={playerA.stats.fifties} valueB={playerB.stats.fifties} />
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Bowling Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-center">{playerA.firstName} {playerA.lastName}</TableHead>
                                <TableHead className="text-center">{playerB.firstName} {playerB.lastName}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <ComparisonStatRow label="Overs Bowled" valueA={playerA.stats.oversBowled} valueB={playerB.stats.oversBowled} />
                            <ComparisonStatRow label="Wickets Taken" valueA={playerA.stats.wicketsTaken} valueB={playerB.stats.wicketsTaken} />
                            <ComparisonStatRow label="Bowling Average" valueA={playerA.stats.bowlingAverage.toFixed(2)} valueB={playerB.stats.bowlingAverage.toFixed(2)} higherIsBetter={false} />
                            <ComparisonStatRow label="Economy Rate" valueA={playerA.stats.economyRate.toFixed(2)} valueB={playerB.stats.economyRate.toFixed(2)} higherIsBetter={false} />
                            <ComparisonStatRow label="Best Bowling" valueA={playerA.stats.bestBowling} valueB={playerB.stats.bestBowling} isString />
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function TeamComparisonResult({ teamA, teamB }: { teamA: TeamWithStats, teamB: TeamWithStats }) {
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Head-to-Head Stats</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead className="text-center">{teamA.name}</TableHead>
                            <TableHead className="text-center">{teamB.name}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <ComparisonStatRow label="Matches Played" valueA={teamA.stats.matchesPlayed} valueB={teamB.stats.matchesPlayed} />
                        <ComparisonStatRow label="Matches Won" valueA={teamA.stats.matchesWon} valueB={teamB.stats.matchesWon} />
                        <ComparisonStatRow label="Matches Lost" valueA={teamA.stats.matchesLost} valueB={teamB.stats.matchesLost} higherIsBetter={false} />
                        <ComparisonStatRow label="Total Runs Scored" valueA={teamA.stats.totalRunsScored} valueB={teamB.stats.totalRunsScored} />
                        <ComparisonStatRow label="Total Wickets Taken" valueA={teamA.stats.totalWicketsTaken} valueB={teamB.stats.totalWicketsTaken} />
                        <ComparisonStatRow label="Net Run Rate (NRR)" valueA={teamA.stats.netRunRate.toFixed(2)} valueB={teamB.stats.netRunRate.toFixed(2)} />
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AnalysisClient({ players, teams }: { players: Person[], teams: Team[] }) {
    const { toast } = useToast();
    
    // Player comparison state
    const [isPlayerPending, startPlayerTransition] = React.useTransition();
    const [playerComparison, setPlayerComparison] = React.useState<{ playerA: PlayerWithStats, playerB: PlayerWithStats } | null>(null);

    // Team comparison state
    const [isTeamPending, startTeamTransition] = React.useTransition();
    const [teamComparison, setTeamComparison] = React.useState<{ teamA: TeamWithStats, teamB: TeamWithStats } | null>(null);

    const playerForm = useForm<PlayerComparisonFormValues>({
        resolver: zodResolver(playerComparisonSchema),
        defaultValues: { playerAId: undefined, playerBId: undefined }
    });
    const playerAId = playerForm.watch('playerAId');
    const playerBId = playerForm.watch('playerBId');
    
    const teamForm = useForm<TeamComparisonFormValues>({
        resolver: zodResolver(teamComparisonSchema),
        defaultValues: { teamAId: undefined, teamBId: undefined }
    });
    const teamAId = teamForm.watch('teamAId');
    const teamBId = teamForm.watch('teamBId');

    // Effect for player comparison
    React.useEffect(() => {
        const performComparison = () => {
            if (playerAId && playerBId && playerAId !== playerBId) {
                startPlayerTransition(async () => {
                    setPlayerComparison(null);
                    try {
                        const [playerAStats, playerBStats] = await Promise.all([
                            getPlayerStats(playerAId),
                            getPlayerStats(playerBId),
                        ]);
                        const playerA = players.find(p => p.personId === playerAId)!;
                        const playerB = players.find(p => p.personId === playerBId)!;
                        setPlayerComparison({
                            playerA: { ...playerA, stats: playerAStats },
                            playerB: { ...playerB, stats: playerBStats },
                        });
                    } catch (error) {
                        toast({ title: "Error", description: "Could not fetch player statistics.", variant: "destructive" });
                    }
                });
            } else {
                 setPlayerComparison(null);
            }
        };
        performComparison();
    }, [playerAId, playerBId, players, toast]);

    // Effect for team comparison
     React.useEffect(() => {
        const performComparison = () => {
            if (teamAId && teamBId && teamAId !== teamBId) {
                startTeamTransition(async () => {
                    setTeamComparison(null);
                    try {
                        const [teamAStats, teamBStats] = await Promise.all([
                            getTeamStats(teamAId),
                            getTeamStats(teamBId),
                        ]);
                        const teamA = teams.find(t => t.teamId === teamAId)!;
                        const teamB = teams.find(t => t.teamId === teamBId)!;
                        setTeamComparison({
                            teamA: { ...teamA, stats: teamAStats },
                            teamB: { ...teamB, stats: teamBStats },
                        });
                    } catch (error) {
                        toast({ title: "Error", description: "Could not fetch team statistics.", variant: "destructive" });
                    }
                });
            } else {
                setTeamComparison(null);
            }
        };
        performComparison();
    }, [teamAId, teamBId, teams, toast]);


    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Analysis Hub</h1>
                <p className="text-muted-foreground">Ask the AI a question or compare stats head-to-head.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatsQueryCard />
            </div>

            <Tabs defaultValue="player-vs-player" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="player-vs-player"><Swords className="mr-2 h-4 w-4" />Player vs. Player</TabsTrigger>
                    <TabsTrigger value="team-vs-team"><Shield className="mr-2 h-4 w-4" />Team vs. Team</TabsTrigger>
                </TabsList>

                {/* Player vs Player Tab */}
                <TabsContent value="player-vs-player" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Players</CardTitle>
                            <CardDescription>Choose two players to see a side-by-side statistical comparison of their career stats.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...playerForm}>
                                <form className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={playerForm.control}
                                        name="playerAId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Player 1</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isPlayerPending}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {players.map((p) => (
                                                            <SelectItem key={p.personId} value={p.personId} disabled={p.personId === playerBId}>
                                                                {p.firstName} {p.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={playerForm.control}
                                        name="playerBId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Player 2</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isPlayerPending}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {players.map((p) => (
                                                            <SelectItem key={p.personId} value={p.personId} disabled={p.personId === playerAId}>
                                                                {p.firstName} {p.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    
                    {isPlayerPending && (
                        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg mt-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-4 font-semibold">Fetching Player Stats...</p>
                        </div>
                    )}

                    {!isPlayerPending && playerComparison && (
                        <PlayerComparisonResult playerA={playerComparison.playerA} playerB={playerComparison.playerB} />
                    )}

                    {!isPlayerPending && !playerComparison && (
                        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg mt-8">
                            <Swords className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-4 font-semibold">Select two players to compare</p>
                            <p className="text-sm text-muted-foreground">A detailed statistical breakdown will appear here.</p>
                        </div>
                    )}
                </TabsContent>
                
                {/* Team vs Team Tab */}
                <TabsContent value="team-vs-team" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Select Teams</CardTitle>
                            <CardDescription>Choose two teams to see a side-by-side comparison of their season stats.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...teamForm}>
                                <form className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={teamForm.control}
                                        name="teamAId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Team 1</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isTeamPending}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {teams.map((t) => (
                                                            <SelectItem key={t.teamId} value={t.teamId} disabled={t.teamId === teamBId}>
                                                                {t.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={teamForm.control}
                                        name="teamBId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Team 2</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isTeamPending}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {teams.map((t) => (
                                                            <SelectItem key={t.teamId} value={t.teamId} disabled={t.teamId === teamAId}>
                                                                {t.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {isTeamPending && (
                        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg mt-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-4 font-semibold">Fetching Team Stats...</p>
                        </div>
                    )}

                    {!isTeamPending && teamComparison && (
                        <TeamComparisonResult teamA={teamComparison.teamA} teamB={teamComparison.teamB} />
                    )}

                    {!isTeamPending && !teamComparison && (
                         <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg mt-8">
                            <Shield className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-4 font-semibold">Select two teams to compare</p>
                            <p className="text-sm text-muted-foreground">A detailed statistical breakdown will appear here.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
