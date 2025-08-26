
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, HelpCircle, Heart, User, Clock } from 'lucide-react';
import type { RosterMember, AvailabilityStatus } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusConfig = {
    attending: { icon: CheckCircle, className: "text-green-500", label: 'Attending' },
    unavailable: { icon: XCircle, className: "text-red-500", label: 'Unavailable' },
    tentative: { icon: HelpCircle, className: "text-yellow-500", label: 'Tentative' },
    injured: { icon: Heart, className: "text-orange-500", label: 'Injured' },
};

interface AvailabilityStatusCardProps {
    title: string;
    roster: RosterMember[];
    availability: { [personId: string]: { status: AvailabilityStatus; note?: string; } } | undefined;
}

export function AvailabilityStatusCard({ title, roster, availability }: AvailabilityStatusCardProps) {
    const availabilityMap = availability || {};

    const getStatusInfo = (personId: string) => {
        const playerAvailability = availabilityMap[personId];
        if (playerAvailability) {
            return {
                ...statusConfig[playerAvailability.status],
                note: playerAvailability.note,
            };
        }
        return { icon: Clock, className: "text-muted-foreground", label: 'No Response', note: undefined };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>A live look at who can make the match.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    <div className="space-y-4 pr-4">
                        {roster.map(player => {
                            const statusInfo = getStatusInfo(player.personId);
                            const Icon = statusInfo.icon;
                            return (
                                <div key={player.personId} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={(player as any).profileImageUrl} alt={player.personName} />
                                        <AvatarFallback>{player.personName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{player.personName}</p>
                                        <p className="text-xs text-muted-foreground">{player.role}</p>
                                    </div>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className={cn("flex items-center gap-1.5 text-sm font-semibold", statusInfo.className)}>
                                                    <Icon className="h-4 w-4" />
                                                    <span>{statusInfo.label}</span>
                                                </div>
                                            </TooltipTrigger>
                                            {statusInfo.note && (
                                                <TooltipContent><p>{statusInfo.note}</p></TooltipContent>
                                            )}
                                        </Tooltip>
                                     </TooltipProvider>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

