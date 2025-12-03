'use client';

import * as React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { PerformanceEntry, SkillRating } from '@/lib/data';
import { format } from 'date-fns';

const performanceChartConfig = {
    runs: { label: 'Runs', color: 'hsl(var(--chart-1))' },
    wickets: { label: 'Wickets', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

export function PerformanceTimelineChart({ data }: { data: PerformanceEntry[] }) {
    if (!data || data.length === 0) return null;

    const chartData = data.map(entry => ({
        date: format(entry.date, 'dd MMM'),
        runs: entry.runs,
        wickets: entry.wickets,
    })).reverse();

    return (
        <ChartContainer config={performanceChartConfig} className="min-h-[200px] w-full">
            <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value} />
                <YAxis yAxisId="left" orientation="left" stroke="var(--color-runs)" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-wickets)" />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area yAxisId="left" type="monotone" dataKey="runs" fill="var(--color-runs)" fillOpacity={0.4} stroke="var(--color-runs)" stackId="a" />
                <Area yAxisId="right" type="monotone" dataKey="wickets" fill="var(--color-wickets)" fillOpacity={0.4} stroke="var(--color-wickets)" stackId="b" />
            </AreaChart>
        </ChartContainer>
    );
}


const skillRadarChartConfig = {
    current: { label: 'Current', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

export function SkillRadarChart({ data }: { data: SkillRating[] }) {
    if (!data || data.length === 0) return null;

    const latestRating = data[data.length - 1];
    const chartData = [
        { skill: 'Batting', current: latestRating.batting },
        { skill: 'Bowling', current: latestRating.bowling },
        { skill: 'Fielding', current: latestRating.fielding },
        { skill: 'Fitness', current: latestRating.fitness },
    ];

    return (
        <ChartContainer config={skillRadarChartConfig} className="mx-auto aspect-square h-full w-full">
            <RadarChart data={chartData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="skill" />
                <PolarGrid />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Current" dataKey="current" fill="var(--color-current)" fillOpacity={0.6} stroke="var(--color-current)" />
            </RadarChart>
        </ChartContainer>
    );
}
