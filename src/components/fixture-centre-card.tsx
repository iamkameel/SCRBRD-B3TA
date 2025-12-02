'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Match } from '@/lib/data';
import { RadioTower, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface FixtureCentreProps {
    liveMatches: Match[];
    upcomingFixtures: Match[];
    recentResults: Match[];
}

function MatchItem({ match }: { match: Match }) {
    const isLive = match.status === 'live';
    const isCompleted = match.status === 'completed';

    return (
        <Link href={`/matches/${match.matchId}`} className="block p-3 rounded-lg hover:bg-muted -mx-3 transition-colors">
            <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName?.[0]}</AvatarFallback></Avatar>
                        <p className={cn("font-medium", isCompleted && match.winnerTeamId === match.teamAId && "font-bold")}>{match.teamAName}</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
                        <p className={cn("font-medium", isCompleted && match.winnerTeamId === match.teamBId && "font-bold")}>{match.teamBName}</p>
                    </div>
                </div>
                 <div className="text-right">
                    {isLive && match.liveScore ? (
                         <div className="text-right">
                            <p className="font-bold text-lg">{match.liveScore.runs}/{match.liveScore.wickets}</p>
                            <p className="text-xs text-muted-foreground">({match.liveScore.overs}.{match.liveScore.balls})</p>
                        </div>
                    ) : isCompleted ? (
                        <p className="text-sm font-semibold text-muted-foreground">{match.result}</p>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            <p>{format(match.dateTime, 'p')}</p>
                            <p>{format(match.dateTime, 'dd/MM')}</p>
                        </div>
                    )}
                 </div>
            </div>
        </Link>
    );
}

export function FixtureCentreCard({ liveMatches, upcomingFixtures, recentResults }: FixtureCentreProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Fixture Centre</CardTitle>
                <CardDescription>An overview of live, upcoming, and recent matches.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="live" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="live" className="relative">
                            <RadioTower className="mr-2" /> Live
                             {liveMatches.length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                        </TabsTrigger>
                        <TabsTrigger value="upcoming"><Calendar className="mr-2" /> Upcoming</TabsTrigger>
                        <TabsTrigger value="results"><CheckCircle className="mr-2" /> Results</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="h-96 mt-4">
                        <TabsContent value="live">
                            {liveMatches.length > 0 ? (
                                <div className="space-y-2 pr-3">
                                    {liveMatches.map(match => <MatchItem key={match.matchId} match={match} />)}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground text-center">No matches are currently live.</div>
                            )}
                        </TabsContent>
                        <TabsContent value="upcoming">
                             {upcomingFixtures.length > 0 ? (
                                <div className="space-y-2 pr-3">
                                    {upcomingFixtures.map(match => <MatchItem key={match.matchId} match={match} />)}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground text-center">No upcoming fixtures scheduled.</div>
                            )}
                        </TabsContent>
                        <TabsContent value="results">
                            {recentResults.length > 0 ? (
                                <div className="space-y-2 pr-3">
                                    {recentResults.map(match => <MatchItem key={match.matchId} match={match} />)}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground text-center">No recent results found.</div>
                            )}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </CardContent>
        </Card>
    );
}
