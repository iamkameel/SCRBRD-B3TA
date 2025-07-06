
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
import { GripVertical, Save, Wand2, Loader2, User, Swords, ShieldHalf, ShieldCheck, UserCheck, Search, Plus, X } from 'lucide-react';

import type { Match, RosterMemberWithStats, PlayerStats } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveMatchLineupAction, confirmLineupAction } from '@/lib/actions/matches';
import { autoSelectLineupAction } from '@/lib/actions/analysis';
import { useAuth } from '@/lib/auth-context';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SortablePlayerCard, getPrimaryRole } from './player-card';

interface LineupManagerProps {
  teamId: string;
  teamName: string;
  match: Match;
  rosterWithStats: RosterMemberWithStats[];
  initialLineupIds: string[];
}

const ROLE_FILTERS = ['All', 'BAT', 'BOWL', 'AR', 'WK'];

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

  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('All');
  
  React.useEffect(() => {
    const lineupSet = new Set(initialLineupIds);
    const initialLineup = initialLineupIds.map(id => rosterWithStats.find(p => p.personId === id)).filter(Boolean) as RosterMemberWithStats[];
    const initialSquad = rosterWithStats.filter(p => !lineupSet.has(p.personId));
    setLineupPlayers(initialLineup);
    setSquadPlayers(initialSquad);
  }, [initialLineupIds, rosterWithStats]);

  const addPlayerToLineup = (playerId: string) => {
    if (lineupPlayers.length >= 11) {
        toast({ title: 'Lineup Full', description: 'You can only select 11 players.', variant: 'destructive' });
        return;
    }
    const playerToAdd = squadPlayers.find(p => p.personId === playerId);
    if (playerToAdd) {
        setSquadPlayers(squad => squad.filter(p => p.personId !== playerId));
        setLineupPlayers(lineup => [...lineup, playerToAdd]);
    }
  };

  const removePlayerFromLineup = (playerId: string) => {
      const playerToRemove = lineupPlayers.find(p => p.personId === playerId);
      if (playerToRemove) {
          setLineupPlayers(lineup => lineup.filter(p => p.personId !== playerId));
          setSquadPlayers(squad => [...squad, playerToRemove].sort((a,b) => a.personName.localeCompare(b.personName)));
      }
  };

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
      if (overContainer === 'lineup') {
        setLineupPlayers((players) => {
          const oldIndex = players.findIndex((p) => p.personId === active.id);
          const newIndex = players.findIndex((p) => p.personId === over.id);
          return arrayMove(players, oldIndex, newIndex);
        });
      }
    } else {
        const playerToMove = rosterWithStats.find(p => p.personId === active.id);
        if (!playerToMove) return;

        if (activeContainer === 'squad' && overContainer === 'lineup') {
            addPlayerToLineup(active.id as string);
        } else if (activeContainer === 'lineup' && overContainer === 'squad') {
            removePlayerFromLineup(active.id as string);
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
  
  const filteredSquadPlayers = squadPlayers.filter(player => {
    const searchMatch = `${player.personName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const role = getPrimaryRole(player);
    const roleMatch = roleFilter === 'All' || role.key === roleFilter;
    return searchMatch && roleMatch;
  });

  const lineupComposition = lineupPlayers.reduce((acc, player) => {
      const role = getPrimaryRole(player).key;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);


  if (lineupConfirmed) {
      return (
        <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold">Lineup Confirmed</h2>
          <p className="text-muted-foreground">This lineup has been finalized and can no longer be edited.</p>
        </Card>
      );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Squad ({filteredSquadPlayers.length})</CardTitle>
                    <CardDescription>Add players from the squad to your starting XI.</CardDescription>
                    <div className="flex gap-2 pt-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search squad..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="flex items-center p-1 rounded-md bg-muted">
                            {ROLE_FILTERS.map(role => (
                                <Button key={role} variant={roleFilter === role ? 'secondary' : 'ghost'} size="sm" onClick={() => setRoleFilter(role)}>{role}</Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <SortableContext items={filteredSquadPlayers.map(p => p.personId)} strategy={verticalListSortingStrategy}>
                    <CardContent id="squad" className="min-h-[300px]">
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="space-y-2">
                                {filteredSquadPlayers.map(player => (
                                    <SortablePlayerCard 
                                      key={player.personId} 
                                      player={player} 
                                      availability={match.availability?.[player.personId]}
                                      onAction={() => addPlayerToLineup(player.personId)}
                                      actionIcon={Plus}
                                    />
                                ))}
                                {filteredSquadPlayers.length === 0 && <p className="text-center text-muted-foreground pt-10">No players found matching filters.</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </SortableContext>
            </Card>

            <Card>
                <CardHeader>
                     <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2"><ShieldHalf /> Selected XI ({lineupPlayers.length}/11)</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {lineupComposition.BAT && <span>{lineupComposition.BAT} BAT</span>}
                            {lineupComposition.BOWL && <span>{lineupComposition.BOWL} BOWL</span>}
                            {lineupComposition.AR && <span>{lineupComposition.AR} AR</span>}
                            {lineupComposition.WK && <span>{lineupComposition.WK} WK</span>}
                        </div>
                    </div>
                    <CardDescription>Drag to reorder the batting lineup.</CardDescription>
                </CardHeader>
                <SortableContext items={lineupPlayers.map(p => p.personId)} strategy={verticalListSortingStrategy}>
                     <CardContent id="lineup" className="min-h-[300px]">
                        <ScrollArea className="h-[600px] pr-4">
                             <div className="space-y-2">
                                {lineupPlayers.map((player, index) => (
                                    <SortablePlayerCard 
                                      key={player.personId} 
                                      player={player} 
                                      index={index + 1} 
                                      availability={match.availability?.[player.personId]}
                                      onAction={() => removePlayerFromLineup(player.personId)}
                                      actionIcon={X}
                                    />
                                ))}
                                {lineupPlayers.length < 11 && (
                                    <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                                        <p>Drag or add players here</p>
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
