

'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Users, ClipboardList, Trophy, GitMerge } from "lucide-react";

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

const BracketMatch = React.forwardRef<HTMLDivElement, { match: Match }>(({ match }, ref) => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const teamAStyles = match.winnerTeamId === match.teamAId ? 'font-bold text-foreground' : 'text-muted-foreground';
  const teamBStyles = match.winnerTeamId === match.teamBId ? 'font-bold text-foreground' : 'text-muted-foreground';
  const isTBD = !match.teamBId;

  return (
    <div ref={ref} className="border p-3 rounded-lg bg-background w-64 shadow-sm z-10">
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
        <p>{isClient ? format(match.dateTime, "dd MMM, p") : '...'}</p>
        {!isTBD && <Link href={`/matches/${match.matchId}`} className="hover:underline">Details</Link>}
      </div>
      <div className="space-y-1.5 text-sm">
        <div className={cn("flex items-center gap-2", teamAStyles)}>
            <Avatar className="h-4 w-4"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName[0]}</AvatarFallback></Avatar>
            {match.teamAName}
        </div>
        <div className={cn("flex items-center gap-2", teamBStyles)}>
            {match.teamBId ? (<Avatar className="h-4 w-4"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName[0]}</AvatarFallback></Avatar>) : (<div className="h-4 w-4" />) }
            {match.teamBName || 'TBD'}
        </div>
      </div>
       {match.status === 'completed' && match.result && (
        <p className="text-xs text-center mt-2 font-medium">{match.result}</p>
      )}
    </div>
  );
});
BracketMatch.displayName = 'BracketMatch';

function TournamentBracket({ rounds }: { rounds: { round: number; matches: Match[] }[] }) {
    const matchRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map());
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [lines, setLines] = React.useState<React.ReactNode[]>([]);

    const getRoundTitle = (matchCount: number) => {
        if (matchCount === 1) return 'Final';
        if (matchCount === 2) return 'Semi-Finals';
        if (matchCount === 4) return 'Quarter-Finals';
        if (matchCount > 0) return `Round of ${matchCount * 2}`;
        return 'Round';
    };

    React.useEffect(() => {
        const calculateLines = () => {
            if (!containerRef.current) return;

            const bracketRect = containerRef.current.getBoundingClientRect();
            const newLines: React.ReactNode[] = [];

            for (let i = 0; i < rounds.length - 1; i++) {
                const currentRoundMatches = rounds[i].matches;
                const nextRoundMatches = rounds[i + 1].matches;

                currentRoundMatches.forEach((match, matchIndex) => {
                    const match1Div = matchRefs.current.get(match.matchId);
                    const nextMatch = nextRoundMatches[Math.floor(matchIndex / 2)];
                    if (!match1Div || !nextMatch) return;

                    const match2Div = matchRefs.current.get(nextMatch.matchId);
                    if (!match2Div) return;

                    const rect1 = match1Div.getBoundingClientRect();
                    const rect2 = match2Div.getBoundingClientRect();

                    const x1 = rect1.right - bracketRect.left;
                    const y1 = rect1.top + rect1.height / 2 - bracketRect.top;
                    const x2 = rect2.left - bracketRect.left;
                    const y2 = rect2.top + rect2.height / 2 - bracketRect.top;
                    
                    const midX = x1 + 24;

                    const pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

                    newLines.push(
                        <path key={`${match.matchId}-${nextMatch.matchId}`} d={pathD} stroke="hsl(var(--border))" strokeWidth="2" fill="none" />
                    );
                });
            }
            setLines(newLines);
        };
        
        // Timeout to ensure DOM is fully painted
        const timeoutId = setTimeout(calculateLines, 100);
        
        window.addEventListener('resize', calculateLines);
        return () => {
          clearTimeout(timeoutId);
          window.removeEventListener('resize', calculateLines);
        };
    }, [rounds]);
    
    return (
        <div ref={containerRef} className="relative">
             <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <svg className="w-full h-full">
                    <g>{lines}</g>
                </svg>
            </div>
            <div className="flex items-stretch gap-12 p-4 min-h-[400px]">
                 {rounds.map((round) => (
                    <div key={round.round} className="flex flex-col justify-around">
                        <h3 className="text-lg font-bold mb-4 text-center sticky top-0 bg-card/80 py-2 backdrop-blur-sm z-10">
                            {getRoundTitle(round.matches.length)}
                        </h3>
                        <div className="flex flex-col justify-around flex-grow gap-y-8">
                            {round.matches.map(match => (
                                <BracketMatch 
                                    key={match.matchId} 
                                    match={match} 
                                    ref={el => matchRefs.current.set(match.matchId, el)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
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
                                                <Link href={`/teams/${team.teamId}`} className="font-medium hover:underline flex items-center gap-2">
                                                    <Avatar className="h-6 w-6"><AvatarImage src={team.logoUrl} /><AvatarFallback>{team.name[0]}</AvatarFallback></Avatar>
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
                                        <TournamentBracket rounds={bracketRounds} />
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
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName[0]}</AvatarFallback></Avatar>
                                                    <span>{match.teamAName}</span>
                                                </div>
                                                <span className="text-muted-foreground text-xs">vs</span>
                                                <div className="flex items-center gap-2">
                                                    {match.teamBId ? (<Avatar className="h-6 w-6"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName[0]}</AvatarFallback></Avatar>) : (<div className="h-6 w-6" />) }
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
