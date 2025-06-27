'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { PlayerMatchPerformance } from '@/lib/data';
import { format } from 'date-fns';

const chartConfig = {
  runs: {
    label: 'Runs',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface PlayerFormChartProps {
  data: PlayerMatchPerformance[];
}

export function PlayerFormChart({ data }: PlayerFormChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No recent match data available for this player.
            </div>
        );
    }

  const chartData = data.map(item => ({
      name: `${item.opponent}\n${format(item.date, 'dd MMM')}`,
      runs: item.runs,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer>
            <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    interval={0}
                    tick={({ x, y, payload }) => (
                         <text x={x} y={y} dy={16} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={12}>
                            {payload.value.split('\n').map((line:string, index:number) => (
                                <tspan x={x} dy={index * 15} key={index}>{line}</tspan>
                            ))}
                        </text>
                    )}
                    height={40}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
