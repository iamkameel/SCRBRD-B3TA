
'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Swords, ShieldHalf, CheckCircle, XCircle, HelpCircle, Heart, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RosterMemberWithStats, PlayerStats, AvailabilityStatus } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StatItem } from '@/components/stat-item';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export const getPrimaryRole = (player: RosterMemberWithStats) => {
    const { stats, roles } = player;
    const playerRoles = new Set(roles);

    if (playerRoles.has('Wicket-Keeper')) {
        return { label: 'Wicket-Keeper', icon: ShieldHalf, key: 'WK' };
    }

    // A simple scoring system to determine primary role based on performance stats
    const battingScore = (stats.battingAverage > 25 ? 1.5 : (stats.battingAverage > 15 ? 1 : 0)) 
                       + (stats.totalRuns > 500 ? 1 : 0) 
                       + (stats.fifties > 2 ? 1 : 0)
                       + (stats.strikeRate > 130 ? 0.5 : 0);

    const bowlingScore = (stats.wicketsTaken > 15 ? 1.5 : (stats.wicketsTaken > 5 ? 1 : 0)) 
                       + (stats.economyRate > 0 && stats.economyRate < 8 ? 1 : 0)
                       + (stats.bowlingAverage > 0 && stats.bowlingAverage < 30 ? 1 : 0);

    if (battingScore > 1.5 && bowlingScore > 1.5) return { label: 'All-Rounder', icon: Swords, key: 'AR' };
    if (bowlingScore > battingScore && bowlingScore > 1) return { label: 'Bowler', icon: ShieldHalf, key: 'BOWL' };
    if (battingScore > 0) return { label: 'Batsman', icon: User, key: 'BAT' };
    
    // Default fallback
    return { label: 'Player', icon: User, key: 'BAT' };
};

const getPlayerSpecialities = (player: RosterMemberWithStats): string => {
    const specialities: string[] = [];
    if (player.physicalAttributes?.battingHand) {
        specialities.push(`${player.physicalAttributes.battingHand}-hand Bat`);
    }
    if (player.physicalAttributes?.bowlingStyles && player.physicalAttributes.bowlingStyles.length > 0) {
        specialities.push(...player.physicalAttributes.bowlingStyles);
    }
    return specialities.join(' | ');
};


interface PlayerCardProps {
    player: RosterMemberWithStats;
    index?: number;
    isDragging?: boolean;
    availability?: { status: AvailabilityStatus; note?: string };
    isSelected: boolean;
    onSelect: (checked: boolean) => void;
    dragHandleProps?: any;
    style?: React.CSSProperties;
    isTwelfthMan?: boolean;
}

const AvailabilityBadge = ({ status, note }: { status?: AvailabilityStatus; note?: string }) => {
    const statusConfig = {
        attending: { icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
        unavailable: { icon: XCircle, className: "bg-red-100 text-red-800 border-red-200" },
        tentative: { icon: HelpCircle, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
        injured: { icon: Heart, className: "bg-orange-100 text-orange-800 border-orange-200" },
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
    ({ player, index, isDragging, availability, isSelected, onSelect, dragHandleProps, style, isTwelfthMan }, ref) => {
    const { label: roleLabel, icon: RoleIcon } = getPrimaryRole(player);
    const specialities = getPlayerSpecialities(player);
    
    return (
        <div ref={ref} style={style} className={cn(
          "bg-card p-3 border rounded-lg shadow-sm w-full transition-shadow",
          isDragging ? "opacity-75 shadow-2xl z-50" : "hover:shadow-md",
          isSelected && "bg-primary/10 border-primary"
        )}>
            <div className="flex items-center gap-2">
                {dragHandleProps && (
                    <div {...dragHandleProps} className="cursor-grab p-1 active:cursor-grabbing touch-none">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                )}
                {index && <span className="font-bold text-lg w-5 text-center text-muted-foreground">{index}</span>}
                {onSelect && <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mx-2"/>}
                <Avatar className="h-10 w-10">
                    <AvatarImage src={player.profileImageUrl} />
                    <AvatarFallback>{player.personName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-base">{player.personName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {isTwelfthMan ? (
                            <Badge variant="outline" className="px-1.5 py-0">12th</Badge>
                        ) : (
                           <TooltipProvider>
                               <Tooltip>
                                   <TooltipTrigger asChild><RoleIcon className="h-4 w-4" /></TooltipTrigger>
                                   <TooltipContent><p>{roleLabel}</p></TooltipContent>
                               </Tooltip>
                           </TooltipProvider>
                        )}
                        {player.isCaptain && <Badge variant="outline" className="text-amber-500 border-amber-500 px-1 py-0 text-[10px]">C</Badge>}
                        {player.isViceCaptain && <Badge variant="outline" className="px-1 py-0 text-[10px]">VC</Badge>}
                    </div>
                </div>
                 <AvailabilityBadge status={availability?.status} note={availability?.note} />
            </div>
             <Separator className="my-2" />
             <div className="flex justify-around items-center pt-1">
                 <StatItem label="Bat Avg" value={player.stats.battingAverage.toFixed(1)} size="small" />
                 <StatItem label="Bat SR" value={player.stats.strikeRate.toFixed(1)} size="small" />
                 <StatItem label="Wkts" value={player.stats.wicketsTaken} size="small" />
                 <StatItem label="Bowl Econ" value={player.stats.economyRate.toFixed(2)} size="small" />
            </div>
        </div>
    );
});
PlayerCard.displayName = "PlayerCard";

export const SortablePlayerCard = ({ player, index, availability, isSelected, onSelect }: { player: RosterMemberWithStats; index?: number; availability?: { status: AvailabilityStatus; note?: string }; isSelected: boolean; onSelect: (checked: boolean) => void; }) => {
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
        <PlayerCard 
            ref={setNodeRef}
            player={player} 
            index={index} 
            availability={availability} 
            isSelected={isSelected}
            onSelect={onSelect}
            dragHandleProps={{...attributes, ...listeners}}
            style={style}
        />
    );
};
