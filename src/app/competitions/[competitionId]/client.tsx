
'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Users, ClipboardList, BarChart, Trophy, GitMerge } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Competition, Match, StandingTeam, LeaderboardPlayer } from "@/lib/data";
import { TopRunScorersChart, TopWicketTakersChart } from './competition-charts';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CompetitionDetailsClientProps {
    competition: Competition;
    standings: StandingTeam[];
    matches: Match[];
    leaderboards: {
        topRunScorers: LeaderboardPlayer[];
        topWicketTakers: LeaderboardPlayer[];
    };
}

function MatchupCard({ match }: { match: Match }) {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const teamAStyles = match.winnerTeamId === match.teamAId ? 'font-bold bg-background shadow-sm' : '';
  const teamBStyles = match.winnerTeamId === match.teamBId ? 'font-bold bg-background shadow-sm' : '';

  return (
    <div className="border p-3 rounded-lg bg-muted/50 w-full">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5 flex-1">
          <div className={cn("p-1.5 rounded text-sm flex items-center gap-2", teamAStyles)}>
            <span className="h-2 w-2 rounded-full border" style={{ backgroundColor: match.teamAColor || 'transparent' }} />
            {match.teamAName}
          </div>
          <div className={cn("p-1.5 rounded text-sm flex items-center gap-2", teamBStyles)}>
            {match.teamBId ? (<span className="h-2 w-2 rounded-full border" style={{ backgroundColor: match.teamBColor || 'transparent' }} />) : (<div className="h-2 w-2" />) }
            {match.teamBName || 'TBD'}
          </div>
        </div>
        <div className="text-right pl-2">
          {match.status === 'completed' && match.result ? (
            <Link href={`/matches/${match.matchId}`} className="text-xs text-primary hover:underline">View Result</Link>
          ) : (
            <div className="text-xs text-muted-foreground">
              {isClient && <p>{format(match.dateTime, "dd MMM")}</p>}
              {isClient && <p>{format(match.dateTime, "p")}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function CompetitionDetailsClient({ competition, standings, matches, leaderboards }: CompetitionDetailsClientProps) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);
    
    const { topRunScorers, topWicketTakers } = leaderboards;
    const isLeague = competition.type === 'League';

    const bracketRounds = React.useMemo(() => {
        const grouped: { [key: number]: Match[] } = {};
        matches.forEach(match => {
            const round = match.round || 1;
            if (!grouped[round]) {
                grouped[round] = [];
            }
            grouped[round].push(match);
        });
        return Object.entries(grouped).map(([round, matchesInRound]) => ({
            round: parseInt(round, 10),
            matches: matchesInRound.sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime()),
        })).sort((a, b) => a.round - b.round);
    }, [matches]);

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

            <Tabs defaultValue={isLeague ? "standings" : "bracket"}>
                <TabsList className="grid w-full grid-cols-3">
                    {isLeague ? (
                        <TabsTrigger value="standings"><Trophy className="mr-2 h-4 w-4"/>Standings</TabsTrigger>
                    ) : (
                        <TabsTrigger value="bracket"><GitMerge className="mr-2 h-4 w-4"/>Bracket</TabsTrigger>
                    )}
                    <TabsTrigger value="matches"><ClipboardList className="mr-2 h-4 w-4"/>Matches</TabsTrigger>
                    <TabsTrigger value="players"><Users className="mr-2 h-4 w-4"/>Players</TabsTrigger>
                </TabsList>

                {isLeague && (
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
                )}
                {!isLeague && (
                     <TabsContent value="bracket" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tournament Bracket</CardTitle>
                                <CardDescription>A visual overview of the tournament matchups.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {bracketRounds.length > 0 ? (
                                    <ScrollArea>
                                        <div className="flex items-stretch gap-8 p-4 min-h-[400px]">
                                            {bracketRounds.map(round => (
                                                <div key={round.round} className="flex-shrink-0 w-72 flex flex-col">
                                                    <h3 className="text-lg font-bold mb-4 text-center">
                                                        {round.matches.length === 1 ? 'Final' : `Round ${round.round}`}
                                                    </h3>
                                                    <div className="flex flex-col justify-around flex-grow gap-y-8">
                                                        {round.matches.map(match => (
                                                            <MatchupCard key={match.matchId} match={match} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No matches scheduled for this competition yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
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
                                                     {match.teamBId ? (<span className="h-2 w-2 rounded-full border" style={{ backgroundColor: match.teamBColor || 'transparent' }} />) : (<div className="h-2 w-2" />) }
                                                    <span>{match.teamBName || 'TBD'}</span>
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
