
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DayPicker, type DayContentProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function CustomCaption({ displayMonth, onMonthChange }: { displayMonth: Date, onMonthChange: (date: Date) => void }) {
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

export function StrategicCalendarView({ matches, selectedDate, onDateSelect, displayMonth, onMonthChange }: StrategicCalendarViewProps) {
    // Create a lookup map of dates to matches, which is a stable pattern.
    const matchesByDate = React.useMemo(() => {
        return matches.reduce((acc, match) => {
            const dateKey = format(match.dateTime, 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(match);
            return acc;
        }, {} as Record<string, Match[]>);
    }, [matches]);

    // The modifier now just checks for the existence of a key, not passing data.
    const modifiers = {
        hasMatch: (date: Date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return !!matchesByDate[dateKey];
        }
    };
    
    // Define the DayContent component within this component's scope so it can access 'matchesByDate'
    function CustomDayContent(props: DayContentProps) {
        const dateKey = format(props.date, 'yyyy-MM-dd');
        const matchesOnDay = matchesByDate[dateKey] || [];
    
        return (
            <>
                {format(props.date, "d")}
                {matchesOnDay.length > 0 && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1">
                        {matchesOnDay.slice(0, 3).map(match => (
                            <div
                                key={match.matchId}
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    competitionTypeColors[match.competitionType || 'Friendlies'] || 'bg-gray-400'
                                )}
                            />
                        ))}
                    </div>
                )}
            </>
        );
    }

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
            modifiers={modifiers}
            modifiersClassNames={{
                hasMatch: 'has-match-modifier', // This class itself doesn't do much, but it activates the modifier
            }}
            components={{
                DayContent: CustomDayContent,
                Caption: () => (
                    <CustomCaption displayMonth={displayMonth} onMonthChange={onMonthChange} />
                ),
            }}
        />
    );
}
