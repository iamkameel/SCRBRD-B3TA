
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart, Legend } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Innings, LiveScore, Match, RosterMemberWithStats, ShotData } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WagonWheel } from '@/components/wagon-wheel';
import { RunMap } from '@/components/run-map';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// --- Manhattan Chart ---
const manhattanChartConfig = {
    runs: {
        label: 'Runs',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig;

export function ManhattanChart({ data }: { data?: LiveScore | Innings | null }) {
    const chartData = React.useMemo(() => {
        const runsPerOver = Array.from({ length: 20 }, (_, i) => ({ over: i + 1, runs: 0 }));

        if (!data || !('ballHistory' in data)) {
            // For completed scorecards without ball-by-ball history, we can't build this chart.
            return runsPerOver;
        }

        const ballHistory = data.ballHistory || [];
        let currentOverIndex = 0;
        let runsThisOver = 0;

        for (const event of ballHistory) {
            if (event === '|') {
                if (currentOverIndex < 20) {
                    runsPerOver[currentOverIndex].runs = runsThisOver;
                }
                currentOverIndex++;
                runsThisOver = 0;
                continue;
            }

            if (currentOverIndex >= 20) break;

            if (event.toLowerCase().includes('wd') || event.toLowerCase().includes('nb')) {
                const extraRun = parseInt(event.replace(/[^0-9]/g, '')) || 0;
                runsThisOver += 1 + extraRun;
            } else if (!isNaN(parseInt(event))) {
                runsThisOver += parseInt(event);
            }
        }
        
        // Finalize the last full over if the history ends without a '|'
        if (currentOverIndex < 20) {
            runsPerOver[currentOverIndex].runs = runsThisOver;
        }

        // Add the current, incomplete over from live data
        if (data.currentOver && data.currentOver.length > 0 && currentOverIndex < 20) {
             const liveCurrentOverRuns = data.currentOver.reduce((sum, e) => {
                if (e.toLowerCase().includes('wd') || e.toLowerCase().includes('nb')) {
                    const extraRun = parseInt(e.replace(/[^0-9]/g, '')) || 0;
                    return sum + 1 + extraRun;
                }
                if (!isNaN(parseInt(e, 10))) {
                    return sum + parseInt(e, 10);
                }
                return sum;
            }, 0);
            runsPerOver[currentOverIndex].runs += liveCurrentOverRuns;
        }

        return runsPerOver;
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manhattan Graph</CardTitle>
                <CardDescription>Runs per Over</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={manhattanChartConfig} className="min-h-[200px] w-full">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="over" 
                        tickLine={false} 
                        tickMargin={10} 
                        axisLine={false} 
                        label={{ value: 'Over', position: 'insideBottom', offset: -5 }}
                        allowDecimals={false}
                        interval="preserveStartEnd"
                        ticks={[1, 5, 10, 15, 20]}
                    />
                    <YAxis 
                        tickLine={false} 
                        tickMargin={10} 
                        axisLine={false}
                        allowDecimals={false}
                        label={{ value: 'Runs', angle: -90, position: 'insideLeft' }}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
                </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// --- Worm Chart ---
interface WormChartProps {
    match: Match;
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

export function WormChart({ match, scorecard, liveScore, teamAName, teamBName }: WormChartProps) {
    
    const innings1Data = scorecard?.innings1 || (liveScore?.liveInnings === 1 ? liveScore : (liveScore?.liveInnings === 2 ? match.firstInningsLiveScore : null));
    const innings2Data = scorecard?.innings2 || (liveScore?.liveInnings === 2 ? liveScore : null);
    
    const teamAData = processInningsForWormChart(innings1Data);
    const teamBData = processInningsForWormChart(innings2Data);

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
                    <ChartTooltip content={<CustomTooltip />} />
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

// --- Wagon Wheel Card ---
export function WagonWheelCard({ data }: { data?: LiveScore | Innings | null }) {
    const shots = data && 'shots' in data ? data.shots : [];

    return (
         <Card>
            <CardHeader>
                <CardTitle>Wagon Wheel</CardTitle>
                <CardDescription>Shot direction for this innings.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                 <WagonWheel shots={shots || []} />
            </CardContent>
        </Card>
    )
}

// --- Run Map Card ---
interface RunMapCardProps {
    data?: LiveScore | Innings | null;
    roster: RosterMemberWithStats[];
}
export function RunMapCard({ data, roster }: RunMapCardProps) {
    const [selectedBatsman, setSelectedBatsman] = React.useState('team');

    const allShots = (data && 'shots' in data ? data.shots : []) || [];

    const displayedShots = React.useMemo(() => {
        if (selectedBatsman === 'team') {
            return allShots;
        }
        return allShots.filter(shot => shot.batsmanId === selectedBatsman);
    }, [selectedBatsman, allShots]);

    const battersInInnings = React.useMemo(() => {
        const batterIds = new Set(allShots.map(s => s.batsmanId));
        return roster.filter(p => batterIds.has(p.personId));
    }, [allShots, roster]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                        <CardTitle>Run Map</CardTitle>
                        <CardDescription>Scoring distribution.</CardDescription>
                    </div>
                    <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select batsman..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="team">Team</SelectItem>
                            {battersInInnings.map(player => (
                                <SelectItem key={player.personId} value={player.personId}>
                                    {player.personName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <RunMap shots={displayedShots} />
            </CardContent>
        </Card>
    )
}
