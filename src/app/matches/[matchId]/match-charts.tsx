
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart, Pie, PieChart, Legend, Tooltip } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Innings } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
interface WormChartProps {
    scorecard: { innings1: Innings, innings2: Innings };
    teamAName: string;
    teamBName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {data.over} overs
            </span>
            <span className="font-bold text-muted-foreground">
              -
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-bold text-foreground">{data.teamA.score}/{data.teamA.wickets}</span>
            <span className="font-bold text-foreground">{data.teamB.score}/{data.teamB.wickets}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function WormChart({ scorecard, teamAName, teamBName }: WormChartProps) {
    const processInnings = (innings: Innings) => {
        let cumulativeScore = 0;
        let cumulativeWickets = 0;
        const data: { score: number, wickets: number }[] = [{ score: 0, wickets: 0 }];
        for (let over = 1; over <= 20; over++) {
            const fowInOver = innings.fallOfWickets.filter(fow => Math.floor(fow.over) + 1 === over);
            cumulativeWickets += fowInOver.length;

            const runsThisOver = Math.floor(Math.random() * 12) + 4; // Simulate runs
            cumulativeScore += runsThisOver;
            
            data.push({ score: cumulativeScore, wickets: cumulativeWickets });
        }
        return data;
    };
    
    const teamAData = processInnings(scorecard.innings1.teamName === teamAName ? scorecard.innings1 : scorecard.innings2);
    const teamBData = processInnings(scorecard.innings1.teamName === teamBName ? scorecard.innings1 : scorecard.innings2);

    const chartData = Array.from({ length: 21 }, (_, i) => ({
        over: i,
        teamA: teamAData[i] || { score: 0, wickets: 0 },
        teamB: teamBData[i] || { score: 0, wickets: 0 },
    }));

    const wormChartConfig = {
        teamA: { label: teamAName, color: 'hsl(var(--chart-1))' },
        teamB: { label: teamBName, color: 'hsl(var(--chart-2))' },
    } satisfies ChartConfig;


    return (
        <Card>
            <CardHeader><CardTitle>Worm graph</CardTitle><CardDescription>Scoring comparison</CardDescription></CardHeader>
            <CardContent>
                <ChartContainer config={wormChartConfig} className="min-h-[200px] w-full">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} label={{ value: 'overs', position: 'insideBottomLeft', offset: -5 }} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        content={({ payload }) => (
                            <div className="flex gap-4">
                                {payload?.map((entry, index) => (
                                    <div key={`item-${index}`} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-xs text-muted-foreground">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                    <Line type="monotone" dataKey="teamA.score" stroke="var(--color-teamA)" strokeWidth={2} dot={false} name={teamAName} />
                    <Line type="monotone" dataKey="teamB.score" stroke="var(--color-teamB)" strokeWidth={2} dot={false} name={teamBName} />
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
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="runs" hideLabel />} />
                        <Pie data={chartData} dataKey="runs" nameKey="side" />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
