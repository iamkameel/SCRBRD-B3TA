
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Match } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Trophy, Shield, MapPin, Calendar } from 'lucide-react';

const competitionTypeMap: { [key: string]: { name: string; icon: React.ElementType } } = {
  Cup: { name: 'Coastal Cup', icon: Trophy },
  League: { name: 'Regional League', icon: Shield },
  Tournament: { name: 'Inter-School Championship', icon: Trophy },
  Friendlies: { name: 'Friendly Match', icon: Shield },
  Festival: { name: 'Festival', icon: Shield },
};

export function AgendaView({ matches }: { matches: Match[] }) {
  const groupedByDate = React.useMemo(() => {
    return matches.reduce((acc, match) => {
      const dateKey = format(match.dateTime, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  }, [matches]);

  const sortedDateKeys = Object.keys(groupedByDate).sort();

  if (sortedDateKeys.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <CardTitle>No Fixtures Scheduled</CardTitle>
        <CardDescription>There are no matches in the selected time period.</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDateKeys.map((dateKey) => {
        const date = new Date(dateKey);
        const dayMatches = groupedByDate[dateKey];
        return (
          <div key={dateKey} className="relative pl-8">
            <div className="absolute left-0 flex flex-col items-center h-full">
              <span className="h-4 w-4 bg-primary rounded-full z-10"></span>
              <div className="w-0.5 bg-border flex-grow"></div>
            </div>
            <div className="mb-8">
                <h2 className="text-xl font-bold">{format(date, 'MMMM do, yyyy')}</h2>
                <div className="text-sm text-muted-foreground flex items-center gap-2">{format(date, 'eeee')} <Badge variant="outline">{dayMatches.length} Fixtures</Badge></div>
            </div>
            <div className="space-y-6">
              {dayMatches.map((match) => {
                 const compInfo = competitionTypeMap[match.competitionType || 'Friendlies'] || { name: 'Match', icon: Shield };
                return (
                  <Card key={match.matchId} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{format(match.dateTime, 'p')}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <Avatar className="h-8 w-8"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName?.[0]}</AvatarFallback></Avatar>
                             <CardTitle className="text-lg">{match.teamAName}</CardTitle>
                          </div>
                          <p className="pl-10 text-muted-foreground my-1">vs</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
                             <CardTitle className="text-lg">{match.teamBName}</CardTitle>
                          </div>
                        </div>
                        <Badge variant="secondary" className="capitalize h-fit">{match.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><compInfo.icon className="h-4 w-4" />{match.competitionName}</div>
                        <div className="flex items-center gap-2"><Shield className="h-4 w-4" />{match.divisionName}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{match.fieldName} ({match.teamAId === match.fieldId ? 'Home' : 'Away'})</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
