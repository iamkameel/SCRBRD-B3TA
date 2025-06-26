'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { StandingTeam } from '@/lib/actions/dashboard';
import type { LeaderboardPlayer } from '@/lib/actions/dashboard';

// --- Team Standings Chart ---
const teamStandingsChartConfig = {
  matchesWon: {
    label: 'Wins',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface TeamStandingsChartProps {
  data: StandingTeam[];
}

export function TeamStandingsChart({ data }: TeamStandingsChartProps) {
    if (!data || data.length === 0) return null;

  const chartData = data.map(team => ({
      name: team.name,
      matchesWon: team.stats.matchesWon,
  }));

  return (
    <ChartContainer config={teamStandingsChartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
         <YAxis allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="matchesWon" fill="var(--color-matchesWon)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

// --- Top Run Scorers Chart ---
const topRunScorersChartConfig = {
    totalRuns: {
        label: 'Runs',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig;

interface TopRunScorersChartProps {
    data: LeaderboardPlayer[];
}

export function TopRunScorersChart({ data }: TopRunScorersChartProps) {
    if (!data || data.length === 0) return null;

    const chartData = data.map(player => ({
        name: `${player.firstName.charAt(0)}. ${player.lastName}`,
        totalRuns: player.stats.totalRuns,
    }));

    return (
        <ChartContainer config={topRunScorersChartConfig} className="min-h-[160px] w-full">
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={80}
                />
                <XAxis dataKey="totalRuns" type="number" hide />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="totalRuns" layout="vertical" fill="var(--color-totalRuns)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}

// --- Top Wicket Takers Chart ---
const topWicketTakersChartConfig = {
    wicketsTaken: {
        label: 'Wickets',
        color: 'hsl(var(--chart-3))',
    },
} satisfies ChartConfig;

interface TopWicketTakersChartProps {
    data: LeaderboardPlayer[];
}

export function TopWicketTakersChart({ data }: TopWicketTakersChartProps) {
    if (!data || data.length === 0) return null;
    
    const chartData = data.map(player => ({
        name: `${player.firstName.charAt(0)}. ${player.lastName}`,
        wicketsTaken: player.stats.wicketsTaken,
    }));

    return (
        <ChartContainer config={topWicketTakersChartConfig} className="min-h-[160px] w-full">
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={80}
                />
                <XAxis dataKey="wicketsTaken" type="number" hide />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="wicketsTaken" layout="vertical" fill="var(--color-wicketsTaken)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
