
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { PlusCircle, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TrainingSession, Team } from '@/lib/data';

export default function PlannerClient({ sessions, team }: { sessions: TrainingSession[], team: Team | null }) {
    return (
        <div className="flex flex-col gap-8">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Session Planner</h1>
                <p className="text-muted-foreground">
                  {team ? `Planning for ${team.name}` : 'Create and manage your training sessions.'}
                </p>
              </div>
              {team && (
                <Button disabled>
                    <PlusCircle className="mr-2" />Add Session
                </Button>
              )}
            </header>

            {!team && (
                 <Card>
                    <CardHeader>
                        <CardTitle>No Team Assigned</CardTitle>
                        <CardDescription>You must be assigned to a team as a coach to use the session planner.</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {team && sessions.length === 0 && (
                <Card>
                    <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="font-semibold">No Sessions Planned</p>
                        <p className="text-sm text-muted-foreground">Get started by creating your first training session.</p>
                    </CardContent>
                </Card>
            )}

            {team && sessions.length > 0 && (
                <div className="space-y-4">
                    {sessions.map(session => (
                        <Card key={session.sessionId}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{session.title}</CardTitle>
                                        <CardDescription>{format(session.date, 'PPP, p')}</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" disabled>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">Focus:</p>
                                    {session.focus.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
