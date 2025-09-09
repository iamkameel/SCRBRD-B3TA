
'use client';

import * as React from 'react';
import type { Match, Innings, BatsmanStats, BowlerStats } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface RecapCardProps {
    match: Match;
    scorecard: {
        innings1: Innings;
        innings2: Innings;
    };
}

const getTopBatsmen = (battingCard: BatsmanStats[]): BatsmanStats[] => {
    return [...battingCard]
        .filter(b => b.balls > 0)
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 4);
};

const getTopBowlers = (bowlingCard: BowlerStats[]): BowlerStats[] => {
    return [...bowlingCard]
        .filter(b => b.overs > 0)
        .sort((a, b) => {
            if (b.wickets !== a.wickets) {
                return b.wickets - a.wickets;
            }
            return a.runs - b.runs;
        })
        .slice(0, 3);
};

function InningsRecap({ team, teamLogo, innings, opponentBowlers }: { team: { name: string, abbrev?: string, logoUrl?: string }, innings: Innings, opponentBowlers: BowlerStats[] }) {
    const topBatsmen = getTopBatsmen(innings.battingCard);
    const topBowlers = getTopBowlers(opponentBowlers);

    return (
        <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={team.logoUrl} /><AvatarFallback>{team.abbrev || team.name[0]}</AvatarFallback></Avatar>
                    <h3 className="text-xl font-bold">{team.name}</h3>
                </div>
                <p className="text-3xl font-bold">{innings.totalRuns}-{innings.wickets}</p>
            </div>
            <div className="text-sm space-y-1">
                {topBatsmen.map((batsman, i) => (
                    <div key={i} className="flex justify-between">
                        <p>{batsman.name.replace(/\s*\(C\)|\s*\(Wk\)/, '')}</p>
                        <p className="font-semibold">{batsman.runs} <span className="text-muted-foreground font-normal">({batsman.balls})</span></p>
                    </div>
                ))}
            </div>
            <div className="my-3 border-t border-dashed" />
            <p className="text-center text-sm font-semibold mb-2">{innings.overs} OVERS</p>
            <div className="my-3 border-t border-dashed" />
             <div className="text-sm space-y-1">
                {topBowlers.map((bowler, i) => (
                    <div key={i} className="flex justify-between">
                        <p>{bowler.name.replace(/\s*\(C\)|\s*\(Wk\)/, '')}</p>
                        <p className="font-semibold">{bowler.wickets}-{bowler.runs} <span className="text-muted-foreground font-normal">({bowler.overs})</span></p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function MatchRecapCard({ match, scorecard }: RecapCardProps) {
    const inningsA = scorecard.innings1.teamName === match.teamAName ? scorecard.innings1 : scorecard.innings2;
    const inningsB = scorecard.innings1.teamName === match.teamBName ? scorecard.innings1 : scorecard.innings2;

    const teamA = { name: match.teamAName, abbrev: match.teamAAbbreviation, logoUrl: match.teamALogoUrl };
    const teamB = { name: match.teamBName, abbrev: match.teamBAbbreviation, logoUrl: match.teamBLogoUrl };

    return (
        <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl bg-gradient-to-br from-[#4c1d95] to-[#1e1b4b] text-primary-foreground border-purple-400/20">
            <CardHeader className="text-center p-4 bg-black/20">
                <p className="text-sm font-semibold tracking-wider text-purple-300">{match.competitionName}</p>
                <CardDescription className="text-xs text-purple-400">{match.fieldName}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <InningsRecap
                        team={teamA}
                        innings={inningsA}
                        opponentBowlers={inningsB.bowlingCard}
                    />
                    <div className="border-l border-purple-400/30 self-stretch mx-4 hidden md:block" />
                    <Separator className="md:hidden bg-purple-400/30" />
                     <InningsRecap
                        team={teamB}
                        innings={inningsB}
                        opponentBowlers={inningsA.bowlingCard}
                    />
                </div>
            </CardContent>
            <div className="bg-black/20 p-4 text-center font-bold text-lg tracking-wide">
                <p>{match.result}</p>
            </div>
        </Card>
    );
}
