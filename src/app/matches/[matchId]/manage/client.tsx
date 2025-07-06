
'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineupManager } from './lineup-manager';
import type { Match, RosterMemberWithStats } from '@/lib/data';

interface ManageLineupClientProps {
  match: Match;
  teamARosterWithStats: RosterMemberWithStats[];
  teamBRosterWithStats: RosterMemberWithStats[];
  teamALineup: string[];
  teamBLineup: string[];
}

export default function ManageLineupClient({
  match,
  teamARosterWithStats,
  teamBRosterWithStats,
  teamALineup,
  teamBLineup
}: ManageLineupClientProps) {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <Link href={`/matches/${match.matchId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Match Details
                </Link>
                <h1 className="text-3xl font-bold">Manage Lineups</h1>
                <p className="text-muted-foreground">{match.teamAName} vs {match.teamBName}</p>
            </header>
            
            <Tabs defaultValue="team-a-lineup" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="team-a-lineup">{match.teamAName}</TabsTrigger>
                    <TabsTrigger value="team-b-lineup" disabled={!match.teamBId}>{match.teamBName || 'TBD'}</TabsTrigger>
                </TabsList>
                <TabsContent value="team-a-lineup" className="mt-4">
                    <LineupManager 
                        key={`team-a-${match.matchId}`}
                        teamId={match.teamAId}
                        teamName={match.teamAName}
                        match={match}
                        rosterWithStats={teamARosterWithStats}
                        initialLineupIds={teamALineup}
                    />
                </TabsContent>
                <TabsContent value="team-b-lineup" className="mt-4">
                    {match.teamBId ? (
                        <LineupManager 
                            key={`team-b-${match.matchId}`}
                            teamId={match.teamBId}
                            teamName={match.teamBName}
                            match={match}
                            rosterWithStats={teamBRosterWithStats}
                            initialLineupIds={teamBLineup}
                        />
                    ) : (
                       <p className="text-center text-muted-foreground pt-10">Opponent not yet assigned.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
