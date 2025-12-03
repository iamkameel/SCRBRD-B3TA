'use client';

import * as React from 'react';
import type { Person, PlayerTrackerData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { PerformanceTimelineChart, SkillRadarChart } from './tracker-charts';
import { WagonWheel } from '@/components/wagon-wheel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Heart, Dumbbell, Shield, Check, CalendarDays, Milestone as MilestoneIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RunMap } from '@/components/run-map';

function AvailabilityCalendarCaption({ displayMonth, onMonthChange }: { displayMonth: Date, onMonthChange: (date: Date) => void }) {
    const handleMonthChange = (value: string) => {
        const newMonth = new Date(displayMonth);
        newMonth.setMonth(parseInt(value, 10));
        onMonthChange(newMonth);
    };

    const handleYearChange = (value: string) => {
        const newYear = new Date(displayMonth);
        newYear.setFullYear(parseInt(value, 10));
        onMonthChange(newYear);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i.toString(),
        label: format(new Date(0, i), 'MMMM')
    }));

    return (
        <div className="flex justify-between items-center p-2">
            <Button variant="ghost" size="icon" onClick={() => onMonthChange(new Date(new Date(displayMonth).setMonth(displayMonth.getMonth() - 1)))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
                <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[120px] focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-[90px] focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onMonthChange(new Date(new Date(displayMonth).setMonth(displayMonth.getMonth() + 1)))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

function AvailabilityCalendar({ unavailableDays }: { unavailableDays: Date[] }) {
    const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date());

    return (
        <DayPicker
            mode="multiple"
            selected={unavailableDays}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            showOutsideDays
            fixedWeeks
            className="w-full"
            classNames={{
                root: 'p-0',
                months: 'w-full',
                month: 'w-full space-y-2',
                caption: 'hidden',
                table: 'w-full border-collapse',
                head_row: 'flex w-full mt-2',
                head_cell: 'w-full p-2 text-xs font-semibold text-muted-foreground uppercase',
                row: 'flex w-full mt-2',
                cell: cn('w-full h-9 text-sm text-center p-0 relative rounded-md'),
                day: 'w-full h-full flex items-center justify-center p-2 rounded-md transition-colors hover:bg-muted-foreground/10',
                day_today: 'text-primary-foreground font-bold bg-primary',
                day_outside: 'text-muted-foreground opacity-50',
                day_selected: 'bg-destructive/20 text-destructive-foreground opacity-100 hover:bg-destructive/30 focus:bg-destructive/30',
                day_disabled: 'text-muted-foreground opacity-30',
            }}
            components={{
                Caption: () => <AvailabilityCalendarCaption displayMonth={displayMonth} onMonthChange={setDisplayMonth} />,
            }}
        />
    );
}


function InfoCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-4 rounded-lg border p-3">
            <Icon className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </div>
    );
}

export function PlayerTrackerTab({ person, trackerData }: { person: Person, trackerData: PlayerTrackerData }) {
    const { performanceEntries, skillRatings, trainingLogs, injuryRecords, availability, milestones, runMap } = trackerData;
    
    // Find the latest performance entry for wagon wheel
    const latestPerformance = performanceEntries.length > 0 ? performanceEntries[performanceEntries.length - 1] : null;

    // Get unavailable dates for calendar
    const unavailableDays = availability.map(a => a.startDate);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Timeline</CardTitle>
                        <CardDescription>Runs and wickets over the last few matches.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PerformanceTimelineChart data={performanceEntries} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                         <CardHeader>
                            <CardTitle>Wagon Wheel</CardTitle>
                            <CardDescription>Scoring areas from the last match.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            {latestPerformance?.wagonWheel ? (
                                <WagonWheel shots={latestPerformance.wagonWheel} onShotSelect={() => {}} disabled />
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No shot data available.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle>Run Map</CardTitle>
                            <CardDescription>Career scoring percentages.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <RunMap shots={performanceEntries.flatMap(p => p.wagonWheel || [])} />
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                            <CardTitle>Skill Radar</CardTitle>
                            <CardDescription>Current assessed skill levels.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <SkillRadarChart data={skillRatings} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 xl:col-span-1 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {milestones.length > 0 ? milestones.map(m => (
                            <div key={m.milestoneId} className="flex items-center gap-3 text-sm">
                                <MilestoneIcon className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">{m.name}</p>
                                    <p className="text-xs text-muted-foreground">{format(m.achievedDate, 'PPP')}</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-muted-foreground py-4">No milestones achieved yet.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Training Logs</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48">
                             <div className="space-y-4">
                                {trainingLogs.length > 0 ? trainingLogs.map(log => (
                                    <div key={log.logId} className="text-sm">
                                        <div className="flex justify-between">
                                            <p className="font-semibold">{log.drillType}</p>
                                            <p className="text-muted-foreground">{format(log.date, 'dd MMM')}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{log.durationMins} minutes</p>
                                        {log.coachNotes && <p className="text-xs italic text-muted-foreground mt-1">"{log.coachNotes}"</p>}
                                    </div>
                                )) : <p className="text-sm text-center text-muted-foreground py-4">No training logs recorded.</p>}
                             </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Injury History</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-40">
                             <div className="space-y-4">
                                {injuryRecords.length > 0 ? injuryRecords.map(record => (
                                    <div key={record.recordId} className="flex items-center gap-3 text-sm">
                                        <Heart className="h-5 w-5 text-destructive" />
                                        <div>
                                            <p className="font-semibold">{record.injuryType} <Badge variant="outline">{record.severity}</Badge></p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(record.startDate, 'dd MMM yy')} - {record.endDate ? format(record.endDate, 'dd MMM yy') : 'Ongoing'}
                                            </p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-center text-muted-foreground py-4">No injury history.</p>}
                             </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Availability Calendar</CardTitle></CardHeader>
                    <CardContent>
                        <AvailabilityCalendar unavailableDays={unavailableDays} />
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
