
'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Swords, ShieldHalf, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RosterMemberWithStats, PlayerStats, AvailabilityStatus } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StatItem } from '@/components/stat-item';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface PlayerCardProps {
    player: RosterMemberWithStats;
    index?: number;
    isDragging?: boolean;
    availability?: { status: AvailabilityStatus; note?: string };
}

const getPrimaryRole = (stats: PlayerStats) => {
    const battingScore = (stats.battingAverage > 20 ? 1 : 0) + (stats.strikeRate > 120 ? 1 : 0) + (stats.fifties > 2 ? 1 : 0);
    const bowlingScore = (stats.wicketsTaken > 10 ? 1 : 0) + (stats.economyRate > 0 && stats.economyRate < 8 ? 1 : 0);

    if (battingScore > 1 && bowlingScore > 1) return { label: 'All-rounder', icon: Swords };
    if (battingScore > 1) return { label: 'Batsman', icon: Swords };
    if (bowlingScore > 1) return { label: 'Bowler', icon: ShieldHalf };
    return { label: 'Player', icon: User };
};

const AvailabilityBadge = ({ status, note }: { status?: AvailabilityStatus; note?: string }) => {
    const statusConfig = {
        attending: { icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
        unavailable: { icon: XCircle, className: "bg-red-100 text-red-800 border-red-200" },
        tentative: { icon: HelpCircle, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    };

    const config = status ? statusConfig[status] : null;
    if (!config) return <Badge variant="outline">No Response</Badge>;

    const BadgeContent = () => (
        <Badge variant="secondary" className={cn("capitalize", config.className)}>
            <config.icon className="mr-1 h-3 w-3" />
            {status}
        </Badge>
    );

    if (note) {
        return <TooltipProvider><Tooltip><TooltipTrigger asChild><BadgeContent /></TooltipTrigger><TooltipContent><p>{note}</p></TooltipContent></Tooltip></TooltipProvider>;
    }
    return <BadgeContent />;
};

export const PlayerCard = React.forwardRef<HTMLDivElement, PlayerCardProps>(
    ({ player, index, isDragging, availability }, ref) => {
    const { label: roleLabel, icon: RoleIcon } = getPrimaryRole(player.stats);
    
    return (
        <div ref={ref} className={cn("flex items-center bg-card p-2 border rounded-lg shadow-sm w-full", isDragging && "opacity-50 shadow-2xl")}>
            <div className="flex items-center gap-3 flex-1">
                {index && <span className="font-bold text-lg w-5 text-center text-muted-foreground">{index}</span>}
                <Avatar className="h-10 w-10">
                    <AvatarImage src={player.profileImageUrl} />
                    <AvatarFallback>{player.personName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold">{player.personName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <RoleIcon className="h-3 w-3" />
                        <span>{roleLabel}</span>
                        {player.isCaptain && <Badge variant="outline" className="text-amber-500 border-amber-500 px-1 py-0 text-[10px]">C</Badge>}
                        {player.isViceCaptain && <Badge variant="outline" className="px-1 py-0 text-[10px]">VC</Badge>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 mx-4">
                <StatItem label="Avg" value={player.stats.battingAverage.toFixed(1)} size="small" />
                <StatItem label="SR" value={player.stats.strikeRate.toFixed(1)} size="small" />
                <StatItem label="Wkts" value={player.stats.wicketsTaken} size="small" />
            </div>
            <AvailabilityBadge status={availability?.status} note={availability?.note} />
            <div className="pl-2">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing touch-none" />
            </div>
        </div>
    );
});
PlayerCard.displayName = "PlayerCard";

export const SortablePlayerCard = ({ player, index, availability }: { player: RosterMemberWithStats; index?: number; availability?: { status: AvailabilityStatus; note?: string }; }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: player.personId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <PlayerCard player={player} index={index} availability={availability} />
        </div>
    );
};
