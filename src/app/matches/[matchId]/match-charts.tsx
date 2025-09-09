

'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart, Legend, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Dot } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Innings, LiveScore, Match, RosterMemberWithStats, ShotData, RunMapData } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WagonWheel } from '@/components/wagon-wheel';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RunMap } from '@/components/run-map';

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

        if (!data) {
             return runsPerOver;
        }

        const processBallHistory = (history: string[] = []) => {
            let overIndex = 0;
            let currentOverRuns = 0;
            
            for (const event of history) {
                if (event === '|') {
                    if(overIndex < 20) {
                        runsPerOver[overIndex].runs = currentOverRuns;
                        overIndex++;
                        currentOverRuns = 0;
                    }
                    continue;
                }

                if (overIndex >= 20) break;

                const extras = event.match(/(\d+)?(wd|nb)/i);
                if (extras) {
                    currentOverRuns += 1 + (parseInt(extras[1] || '0', 10));
                } else if (!isNaN(parseInt(event, 10))) {
                    currentOverRuns += parseInt(event, 10);
                }
            }
             if (overIndex < 20) {
                runsPerOver[overIndex].runs = currentOverRuns;
            }
        };

        const processCurrentOver = (currentOver: string[] = [], overNumber: number) => {
            if (overNumber > 20) return;
            const overIndex = overNumber - 1;
            
            const liveCurrentOverRuns = currentOver.reduce((sum, e) => {
                const extras = e.match(/(\d+)?(wd|nb)/i);
                if (extras) {
                    return sum + 1 + (parseInt(extras[1] || '0', 10));
                }
                if (!isNaN(parseInt(e, 10))) {
                    return sum + parseInt(e, 10);
                }
                return sum;
            }, 0);
            runsPerOver[overIndex].runs += liveCurrentOverRuns;
        };

        if ('ballHistory' in data && data.ballHistory) {
            processBallHistory(data.ballHistory);
        } else if ('battingCard' in data) {
            // Fallback for Innings data without ballHistory
            // This is a rough estimation and may not be perfect.
            const totalOvers = Math.floor(data.overs);
            if (totalOvers > 0) {
              const avgRunsPerOver = data.totalRuns / totalOvers;
              for (let i = 0; i < totalOvers && i < 20; i++) {
                runsPerOver[i].runs = Math.round(avgRunsPerOver);
              }
            }
        }
        
        if ('currentOver' in data && data.currentOver && data.overs !== undefined) {
            processCurrentOver(data.currentOver, data.overs + 1);
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
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Over {data.over.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            {payload.map((p: any) => (
                <span key={p.dataKey} className="font-bold" style={{color: p.color}}>
                    {p.value}
                    {data.wicket && p.dataKey === data.wicket.team && `/${data.wicket.wickets}`}
                </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomizedWicketDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;

    if (payload.wicket && payload.wicket.team === dataKey) {
        return <Dot cx={cx} cy={cy} r={4} fill={props.stroke} stroke="#fff" strokeWidth={1} />;
    }

    return null;
};


const processInningsForWormChart = (innings: Innings | LiveScore | null, teamKey: 'teamA' | 'teamB') => {
    if (!innings || !('ballHistory' in innings)) return [];
    
    const data: { over: number; score: number; wicket?: { team: 'teamA' | 'teamB', wickets: number } }[] = [{ over: 0, score: 0 }];
    const ballHistory = innings.ballHistory ?? [];
    
    let cumulativeScore = 0;
    let cumulativeWickets = 0;
    let ballsThisOver = 0;
    let oversCompleted = 0;

    for (const event of ballHistory) {
        if (event === '|') continue;

        let runsThisBall = 0;
        let isWicket = false;
        let isLegalDelivery = !event.toLowerCase().includes('wd') && !event.toLowerCase().includes('nb');

        if (event === 'W') {
            isWicket = true;
            cumulativeWickets++;
        } else if (event.toLowerCase().includes('wd')) {
            runsThisBall = 1 + (parseInt(event.replace(/[^0-9]/g, ''), 10) || 0);
        } else if (event.toLowerCase().includes('nb')) {
            runsThisBall = 1 + (parseInt(event.replace(/[^0-9]/g, ''), 10) || 0);
        } else if (!isNaN(parseInt(event))) {
            runsThisBall = parseInt(event);
        }
        
        cumulativeScore += runsThisBall;

        if (isLegalDelivery) {
            ballsThisOver++;
            const currentOverProgress = oversCompleted + ballsThisOver / 10;
            const newDataPoint: any = {
                over: currentOverProgress,
                score: cumulativeScore,
            };
             if (isWicket) {
                newDataPoint.wicket = { wickets: cumulativeWickets, team: teamKey };
            }
            data.push(newDataPoint);
            
            if (ballsThisOver === 6) {
                oversCompleted++;
                ballsThisOver = 0;
            }
        }
    }
    return data;
};


export function WormChart({ match, scorecard, liveScore, teamAName, teamBName }: WormChartProps) {
    
    const firstInningsData = scorecard?.innings1 || (liveScore?.liveInnings === 1 ? liveScore : match.firstInningsLiveScore);
    const secondInningsData = scorecard?.innings2 || (liveScore?.liveInnings === 2 ? liveScore : null);
    
    const firstInningsTeamKey = firstInningsData?.teamName === teamAName ? 'teamA' : 'teamB';
    const secondInningsTeamKey = secondInningsData?.teamName === teamAName ? 'teamA' : 'teamB';

    const firstInningsWorm = processInningsForWormChart(firstInningsData, firstInningsTeamKey);
    const secondInningsWorm = processInningsForWormChart(secondInningsData, secondInningsTeamKey);

    const combinedData = [];
    const maxLength = Math.max(firstInningsWorm.length, secondInningsWorm.length);
    for (let i = 0; i < maxLength; i++) {
        const firstPoint = firstInningsWorm[i] || firstInningsWorm[firstInningsWorm.length - 1];
        const secondPoint = secondInningsWorm[i] || secondInningsWorm[secondInningsWorm.length - 1];

        const dataPoint: any = {
            over: Math.max(firstPoint?.over || 0, secondPoint?.over || 0),
        };
        
        dataPoint[firstInningsTeamKey] = firstPoint?.score;
        dataPoint[secondInningsTeamKey] = secondPoint?.score;
        
        if (firstPoint?.wicket) {
            dataPoint.wicket = firstPoint.wicket;
        } else if (secondPoint?.wicket) {
            dataPoint.wicket = secondPoint.wicket;
        }
        
        combinedData.push(dataPoint);
    }


    const wormChartConfig = {
        teamA: { label: teamAName, color: 'hsl(var(--chart-1))' },
        teamB: { label: teamBName, color: 'hsl(var(--chart-2))' },
    } satisfies ChartConfig;


    return (
        <Card>
            <CardHeader><CardTitle>Worm Graph</CardTitle><CardDescription>Scoring comparison</CardDescription></CardHeader>
            <CardContent>
                <ChartContainer config={wormChartConfig} className="min-h-[200px] w-full">
                <LineChart data={combinedData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="over" 
                        type="number" 
                        domain={[0, 20]} 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8} 
                        label={{ value: 'overs', position: 'insideBottomLeft', offset: -5 }} 
                        ticks={[0, 5, 10, 15, 20]}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <RechartsTooltip content={<CustomTooltip />} />
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
                    <Line type="monotone" dataKey="teamA" stroke="var(--color-teamA)" strokeWidth={2} dot={<CustomizedWicketDot />} name={teamAName} connectNulls />
                    <Line type="monotone" dataKey="teamB" stroke="var(--color-teamB)" strokeWidth={2} dot={<CustomizedWicketDot />} name={teamBName} connectNulls />
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
const runMapConfig = {
    runs: {
        label: "Runs",
    },
} satisfies ChartConfig;

export function RunMapCard({ data, roster }: { data?: LiveScore | Innings | null, roster: RosterMemberWithStats[] }) {
    const [selectedBatsman, setSelectedBatsman] = React.useState('team');
    
    const allShots = (data && 'shots' in data ? data.shots : []) || [];
    
    const battersInInnings = React.useMemo(() => {
        const batterIds = new Set(allShots.map(s => s.batsmanId));
        return roster.filter(p => batterIds.has(p.personId));
    }, [allShots, roster]);

    const displayedShots = React.useMemo(() => {
        if (selectedBatsman === 'team') return allShots;
        return allShots.filter(shot => shot.batsmanId === selectedBatsman);
    }, [selectedBatsman, allShots]);

    const runMapData: RunMapData = React.useMemo(() => {
        const runMap: RunMapData = { fineLeg: 0, squareLeg: 0, midWicket: 0, longOn: 0, cover: 0, point: 0, thirdMan: 0, longOff: 0 };
        let totalRuns = 0;
        
        displayedShots.forEach(shot => {
            totalRuns += shot.runs;
            const angle = shot.angle;

            if (angle >= 337.5 || angle < 22.5) runMap.point += shot.runs;
            else if (angle >= 22.5 && angle < 67.5) runMap.cover += shot.runs;
            else if (angle >= 67.5 && angle < 112.5) runMap.longOff += shot.runs;
            else if (angle >= 112.5 && angle < 157.5) runMap.longOn += shot.runs;
            else if (angle >= 157.5 && angle < 202.5) runMap.midWicket += shot.runs;
            else if (angle >= 202.5 && angle < 247.5) runMap.squareLeg += shot.runs;
            else if (angle >= 247.5 && angle < 292.5) runMap.fineLeg += shot.runs;
            else if (angle >= 292.5 && angle < 337.5) runMap.thirdMan += shot.runs;
        });

        if (totalRuns > 0) {
            Object.keys(runMap).forEach(key => {
                runMap[key as keyof RunMapData] = Math.round((runMap[key as keyof RunMapData] / totalRuns) * 100);
            });
            
            let currentTotal = Object.values(runMap).reduce((sum, val) => sum + val, 0);
            if (currentTotal !== 100 && currentTotal > 0) {
                runMap.cover += (100 - currentTotal);
            }
        }
        return runMap;
    }, [displayedShots]);

    const chartData = Object.entries(runMapData).map(([name, value]) => ({ name, runs: value }));

    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Run Map</CardTitle>
                        <CardDescription>Scoring distribution.</CardDescription>
                    </div>
                    <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
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
            <CardContent>
                <RunMap shots={displayedShots} />
            </CardContent>
        </Card>
    );
}






