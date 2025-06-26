
'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, isSameDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Match } from '@/lib/data';

export function MatchCalendar({ matches }: { matches: Match[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const selectedDayMatches = React.useMemo(() => {
    if (!date) return [];
    return matches.filter((match) => isSameDay(match.dateTime, date))
                  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [date, matches]);

  const matchDays = React.useMemo(() => {
    return matches.map((match) => match.dateTime);
  }, [matches]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
            <CardContent className="p-0 flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0"
                    modifiers={{ hasMatch: matchDays }}
                    modifiersClassNames={{
                        hasMatch: 'bg-primary/20 rounded-md text-primary-foreground',
                    }}
                />
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
            <CardHeader>
                <CardTitle>Fixtures for</CardTitle>
                <CardDescription>{date ? format(date, 'PPP') : 'selected date'}</CardDescription>
            </CardHeader>
            <CardContent>
                {selectedDayMatches.length > 0 ? (
                    <ul className="space-y-4">
                        {selectedDayMatches.map(match => (
                             <li key={match.matchId} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <Link href={`/matches/${match.matchId}`} className="font-semibold hover:underline block">{match.teamAName} vs {match.teamBName}</Link>
                                <p className="text-sm text-muted-foreground">{format(match.dateTime, 'p')} at {match.fieldName}</p>
                                <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize mt-2">{match.status}</Badge>
                             </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-8 h-full flex items-center justify-center">
                        <p>No matches scheduled for this date.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
