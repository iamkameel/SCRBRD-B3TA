
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart, Pie, PieChart, Legend, Tooltip } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Innings, LiveScore } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WagonWheel } from '@/components/wagon-wheel';

// --- Manhattan Chart ---
const manhattanChartConfig = {
    runs: {
        label: 'Runs',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig;

export function ManhattanChart({ liveScore }: { liveScore?: LiveScore | null }) {
    const chartData = React.useMemo(() => {
        if (!liveScore?.ballHistory) return [];

        const runsPerOver: { over: number, runs: number }[] = [];
        let currentOver = 1;
        let currentOverRuns = 0;

        for (const event of liveScore.ballHistory) {
            if (event === '|') {
                runsPerOver.push({ over: currentOver, runs: currentOverRuns });
                currentOver++;
                currentOverRuns = 0;
                continue;
            }

            if (event.toLowerCase().includes('wd') || event.toLowerCase().includes('nb')) {
                currentOverRuns += 1 + (parseInt(event.replace(/[^0-9]/g, ''), 10) || 0);
            } else if (!isNaN(parseInt(event))) {
                currentOverRuns += parseInt(event);
            }
        }
        // Add the current, incomplete over
        if(liveScore.currentOver && liveScore.currentOver.length > 0) {
             currentOverRuns = liveScore.currentOver.reduce((sum, e) => {
                if (e.toLowerCase().includes('wd') || e.toLowerCase().includes('nb')) {
                    const extraRun = parseInt(e.replace(/[^0-9]/g, '')) || 0;
                    return sum + 1 + extraRun;
                }
                if (!isNaN(parseInt(e, 10))) {
                    return sum + parseInt(e, 10);
                }
                return sum;
            }, 0);
             runsPerOver.push({ over: currentOver, runs: currentOverRuns });
        }


        return runsPerOver;
    }, [liveScore]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manhattan Graph</CardTitle>
                <CardDescription>Runs per Over</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ChartContainer config={manhattanChartConfig} className="min-h-[200px] w-full">
                    <BarChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="over" tickLine={false} tickMargin={10} axisLine={false} label={{ value: 'Over', position: 'insideBottom', offset: -5 }} />
                        <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                        No scoring data available yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// --- Worm Chart ---
interface WormChartProps {
    scorecard: { innings1: Innings, innings2: Innings } | null;
    liveScore?: LiveScore | null;
    teamAName: string;
    teamBName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const teamAData = data.teamA || { score: 0, wickets: 0 };
    const teamBData = data.teamB || { score: 0, wickets: 0 };
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Over {data.over}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-bold text-foreground">{teamAData.score}/{teamAData.wickets}</span>
            <span className="font-bold text-foreground">{teamBData.score}/{teamBData.wickets}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const processInningsForWormChart = (innings: Innings | LiveScore | null) => {
    if (!innings) return Array(21).fill({ score: 0, wickets: 0 });
    
    const isLive = 'ballHistory' in innings;
    let ballHistory = isLive ? innings.ballHistory ?? [] : [];

    if (!isLive && 'fallOfWickets' in innings) {
        // Mock ball history for completed scorecard for now
        let tempScore = 0;
        for (let i = 0; i < innings.overs; i++) {
            const runsThisOver = Math.floor(innings.totalRuns / innings.overs);
            tempScore += runsThisOver;
            for(let j=0; j<6; j++) ballHistory.push(Math.floor(runsThisOver / 6).toString());
            ballHistory.push('|');
        }
    }

    let cumulativeScore = 0;
    let cumulativeWickets = 0;
    let data: { score: number, wickets: number }[] = [{ score: 0, wickets: 0 }];
    let over = 1;

    for (const event of ballHistory) {
        if (event === '|') {
            data[over] = { score: cumulativeScore, wickets: cumulativeWickets };
            over++;
            continue;
        }

        if (event === 'W') {
            cumulativeWickets++;
        } else if (event.toLowerCase().includes('wd') || event.toLowerCase().includes('nb')) {
            cumulativeScore += 1 + (parseInt(event.replace(/[^0-9]/g, ''), 10) || 0);
        } else if (!isNaN(parseInt(event))) {
            cumulativeScore += parseInt(event);
        }
    }
    
    // Add current over if live
    if (isLive && innings.currentOver && innings.currentOver.length > 0) {
        const currentOverRuns = innings.currentOver.reduce((sum, e) => {
            if (e.toLowerCase().includes('wd') || e.toLowerCase().includes('nb')) return sum + 1 + (parseInt(e.replace(/[^0-9]/g, '')) || 0);
            if (!isNaN(parseInt(e))) return sum + parseInt(e);
            return sum;
        }, 0);
        data[over] = { score: cumulativeScore + currentOverRuns, wickets: cumulativeWickets };
    }
    
    while(data.length < 21) data.push(data[data.length-1]);
    
    return data;
};

export function WormChart({ scorecard, liveScore, teamAName, teamBName }: WormChartProps) {
    
    const teamAData = processInningsForWormChart(scorecard?.innings1 || (liveScore?.liveInnings === 1 ? liveScore : null));
    const teamBData = processInningsForWormChart(scorecard?.innings2 || (liveScore?.liveInnings === 2 ? liveScore : null));

    const chartData = Array.from({ length: 21 }, (_, i) => ({
        over: i,
        teamA: teamAData[i],
        teamB: teamBData[i],
    }));

    const wormChartConfig = {
        teamA: { label: teamAName, color: 'hsl(var(--chart-1))' },
        teamB: { label: teamBName, color: 'hsl(var(--chart-2))' },
    } satisfies ChartConfig;


    return (
        <Card>
            <CardHeader><CardTitle>Worm Graph</CardTitle><CardDescription>Scoring comparison</CardDescription></CardHeader>
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
export function WagonWheelSummary({ liveScore }: { liveScore?: LiveScore | null }) {
    return (
         <Card>
            <CardHeader><CardTitle>Wagon Wheel</CardTitle><CardDescription>Live scoring areas</CardDescription></CardHeader>
            <CardContent>
                <div className="flex justify-center">
                     <WagonWheel onShotSelect={() => {}} shots={liveScore?.shots || []} disabled />
                </div>
            </CardContent>
        </Card>
    )
}
