
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { LeaderboardPlayer } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// --- Manhattan Chart ---
const manhattanChartConfig = {
    runRate: {
        label: 'Run Rate',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig;

export function ManhattanChart() {
    // Placeholder data
    const data = [
        { over: 1, runRate: 6.0 }, { over: 2, runRate: 8.0 }, { over: 3, runRate: 5.0 },
        { over: 4, runRate: 12.0 }, { over: 5, runRate: 9.0 }, { over: 6, runRate: 7.0 },
    ];
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manhattan Graph</CardTitle>
                <CardDescription>Run Rate per Over</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={manhattanChartConfig} className="min-h-[200px] w-full">
                <BarChart data={data}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="over" tickLine={false} tickMargin={10} axisLine={false} label={{ value: 'Over', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="runRate" fill="var(--color-runRate)" radius={4} />
                </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// --- Worm Chart ---
const wormChartConfig = {
    teamA: { label: 'Team A', color: 'hsl(var(--chart-1))' },
    teamB: { label: 'Team B', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export function WormChart() {
    // Placeholder data
    const data = [
        { over: 0, teamA: 0, teamB: 0 }, { over: 1, teamA: 6, teamB: 8 },
        { over: 2, teamA: 14, teamB: 15 }, { over: 3, teamA: 19, teamB: 25 },
        { over: 4, teamA: 31, teamB: 33 }, { over: 5, teamA: 40, teamB: 45 },
    ];
    return (
        <Card>
            <CardHeader><CardTitle>Worm Chart</CardTitle><CardDescription>Cumulative Score vs. Over</CardDescription></CardHeader>
            <CardContent>
                <ChartContainer config={wormChartConfig} className="min-h-[200px] w-full">
                <LineChart data={data}>
                    <CartesianGrid horizontal={true} vertical={false} />
                    <XAxis dataKey="over" tickLine={false} tickMargin={10} axisLine={false} label={{ value: 'Over', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="teamA" stroke="var(--color-teamA)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="teamB" stroke="var(--color-teamB)" strokeWidth={2} dot={false} />
                </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// --- Wagon Wheel Summary ---
const wagonWheelConfig = {
  runs: {
    label: "Runs",
  },
  offSide: {
    label: "Off Side",
    color: "hsl(var(--chart-1))",
  },
  legSide: {
    label: "Leg Side",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function WagonWheelSummary() {
    // Placeholder Data
    const chartData = [
      { side: "Off Side", runs: 102, fill: "var(--color-offSide)" },
      { side: "Leg Side", runs: 78, fill: "var(--color-legSide)" },
    ]
    return (
         <Card>
            <CardHeader><CardTitle>Wagon Wheel Summary</CardTitle><CardDescription>Runs by scoring area</CardDescription></CardHeader>
            <CardContent>
                <ChartContainer config={wagonWheelConfig} className="mx-auto aspect-square max-h-[250px]">
                    <Recharts.PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="runs" hideLabel />} />
                        <Recharts.Pie data={chartData} dataKey="runs" nameKey="side" />
                    </Recharts.PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
