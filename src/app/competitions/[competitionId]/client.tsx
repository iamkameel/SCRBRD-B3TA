'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Users, ClipboardList, BarChart, Trophy } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Competition, Match, StandingTeam, LeaderboardPlayer } from "@/lib/data";
import { TopRunScorersChart, TopWicketTakersChart } from './competition-charts';

interface CompetitionDetailsClientProps {
    competition: Competition;
    standings: StandingTeam[];
    matches: Match[];
    leaderboards: {
        topRunScorers: LeaderboardPlayer[];
        topWicketTakers: LeaderboardPlayer[];
    };
}

export default function CompetitionDetailsClient({ competition, standings, matches, leaderboards }: CompetitionDetailsClientProps) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);
    
    const { topRunScorers, topWicketTakers } = leaderboards;

    return (
        <div className="flex flex-col gap-8">
            <header>
                <Link href="/competitions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Competitions
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{competition.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {competition.divisionName} &bull; {competition.seasonName}
                        </p>
                    </div>
                     <Badge variant={competition.status === 'Completed' ? 'secondary' : 'default'} className="capitalize h-fit">{competition.status}</Badge>
                </div>
                {competition.winnerTeamName && (
                    <div className="flex items-center gap-2 mt-2 text-accent">
                        <Trophy className="h-5 w-5" />
                        <span className="font-semibold">Winner: {competition.winnerTeamName}</span>
                    </div>
                )}
            </header>

            <Tabs defaultValue="standings">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="standings"><Trophy />Standings</TabsTrigger>
                    <TabsTrigger value="matches"><ClipboardList />Matches</TabsTrigger>
                    <TabsTrigger value="players"><Users />Players</TabsTrigger>
                </TabsList>

                <TabsContent value="standings" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Standings</CardTitle>
                            <CardDescription>Current leaderboard for the {competition.name}.</CardDescription>
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
                                            <Link href={`/teams/${team.teamId}`} className="font-medium hover:underline">{team.name}</Link>
                                        </TableCell>
                                        <TableCell className="text-right">{team.stats.matchesPlayed}</TableCell>
                                        <TableCell className="text-right">{team.stats.matchesWon}</TableCell>
                                        <TableCell className="text-right">{team.stats.matchesLost}</TableCell>
                                        <TableCell className="text-right">{team.stats.netRunRate.toFixed(2)}</TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">No team stats available yet.</TableCell></TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="matches" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Match List</CardTitle>
                            <CardDescription>All matches scheduled for this competition.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Match</TableHead><TableHead>Date</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {matches.length > 0 ? (
                                        matches.map((match) => (
                                        <TableRow key={match.matchId}>
                                        <TableCell className="font-medium">
                                            <Link href={`/matches/${match.matchId}`} className="hover:underline flex items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full border" style={{ backgroundColor: match.teamAColor || 'transparent' }} />
                                                    <span>{match.teamAName}</span>
                                                </div>
                                                <span className="text-muted-foreground text-xs">vs</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full border" style={{ backgroundColor: match.teamBColor || 'transparent' }} />
                                                    <span>{match.teamBName}</span>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>{isClient ? format(match.dateTime, "PPP p") : '\u00A0'}</TableCell>
                                        <TableCell>{match.fieldName}</TableCell>
                                        <TableCell><Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No matches found for this competition.</TableCell></TableRow>
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
                                <CardDescription>Batting leaders in this competition.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <TopRunScorersChart data={topRunScorers} />
                                {topRunScorers.length > 0 ? topRunScorers.map((player) => (
                                    <div key={player.personId} className="flex items-center gap-4">
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
                                <CardDescription>Bowling leaders in this competition.</CardDescription>
                            </CardHeader>
                             <CardContent className="space-y-4">
                                <TopWicketTakersChart data={topWicketTakers} />
                                {topWicketTakers.length > 0 ? topWicketTakers.map((player) => (
                                    <div key={player.personId} className="flex items-center gap-4">
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
        </div>
    );
}
