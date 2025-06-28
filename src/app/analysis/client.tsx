
'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Person, Team, type PlayerStats, type TeamStats } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPlayerStats } from '@/lib/actions/players';
import { getTeamStats } from '@/lib/actions/teams';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Swords, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Player Comparison ---
const playerComparisonSchema = z.object({
  playerAId: z.string({ required_error: "Please select the first player." }),
  playerBId: z.string({ required_error: "Please select the second player." }),
}).refine(data => data.playerAId !== data.playerBId, {
  message: "Players must be different.",
  path: ["playerBId"],
});
type PlayerComparisonFormValues = z.infer<typeof playerComparisonSchema>;
interface PlayerWithStats extends Person {
    stats: PlayerStats;
}

// --- Team Comparison ---
const teamComparisonSchema = z.object({
  teamAId: z.string({ required_error: "Please select the first team." }),
  teamBId: z.string({ required_error: "Please select the second team." }),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Teams must be different.",
  path: ["teamBId"],
});
type TeamComparisonFormValues = z.infer<typeof teamComparisonSchema>;
interface TeamWithStats extends Team {
    stats: TeamStats;
}


function StatItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
        </div>
    );
}

function PlayerStatsDisplay({ player, stats }: { player: Person, stats: PlayerStats }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                 <Avatar className="h-16 w-16">
                    <AvatarImage src={player.profileImageUrl} />
                    <AvatarFallback className="text-2xl">{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{player.firstName} {player.lastName}</CardTitle>
                    <CardDescription>{player.email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-4 text-primary">Batting</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <StatItem label="Matches" value={stats.matchesPlayed} />
                        <StatItem label="Runs" value={stats.totalRuns} />
                        <StatItem label="Average" value={stats.battingAverage.toFixed(2)} />
                        <StatItem label="Strike Rate" value={stats.strikeRate.toFixed(2)} />
                        <StatItem label="100s" value={stats.hundreds} />
                        <StatItem label="50s" value={stats.fifties} />
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium mb-4 text-primary">Bowling</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <StatItem label="Wickets" value={stats.wicketsTaken} />
                        <StatItem label="Average" value={stats.bowlingAverage.toFixed(2)} />
                        <StatItem label="Economy" value={stats.economyRate.toFixed(2)} />
                        <StatItem label="Best" value={stats.bestBowling} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TeamStatsDisplay({ team, stats }: { team: Team, stats: TeamStats }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                 <div className="h-16 w-16 rounded-full border-4" style={{ borderColor: team.teamColors?.primary || '#ccc' }}/>
                <div>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.divisionName} &bull; {team.seasonName}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                    <StatItem label="Played" value={stats.matchesPlayed} />
                    <StatItem label="Won" value={stats.matchesWon} />
                    <StatItem label="Lost" value={stats.matchesLost} />
                    <StatItem label="Runs Scored" value={stats.totalRunsScored} />
                    <StatItem label="Wickets Taken" value={stats.totalWicketsTaken} />
                    <StatItem label="NRR" value={stats.netRunRate.toFixed(2)} />
                </div>
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
    });
    const playerAId = playerForm.watch('playerAId');
    const playerBId = playerForm.watch('playerBId');
    
    const teamForm = useForm<TeamComparisonFormValues>({
        resolver: zodResolver(teamComparisonSchema),
    });
    const teamAId = teamForm.watch('teamAId');
    const teamBId = teamForm.watch('teamBId');


    async function onPlayerSubmit(data: PlayerComparisonFormValues) {
        startPlayerTransition(async () => {
            setPlayerComparison(null);
            try {
                const [playerAStats, playerBStats] = await Promise.all([
                    getPlayerStats(data.playerAId),
                    getPlayerStats(data.playerBId),
                ]);

                const playerA = players.find(p => p.personId === data.playerAId)!;
                const playerB = players.find(p => p.personId === data.playerBId)!;

                setPlayerComparison({
                    playerA: { ...playerA, stats: playerAStats },
                    playerB: { ...playerB, stats: playerBStats },
                });

            } catch (error) {
                toast({
                    title: "Error",
                    description: "Could not fetch player statistics.",
                    variant: "destructive",
                });
            }
        });
    }
    
     async function onTeamSubmit(data: TeamComparisonFormValues) {
        startTeamTransition(async () => {
            setTeamComparison(null);
            try {
                const [teamAStats, teamBStats] = await Promise.all([
                    getTeamStats(data.teamAId),
                    getTeamStats(data.teamBId),
                ]);

                const teamA = teams.find(t => t.teamId === data.teamAId)!;
                const teamB = teams.find(t => t.teamId === data.teamBId)!;

                setTeamComparison({
                    teamA: { ...teamA, stats: teamAStats },
                    teamB: { ...teamB, stats: teamBStats },
                });

            } catch (error) {
                toast({
                    title: "Error",
                    description: "Could not fetch team statistics.",
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Compare</h1>
                <p className="text-muted-foreground">Compare players and teams head-to-head.</p>
            </header>

            <Tabs defaultValue="player-vs-player" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="player-vs-player">Player vs. Player</TabsTrigger>
                    <TabsTrigger value="team-vs-team">Team vs. Team</TabsTrigger>
                </TabsList>

                {/* Player vs Player Tab */}
                <TabsContent value="player-vs-player" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Player vs. Player Comparison</CardTitle>
                            <CardDescription>Select two players to see a side-by-side statistical comparison of their career stats.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...playerForm}>
                                <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="flex flex-col md:flex-row items-end gap-4">
                                    <div className="grid md:grid-cols-2 gap-4 flex-1 w-full">
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
                                    </div>
                                    <Button type="submit" disabled={isPlayerPending} className="w-full md:w-auto">
                                        {isPlayerPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
                                        Compare
                                    </Button>
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
                        <div className="grid md:grid-cols-2 gap-8 items-start mt-8">
                            <PlayerStatsDisplay player={playerComparison.playerA} stats={playerComparison.playerA.stats} />
                            <PlayerStatsDisplay player={playerComparison.playerB} stats={playerComparison.playerB.stats} />
                        </div>
                    )}

                    {!isPlayerPending && !playerComparison && (
                        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg mt-8">
                            <Swords className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-4 font-semibold">Select two players to compare</p>
                            <p className="text-sm text-muted-foreground">The results will be displayed here.</p>
                        </div>
                    )}
                </TabsContent>
                
                {/* Team vs Team Tab */}
                <TabsContent value="team-vs-team" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Team vs. Team Comparison</CardTitle>
                            <CardDescription>Select two teams to see a side-by-side comparison of their season stats.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...teamForm}>
                                <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="flex flex-col md:flex-row items-end gap-4">
                                    <div className="grid md:grid-cols-2 gap-4 flex-1 w-full">
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
                                    </div>
                                    <Button type="submit" disabled={isTeamPending} className="w-full md:w-auto">
                                        {isTeamPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                        Compare
                                    </Button>
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
                        <div className="grid md:grid-cols-2 gap-8 items-start mt-8">
                            <TeamStatsDisplay team={teamComparison.teamA} stats={teamComparison.teamA.stats} />
                            <TeamStatsDisplay team={teamComparison.teamB} stats={teamComparison.teamB.stats} />
                        </div>
                    )}

                    {!isTeamPending && !teamComparison && (
                         <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg mt-8">
                            <Shield className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-4 font-semibold">Select two teams to compare</p>
                            <p className="text-sm text-muted-foreground">The results will be displayed here.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
