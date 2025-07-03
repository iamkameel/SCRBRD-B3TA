'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { Match } from '@/lib/data';

export function FixtureListItem({ fixture }: { fixture: Match }) {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <Link href={`/matches/${fixture.matchId}`} className="block p-4 border rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-center w-12">
                        <p className="font-bold text-lg">{isClient ? format(fixture.dateTime, 'dd') : ''}</p>
                        <p className="text-xs text-muted-foreground -mt-1">{isClient ? format(fixture.dateTime, 'MMM') : ''}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarImage src={fixture.teamALogoUrl} /><AvatarFallback>{fixture.teamAName[0]}</AvatarFallback></Avatar>
                            <span className="font-semibold">{fixture.teamAName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground my-1 pl-8">vs</div>
                        <div className="flex items-center gap-2">
                             <Avatar className="h-6 w-6"><AvatarImage src={fixture.teamBLogoUrl} /><AvatarFallback>{fixture.teamBName[0]}</AvatarFallback></Avatar>
                            <span className="font-semibold">{fixture.teamBName}</span>
                        </div>
                    </div>
                </div>
                 <div className="flex flex-col items-end gap-2">
                    <Badge variant={fixture.status === 'live' ? 'destructive' : 'default'} className="capitalize">
                        {fixture.status}
                    </Badge>
                     <p className="text-xs text-muted-foreground">{isClient ? format(fixture.dateTime, 'p') : ''} @ {fixture.fieldName}</p>
                     <p className="text-xs text-muted-foreground">{fixture.competitionName}</p>
                 </div>
            </div>
        </Link>
    );
}
