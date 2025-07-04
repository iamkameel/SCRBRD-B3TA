'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical, Save, Wand2, Loader2, User, Swords, ShieldHalf, UserCheck, Users } from 'lucide-react';

import type { Match, RosterMemberWithStats, AvailabilityStatus } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { saveMatchLineupAction, confirmLineupAction } from '@/lib/actions/matches';
import { autoSelectLineupAction } from '@/lib/actions/analysis';
import { useAuth } from '@/lib/auth-context';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PlayerCard, SortablePlayerCard } from './player-card';

interface LineupManagerProps {
  teamId: string;
  teamName: string;
  match: Match;
  rosterWithStats: RosterMemberWithStats[];
  initialLineupIds: string[];
}

export function LineupManager({
  teamId,
  teamName,
  match,
  rosterWithStats,
  initialLineupIds,
}: LineupManagerProps) {
  const { person } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isAutoSelecting, startAutoSelectTransition] = React.useTransition();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const isCaptain = rosterWithStats.some(p => p.personId === person?.personId && p.isCaptain);
  const lineupConfirmed = teamId === match.teamAId ? match.lineupConfirmedByCaptainA : match.lineupConfirmedByCaptainB;

  const [squadPlayers, setSquadPlayers] = React.useState<RosterMemberWithStats[]>([]);
  const [lineupPlayers, setLineupPlayers] = React.useState<RosterMemberWithStats[]>([]);
  
  React.useEffect(() => {
    const lineupSet = new Set(initialLineupIds);
    const initialLineup = initialLineupIds.map(id => rosterWithStats.find(p => p.personId === id)).filter(Boolean) as RosterMemberWithStats[];
    const initialSquad = rosterWithStats.filter(p => !lineupSet.has(p.personId));
    setLineupPlayers(initialLineup);
    setSquadPlayers(initialSquad);
  }, [initialLineupIds, rosterWithStats]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId;

    if (activeContainer === overContainer) {
      // Reordering within the same list
      if (overContainer === 'lineup') {
        setLineupPlayers((players) => {
          const oldIndex = players.findIndex((p) => p.personId === active.id);
          const newIndex = players.findIndex((p) => p.personId === over.id);
          return arrayMove(players, oldIndex, newIndex);
        });
      }
    } else {
      // Moving between lists
      if (activeContainer === 'squad' && overContainer === 'lineup') {
        if (lineupPlayers.length >= 11) {
            toast({ title: 'Lineup Full', description: 'You can only select 11 players.', variant: 'destructive' });
            return;
        }
        setSquadPlayers(squad => squad.filter(p => p.personId !== active.id));
        setLineupPlayers(lineup => [...lineup, squadPlayers.find(p => p.personId === active.id)!]);
      } else if (activeContainer === 'lineup' && overContainer === 'squad') {
        setLineupPlayers(lineup => lineup.filter(p => p.personId !== active.id));
        setSquadPlayers(squad => [...squad, lineupPlayers.find(p => p.personId === active.id)!]);
      }
    }
  };

  const handleSaveLineup = () => {
    startTransition(async () => {
        try {
            const playerIds = lineupPlayers.map(p => p.personId);
            await saveMatchLineupAction(match.matchId, teamId, playerIds);
            toast({ title: "Lineup Saved", description: `The lineup for ${teamName} has been updated.`});
        } catch (error) {
            toast({ title: "Error Saving Lineup", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive"});
        }
    });
  };

  const handleAutoSelect = () => {
    startAutoSelectTransition(async () => {
      try {
        const { playerIds, justification } = await autoSelectLineupAction(match.matchId, teamId);
        const lineupSet = new Set(playerIds);
        const newSquad = rosterWithStats.filter(p => !lineupSet.has(p.personId));
        const newLineup = playerIds.map(id => rosterWithStats.find(p => p.personId === id)).filter(Boolean) as RosterMemberWithStats[];
        setSquadPlayers(newSquad);
        setLineupPlayers(newLineup);
        toast({ title: "AI Lineup Suggested", description: justification, duration: 10000 });
      } catch (error) {
        toast({ title: "Error Auto-Selecting", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
      }
    });
  };

  const handleConfirmLineup = () => {
    startTransition(async () => {
        try {
            await confirmLineupAction(match.matchId, teamId);
            toast({ title: "Lineup Confirmed", description: "You have confirmed the lineup for this match." });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not confirm lineup.", variant: "destructive" });
        }
    });
  };

  const activePlayer = rosterWithStats.find(p => p.personId === activeId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Squad ({squadPlayers.length})</CardTitle>
                    <CardDescription>Drag players from here to the lineup.</CardDescription>
                </CardHeader>
                <SortableContext items={squadPlayers.map(p => p.personId)} strategy={verticalListSortingStrategy}>
                    <CardContent id="squad" className="min-h-[300px]">
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="space-y-2">
                                {squadPlayers.map(player => (
                                    <SortablePlayerCard key={player.personId} player={player} availability={match.availability?.[player.personId]} />
                                ))}
                                {squadPlayers.length === 0 && <p className="text-center text-muted-foreground pt-10">No players left in squad.</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </SortableContext>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldHalf /> Selected XI ({lineupPlayers.length}/11)</CardTitle>
                    <CardDescription>Drag to reorder the batting lineup.</CardDescription>
                </CardHeader>
                <SortableContext items={lineupPlayers.map(p => p.personId)} strategy={verticalListSortingStrategy}>
                     <CardContent id="lineup" className="min-h-[300px]">
                        <ScrollArea className="h-[600px] pr-4">
                             <div className="space-y-2">
                                {lineupPlayers.map((player, index) => (
                                    <SortablePlayerCard key={player.personId} player={player} index={index + 1} availability={match.availability?.[player.personId]} />
                                ))}
                                {lineupPlayers.length < 11 && (
                                    <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                                        <p>Drag players here</p>
                                    </div>
                                )}
                             </div>
                        </ScrollArea>
                    </CardContent>
                </SortableContext>
            </Card>
        </div>
        <div className="flex items-center justify-between mt-6 p-4 border rounded-lg bg-background sticky bottom-4 z-10 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
                {lineupConfirmed ? (
                    <><UserCheck className="h-5 w-5 text-green-500" /><span className="font-semibold text-green-600">Lineup Confirmed</span></>
                ) : (
                    <><Loader2 className="h-5 w-5 text-yellow-500 animate-spin" /><span className="font-semibold text-yellow-600">Awaiting Captain's Confirmation</span></>
                )}
            </div>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip><TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleAutoSelect} disabled={isPending || isAutoSelecting}><Wand2 className={isAutoSelecting ? 'animate-spin' : ''} /></Button>
                    </TooltipTrigger><TooltipContent>Auto-Select with AI</TooltipContent></Tooltip>
                </TooltipProvider>
                <Button onClick={handleSaveLineup} disabled={isPending || isAutoSelecting || lineupConfirmed}>
                    <Save className="mr-2"/>
                    {isPending ? 'Saving...' : 'Save Lineup'}
                </Button>
                {isCaptain && !lineupConfirmed && lineupPlayers.length === 11 && (
                    <Button onClick={handleConfirmLineup} disabled={isPending || isAutoSelecting}>
                        Confirm Final Lineup
                    </Button>
                )}
            </div>
        </div>
        <DragOverlay>
            {activePlayer ? <PlayerCard player={activePlayer} availability={match.availability?.[activePlayer.personId]} isDragging /> : null}
        </DragOverlay>
    </DndContext>
  );
}
