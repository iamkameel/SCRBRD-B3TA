'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Partnership } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PartnershipCardProps {
    partnerships: Partnership[] | undefined;
}

function PartnershipRow({ partnership }: { partnership: Partnership }) {
    const {
        batsman1Name,
        batsman2Name,
        totalRuns,
        totalBalls,
        batsman1Runs,
        batsman1Balls,
        batsman2Runs,
        batsman2Balls
    } = partnership;

    const contribution1 = totalRuns > 0 ? (batsman1Runs / totalRuns) * 100 : 50;
    const contribution2 = totalRuns > 0 ? (batsman2Runs / totalRuns) * 100 : 50;

    return (
        <div className="py-4 border-b last:border-b-0">
            <div className="flex justify-center items-center mb-2">
                <p className="font-bold text-2xl text-primary">{totalRuns}</p>
                <p className="ml-2 text-sm text-muted-foreground">({totalBalls} balls)</p>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
                <TooltipProvider>
                    <div className="flex h-full">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div 
                                    className="bg-chart-1 rounded-l-full" 
                                    style={{ width: `${contribution1}%` }}
                                ></div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{batsman1Name}: {batsman1Runs} ({batsman1Balls})</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div 
                                    className="bg-chart-2 rounded-r-full" 
                                    style={{ width: `${contribution2}%` }}
                                ></div>
                             </TooltipTrigger>
                             <TooltipContent>
                                <p>{batsman2Name}: {batsman2Runs} ({batsman2Balls})</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
                    <div>
                        <p className="font-semibold">{batsman1Name}</p>
                        <p className="text-muted-foreground">{batsman1Runs} ({batsman1Balls})</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="font-semibold">{batsman2Name}</p>
                        <p className="text-muted-foreground">{batsman2Runs} ({batsman2Balls})</p>
                    </div>
                    <div className="h-2.5 w-2.5 rounded-full bg-chart-2" />
                </div>
            </div>
        </div>
    );
}


export function PartnershipCard({ partnerships }: PartnershipCardProps) {
    if (!partnerships || partnerships.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users />Partnerships</CardTitle>
                    <CardDescription>All partnerships for this innings.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>No partnership data available yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users />Partnerships</CardTitle>
                <CardDescription>All partnerships for this innings.</CardDescription>
            </CardHeader>
            <CardContent>
                {partnerships.map((p, index) => (
                    <PartnershipRow key={index} partnership={p} />
                ))}
            </CardContent>
        </Card>
    );
}