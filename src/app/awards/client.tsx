'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Target, Medal } from 'lucide-react';
import type { AwardsData } from '@/lib/data';
import { DreamTeamCard } from '../dream-team-card';

function StatCard({ title, person, statLabel, statValue }: { title: string, person: any, statLabel: string, statValue: string | number }) {
    if (!person) return null;

    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12"><AvatarImage src={person.profileImageUrl} alt={`${person.firstName} ${person.lastName}`} /><AvatarFallback>{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar>
            <div className="flex-1">
                <p className="text-sm font-semibold text-primary">{title}</p>
                <Link href={`/people/${person.personId}`} className="font-semibold hover:underline">{person.firstName} {person.lastName}</Link>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">{statValue}</p>
                <p className="text-xs text-muted-foreground">{statLabel}</p>
            </div>
        </div>
    );
}

export default function AwardsClient({ initialAwardsData }: { initialAwardsData: AwardsData }) {
    const { trophyCabinet, topRunScorer, topWicketTaker } = initialAwardsData;

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Awards & Accolades</h1>
                <p className="text-muted-foreground">Celebrating team victories and individual brilliance from the season.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy className="text-amber-500" />Trophy Cabinet</CardTitle>
                            <CardDescription>Champions of the season's competitions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trophyCabinet.length > 0 ? (
                                trophyCabinet.map(comp => (
                                    <div key={comp.competitionId} className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12"><AvatarImage src={comp.winnerTeamLogoUrl} /><AvatarFallback>{comp.winnerTeamName?.[0]}</AvatarFallback></Avatar>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{comp.name}</p>
                                            <Link href={`/teams/${comp.winnerTeamId}`} className="font-bold text-lg hover:underline">{comp.winnerTeamName}</Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-muted-foreground py-8">No competition winners have been declared yet.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Individual Accolades</CardTitle>
                            <CardDescription>Top performers across all competitions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <StatCard title="Top Run Scorer" person={topRunScorer} statLabel="Runs" statValue={topRunScorer?.stats.totalRuns ?? 0} />
                           <StatCard title="Top Wicket Taker" person={topWicketTaker} statLabel="Wickets" statValue={topWicketTaker?.stats.wicketsTaken ?? 0} />
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    <DreamTeamCard />
                </div>
            </div>
        </div>
    );
}
