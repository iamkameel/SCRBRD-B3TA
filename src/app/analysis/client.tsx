'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Person, type PlayerStats } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPlayerStats } from '@/lib/actions/players';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Swords } from 'lucide-react';

const comparisonSchema = z.object({
  playerAId: z.string({ required_error: "Please select the first player." }),
  playerBId: z.string({ required_error: "Please select the second player." }),
}).refine(data => data.playerAId !== data.playerBId, {
  message: "Players must be different.",
  path: ["playerBId"],
});

type ComparisonFormValues = z.infer<typeof comparisonSchema>;

interface PlayerWithStats extends Person {
    stats: PlayerStats;
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

export default function AnalysisClient({ players }: { players: Person[] }) {
    const [isPending, startTransition] = React.useTransition();
    const [comparison, setComparison] = React.useState<{ playerA: PlayerWithStats, playerB: PlayerWithStats } | null>(null);
    const { toast } = useToast();

    const form = useForm<ComparisonFormValues>({
        resolver: zodResolver(comparisonSchema),
    });

    const playerAId = form.watch('playerAId');
    const playerBId = form.watch('playerBId');

    async function onSubmit(data: ComparisonFormValues) {
        startTransition(async () => {
            setComparison(null);
            try {
                const [playerAStats, playerBStats] = await Promise.all([
                    getPlayerStats(data.playerAId),
                    getPlayerStats(data.playerBId),
                ]);

                const playerA = players.find(p => p.personId === data.playerAId)!;
                const playerB = players.find(p => p.personId === data.playerBId)!;

                setComparison({
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

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Analysis Hub</h1>
                <p className="text-muted-foreground">Compare players and teams head-to-head.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Player vs. Player Comparison</CardTitle>
                    <CardDescription>Select two players to see a side-by-side statistical comparison of their career stats.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row items-end gap-4">
                            <div className="grid md:grid-cols-2 gap-4 flex-1 w-full">
                                <FormField
                                    control={form.control}
                                    name="playerAId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Player 1</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
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
                                    control={form.control}
                                    name="playerBId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Player 2</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
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
                            <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
                                Compare
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            
            {isPending && (
                 <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 font-semibold">Fetching Player Stats...</p>
                </div>
            )}

            {!isPending && comparison && (
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <PlayerStatsDisplay player={comparison.playerA} stats={comparison.playerA.stats} />
                    <PlayerStatsDisplay player={comparison.playerB} stats={comparison.playerB.stats} />
                </div>
            )}

            {!isPending && !comparison && (
                 <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                    <Swords className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Select two players to compare</p>
                    <p className="text-sm text-muted-foreground">The results will be displayed here.</p>
                </div>
            )}

        </div>
    );
}
