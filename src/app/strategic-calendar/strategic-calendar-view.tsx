
'use client';

import * as React from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { DayPicker, type DayProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Match } from '@/lib/data';
import { cn } from '@/lib/utils';

export const competitionTypeColors: { [key: string]: string } = {
    'Cup': 'bg-green-500',
    'League': 'bg-blue-500',
    'Tournament': 'bg-purple-500',
    'Friendlies': 'bg-red-500',
    'Festival': 'bg-orange-500',
};

interface StrategicCalendarViewProps {
    matches: Match[];
    selectedDate: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    displayMonth: Date;
    onMonthChange: (date: Date) => void;
}

function CustomDay(props: DayProps & { matchesOnDay: Match[] }) {
    const { date, displayMonth } = props;
    const matchesOnDay = props.matchesOnDay.filter(m => isSameDay(m.dateTime, date));
    
    // Only render dots if it's the current display month
    const isCurrentMonth = date.getMonth() === displayMonth.getMonth();

    return (
        <div className="relative h-full w-full">
            <DayPicker.Day {...props} />
            {isCurrentMonth && matchesOnDay.length > 0 && (
                 <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1">
                    {matchesOnDay.slice(0, 3).map(match => (
                        <div
                            key={match.matchId}
                            className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                competitionTypeColors[match.competitionName || 'Friendlies'] || 'bg-gray-400'
                            )}
                        />
                    ))}
                 </div>
            )}
        </div>
    );
}

function CustomCaption(props: { displayMonth: Date, onMonthChange: (date: Date) => void }) {
    const { displayMonth, onMonthChange } = props;
    
    const handlePreviousClick = () => {
        const newMonth = new Date(displayMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        onMonthChange(newMonth);
    };

    const handleNextClick = () => {
        const newMonth = new Date(displayMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        onMonthChange(newMonth);
    };

    return (
        <div className="flex justify-between items-center p-2">
            <Button variant="ghost" size="icon" onClick={handlePreviousClick}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold">
                {format(displayMonth, 'MMMM yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextClick}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}


export function StrategicCalendarView({ matches, selectedDate, onDateSelect, displayMonth, onMonthChange }: StrategicCalendarViewProps) {
    const matchesByDay = React.useMemo(() => {
        const map = new Map<string, Match[]>();
        matches.forEach(match => {
            const dayKey = format(match.dateTime, 'yyyy-MM-dd');
            if (!map.has(dayKey)) {
                map.set(dayKey, []);
            }
            map.get(dayKey)!.push(match);
        });
        return map;
    }, [matches]);

    return (
        <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            month={displayMonth}
            onMonthChange={onMonthChange}
            showOutsideDays
            fixedWeeks
            className="w-full"
            classNames={{
                root: 'bg-card p-3 rounded-lg border',
                months: 'w-full',
                month: 'w-full space-y-2',
                caption: 'hidden', // We use a custom caption
                table: 'w-full border-collapse',
                head_row: 'flex w-full mt-2',
                head_cell: 'w-full p-2 text-xs font-semibold text-muted-foreground uppercase',
                row: 'flex w-full mt-2',
                cell: cn(
                    'w-full h-16 text-sm text-center p-0 relative',
                    '[&:has([aria-selected])]:bg-muted-foreground/20 rounded-md',
                    '[&:has([aria-selected].day-outside)]:bg-muted-foreground/10',
                    '[&:has([aria-selected].day-today)]:bg-primary',
                ),
                day: 'w-full h-full flex items-center justify-center p-2 rounded-md transition-colors hover:bg-muted-foreground/10',
                day_today: 'text-primary-foreground font-bold',
                day_outside: 'text-muted-foreground opacity-50',
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary',
                day_disabled: 'text-muted-foreground opacity-30',
            }}
            components={{
                Day: (props) => (
                    <CustomDay 
                        {...props} 
                        matchesOnDay={matchesByDay.get(format(props.date, 'yyyy-MM-dd')) || []} 
                        displayMonth={displayMonth} 
                    />
                ),
                Caption: () => (
                    <CustomCaption displayMonth={displayMonth} onMonthChange={onMonthChange} />
                ),
            }}
        />
    );
}
