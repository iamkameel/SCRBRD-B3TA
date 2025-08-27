
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type LeaderboardPlayer, type StandingTeam, type Division } from '@/lib/data';
import { getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import { Loader2 } from 'lucide-react';

interface RankingsClientProps {
    initialLeaderboards: {
        topRunScorers: LeaderboardPlayer[];
        topWicketTakers: LeaderboardPlayer[];
    };
    initialStandings: StandingTeam[];
    divisions: Division[];
    initialDivisionId?: string;
}

export default function RankingsClient({ initialLeaderboards, initialStandings, divisions, initialDivisionId }: RankingsClientProps) {
    const [loading, setLoading] = React.useState(false);
    const [selectedDivisionId, setSelectedDivisionId] = React.useState<string | undefined>(initialDivisionId);
    const [leaderboards, setLeaderboards] = React.useState(initialLeaderboards);
    const [standings, setStandings] = React.useState(initialStandings);

    const handleDivisionChange = async (divisionId: string) => {
        setLoading(true);
        setSelectedDivisionId(divisionId);
        try {
            const [newLeaderboards, newStandings] = await Promise.all([
                getLeaderboards({ divisionId }),
                getTeamStandings(divisionId)
            ]);
            setLeaderboards(newLeaderboards);
            setStandings(newStandings);
        } catch (error) {
            console.error("Failed to fetch new ranking data", error);
            // Optionally, show a toast notification
        } finally {
            setLoading(false);
        }
    };
    
    const { topRunScorers, topWicketTakers } = leaderboards;

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Ranking Hub</h1>
                <p className="text-muted-foreground">View overall team and player leaderboards by division.</p>
            </header>

            <div className="flex justify-end">
                <div className="w-full max-w-xs">
                     <Select value={selectedDivisionId} onValueChange={handleDivisionChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a division..." />
                        </SelectTrigger>
                        <SelectContent>
                            {divisions.map(division => (
                                <SelectItem key={division.divisionId} value={division.divisionId}>
                                    {division.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs defaultValue="teams">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="teams">Team Standings</TabsTrigger>
                        <TabsTrigger value="players">Player Leaderboards</TabsTrigger>
                    </TabsList>
                    <TabsContent value="teams" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Standings</CardTitle>
                                <CardDescription>Overall season leaderboard based on wins and Net Run Rate.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Pos</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead className="text-right">Played</TableHead>
                                            <TableHead className="text-right">Won</TableHead>
                                            <TableHead className="text-right">Lost</TableHead>
                                            <TableHead className="text-right">NRR</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {standings.length > 0 ? (
                                        standings.map((team, index) => (
                                        <TableRow key={team.teamId}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                            <Link href={`/teams/${team.teamId}`} className="font-medium hover:underline flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: team.teamColors?.primary || 'transparent' }} />
                                                {team.name}
                                            </Link>
                                            </TableCell>
                                            <TableCell className="text-right">{team.stats.matchesPlayed}</TableCell>
                                            <TableCell className="text-right">{team.stats.matchesWon}</TableCell>
                                            <TableCell className="text-right">{team.stats.matchesLost}</TableCell>
                                            <TableCell className="text-right">{team.stats.netRunRate.toFixed(2)}</TableCell>
                                        </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center">No team stats available. Complete some matches to see standings.</TableCell></TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="players" className="mt-4">
                        <div className="grid gap-8 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Run Scorers</CardTitle>
                                    <CardDescription>Batting leaders for the selected division.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {topRunScorers.length > 0 ? topRunScorers.map((player, index) => (
                                        <div key={player.personId} className="flex items-center gap-4">
                                            <div className="font-bold text-lg w-6 text-center">{index + 1}</div>
                                            <Avatar className="h-10 w-10"><AvatarImage src={player.profileImageUrl} alt={`${player.firstName} ${player.lastName}`} /><AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback></Avatar>
                                            <div className="flex-1"><Link href={`/people/${player.personId}`} className="font-semibold hover:underline">{player.firstName} {player.lastName}</Link><p className="text-sm text-muted-foreground">Avg: {player.stats.battingAverage.toFixed(2)}</p></div>
                                            <div className="text-right"><p className="font-bold text-lg">{player.stats.totalRuns}</p><p className="text-xs text-muted-foreground">Runs</p></div>
                                        </div>
                                    )) : <p className="text-sm text-center text-muted-foreground py-8">No batting stats yet.</p>}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Wicket Takers</CardTitle>
                                    <CardDescription>Bowling leaders for the selected division.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {topWicketTakers.length > 0 ? topWicketTakers.map((player, index) => (
                                        <div key={player.personId} className="flex items-center gap-4">
                                            <div className="font-bold text-lg w-6 text-center">{index + 1}</div>
                                            <Avatar className="h-10 w-10"><AvatarImage src={player.profileImageUrl} alt={`${player.firstName} ${player.lastName}`} /><AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback></Avatar>
                                            <div className="flex-1"><Link href={`/people/${player.personId}`} className="font-semibold hover:underline">{player.firstName} {player.lastName}</Link><p className="text-sm text-muted-foreground">Econ: {player.stats.economyRate.toFixed(2)}</p></div>
                                            <div className="text-right"><p className="font-bold text-lg">{player.stats.wicketsTaken}</p><p className="text-xs text-muted-foreground">Wickets</p></div>
                                        </div>
                                    )) : <p className="text-sm text-center text-muted-foreground py-8">No bowling stats yet.</p>}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
