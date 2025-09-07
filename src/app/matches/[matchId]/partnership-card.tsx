
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Partnership } from '@/lib/data';

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

    const contribution1 = totalRuns > 0 ? (batsman1Runs / totalRuns) * 100 : 0;

    return (
        <div className="py-3 border-b last:border-b-0">
            <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-left">
                    <p className="font-semibold">{batsman1Name}</p>
                    <p className="text-sm text-muted-foreground">{batsman1Runs} ({batsman1Balls})</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-lg">{totalRuns}</p>
                    <p className="text-xs text-muted-foreground">({totalBalls} balls)</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{batsman2Name}</p>
                    <p className="text-sm text-muted-foreground">{batsman2Runs} ({batsman2Balls})</p>
                </div>
            </div>
            <Progress value={contribution1} className="mt-2 h-2" />
        </div>
    );
}

export function PartnershipCard({ partnerships }: PartnershipCardProps) {
    if (!partnerships || partnerships.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Partnerships</CardTitle>
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
                <CardTitle>Partnerships</CardTitle>
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
