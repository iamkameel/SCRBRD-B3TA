
'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { GripVertical, Save, Wand2, Loader2, User, Users, Swords, ShieldHalf, ShieldCheck, UserCheck, Search, Plus, X, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Match, RosterMemberWithStats, PlayerStats, Lineup } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveMatchLineupAction, confirmLineupAction } from '@/lib/actions/matches';
import { autoSelectLineupAction } from '@/lib/actions/analysis';
import { useAuth } from '@/lib/auth-context';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SortablePlayerCard, PlayerCard, getPrimaryRole } from './player-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';


const ROLE_FILTERS = ['All', 'BAT', 'BOWL', 'AR', 'WK'];

function TeamLineupManager({ teamId, match, rosterWithStats, initialLineup, canManage, isConfirmed, teamName }: {
  teamId: string;
  match: Match;
  rosterWithStats: RosterMemberWithStats[];
  initialLineup: Lineup;
  canManage: boolean;
  isConfirmed: boolean;
  teamName: string;
}) {
  const { person } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isAutoSelecting, startAutoSelectTransition] = React.useTransition();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const isCaptain = rosterWithStats.some(p => p.personId === person?.personId && p.isCaptain);
  
  const [allPlayers, setAllPlayers] = React.useState<RosterMemberWithStats[]>([]);
  const [view, setView] = React.useState<'selection' | 'ordering'>('selection');

  const [selectedIds, setSelectedIds] = React.useState<string[]>(initialLineup.playingXI);
  const [twelfthManId, setTwelfthManId] = React.useState<string | null>(initialLineup.twelfthMan);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('All');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    const combinedIds = [...initialLineup.playingXI, ...(initialLineup.twelfthMan ? [initialLineup.twelfthMan] : [])];
    const lineupSet = new Set(combinedIds);
    const lineupPlayers = combinedIds.map(id => rosterWithStats.find(p => p.personId === id)).filter(Boolean) as RosterMemberWithStats[];
    const squadPlayers = rosterWithStats.filter(p => !lineupSet.has(p.personId));
    
    setAllPlayers([...lineupPlayers, ...squadPlayers]);
    setSelectedIds(initialLineup.playingXI);
    setTwelfthManId(initialLineup.twelfthMan);
  }, [initialLineup, rosterWithStats]);

  const handlePlayerSelect = (playerId: string, isSelected: boolean) => {
    const isCurrentlySelected = selectedIds.includes(playerId);
    const isCurrentlyTwelfthMan = twelfthManId === playerId;
    
    if (isSelected) {
      if (isCurrentlySelected || isCurrentlyTwelfthMan) return;

      if (selectedIds.length < 11) {
        setSelectedIds(prev => [...prev, playerId]);
      } else if (!twelfthManId) {
        setTwelfthManId(playerId);
      } else {
        toast({ title: 'Lineup Full', description: 'You can only select 11 players and one 12th man.', variant: 'destructive' });
      }
    } else {
      if (isCurrentlySelected) {
        setSelectedIds(prev => prev.filter(id => id !== playerId));
      } else if (isCurrentlyTwelfthMan) {
        setTwelfthManId(null);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
        setAllPlayers((items) => {
            const oldIndex = items.findIndex((item) => item.personId === active.id);
            const newIndex = items.findIndex((item) => item.personId === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }
  };

  const filteredPlayers = allPlayers.filter(player => {
    const searchMatch = player.personName.toLowerCase().includes(searchQuery.toLowerCase());
    const role = getPrimaryRole(player);
    const roleMatch = roleFilter === 'All' || role.key === roleFilter;
    return searchMatch && roleMatch;
  });

  const selectedPlayers = allPlayers.filter(p => selectedIds.includes(p.personId));
  const activePlayer = allPlayers.find(p => p.personId === activeId);
  const lineupComposition = selectedPlayers.reduce((acc, player) => {
      const role = getPrimaryRole(player).key;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const handleSaveLineup = () => {
    startTransition(async () => {
        try {
            const orderedPlayingXI = allPlayers.filter(p => selectedIds.includes(p.personId)).map(p => p.personId);
            const finalLineup: Lineup = {
                playingXI: orderedPlayingXI,
                twelfthMan: twelfthManId
            };
            await saveMatchLineupAction(match.matchId, teamId, finalLineup);
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
        setSelectedIds(playerIds);
        setTwelfthManId(null); // AI selection doesn't pick a 12th man for now
        const lineupSet = new Set(playerIds);
        const newLineup = playerIds.map(id => rosterWithStats.find(p => p.personId === id)).filter(Boolean) as RosterMemberWithStats[];
        const newSquad = rosterWithStats.filter(p => !lineupSet.has(p.personId));
        setAllPlayers([...newLineup, ...newSquad]);

        toast({ title: "AI Lineup Suggested", description: justification, duration: 10000 });
      } catch (error) {
        toast({ title: "Error Auto-Selecting", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
      }
    });
  };
  
  const handleConfirmLineup = () => {
    if (selectedIds.length !== 11) {
        toast({ title: "Incomplete Lineup", description: "You must select exactly 11 players to confirm.", variant: "destructive" });
        return;
    }
    startTransition(async () => {
        try {
            const orderedPlayingXI = allPlayers.filter(p => selectedIds.includes(p.personId)).map(p => p.personId);
            const finalLineup: Lineup = { playingXI: orderedPlayingXI, twelfthMan: twelfthManId };
            await saveMatchLineupAction(match.matchId, teamId, finalLineup);
            await confirmLineupAction(match.matchId, teamId);
            toast({ title: "Lineup Confirmed", description: "You have confirmed the lineup for this match." });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not confirm lineup.", variant: "destructive" });
        }
    });
  };

  if (!canManage) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Lineup Locked</h2>
        <p className="text-muted-foreground">You do not have permission to edit this lineup.</p>
      </Card>
    );
  }
  
  if (isConfirmed) {
      return (
        <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold">Lineup Confirmed</h2>
          <p className="text-muted-foreground">This lineup has been finalized and can no longer be edited.</p>
        </Card>
      );
  }

  const selectedCount = selectedIds.length + (twelfthManId ? 1 : 0);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <Card className="col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Manage Lineup: {teamName}</CardTitle>
                    <Badge variant={selectedIds.length === 11 ? 'default' : 'outline'}>{selectedIds.length} / 11 Playing (+{twelfthManId ? 1 : 0} Sub)</Badge>
                </div>
                 <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {lineupComposition.BAT > 0 && <span className="flex items-center gap-1"><User className="h-3 w-3"/>{lineupComposition.BAT}</span>}
                        {lineupComposition.BOWL > 0 && <span className="flex items-center gap-1"><ShieldHalf className="h-3 w-3"/>{lineupComposition.BOWL}</span>}
                        {lineupComposition.AR > 0 && <span className="flex items-center gap-1"><Swords className="h-3 w-3"/>{lineupComposition.AR}</span>}
                        {lineupComposition.WK > 0 && <span className="flex items-center gap-1"><ShieldHalf className="h-3 w-3"/>{lineupComposition.WK}</span>}
                    </div>
                    <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="selection">Selection</TabsTrigger>
                            <TabsTrigger value="ordering">Batting Order</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                {view === 'selection' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search roster..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex items-center p-1 rounded-md bg-muted">
                                {ROLE_FILTERS.map(role => (
                                    <Button key={role} variant={roleFilter === role ? 'secondary' : 'ghost'} size="sm" onClick={() => setRoleFilter(role)}>{role}</Button>
                                ))}
                            </div>
                        </div>
                         <ScrollArea className="h-[600px] pr-2">
                             <div className="space-y-2">
                                {filteredPlayers.map(player => (
                                    <PlayerCard
                                      key={player.personId}
                                      player={player}
                                      availability={match.availability?.[player.personId]}
                                      isSelected={selectedIds.includes(player.personId) || twelfthManId === player.personId}
                                      isTwelfthMan={twelfthManId === player.personId}
                                      onSelect={(checked) => handlePlayerSelect(player.personId, checked)}
                                    />
                                ))}
                                {filteredPlayers.length === 0 && <p className="text-center text-muted-foreground pt-10">No players found.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                )}
                {view === 'ordering' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <h3 className="font-semibold mb-2">Playing XI (Batting Order)</h3>
                             <SortableContext items={selectedPlayers.map(p => p.personId)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2 min-h-[300px] border rounded-lg p-2 bg-muted/30">
                                    {selectedPlayers.map((player, index) => (
                                        <SortablePlayerCard 
                                          key={player.personId} 
                                          player={player} 
                                          index={index + 1} 
                                          availability={match.availability?.[player.personId]}
                                          isSelected={true}
                                          onSelect={() => {}} // Selection is disabled in ordering view
                                        />
                                    ))}
                                    {selectedPlayers.length === 0 && <p className="text-center text-muted-foreground pt-10">Select players to set the batting order.</p>}
                                </div>
                            </SortableContext>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">12th Man (Substitute)</h3>
                             <div className="space-y-2 min-h-[100px] border rounded-lg p-2 bg-muted/30">
                                {twelfthManId && rosterWithStats.find(p => p.personId === twelfthManId) ? (
                                     <PlayerCard
                                      player={rosterWithStats.find(p => p.personId === twelfthManId)!}
                                      availability={match.availability?.[twelfthManId]}
                                      isSelected={true}
                                      isTwelfthMan={true}
                                      onSelect={() => {}}
                                    />
                                ) : (
                                    <p className="text-center text-muted-foreground pt-10">No 12th man selected.</p>
                                )}
                             </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        <div className="lg:col-span-2 flex items-center justify-between mt-6 p-4 border rounded-lg bg-background sticky bottom-4 z-10 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold">{selectedIds.length} Playing XI, {twelfthManId ? 1 : 0} Substitute</span>
            </div>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip><TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleAutoSelect} disabled={isPending || isAutoSelecting}><Wand2 className={isAutoSelecting ? 'animate-spin' : ''} /></Button>
                    </TooltipTrigger><TooltipContent>Auto-Select with AI</TooltipContent></Tooltip>
                </TooltipProvider>
                <Button onClick={handleSaveLineup} disabled={isPending || isAutoSelecting}>
                    <Save className="mr-2"/>
                    {isPending ? 'Saving...' : 'Save Lineup'}
                </Button>
                {isCaptain && (
                    <Button onClick={handleConfirmLineup} disabled={isPending || isAutoSelecting || selectedIds.length !== 11}>
                        <ShieldCheck className="mr-2"/>
                        Confirm Final Lineup
                    </Button>
                )}
            </div>
        </div>
         <DragOverlay>
            {activePlayer ? <PlayerCard player={activePlayer} availability={match.availability?.[activePlayer.personId]} isDragging isSelected={selectedIds.includes(activePlayer.personId) || twelfthManId === activePlayer.personId} isTwelfthMan={twelfthManId === activePlayer.personId} onSelect={() => {}} /> : null}
        </DragOverlay>
    </DndContext>
  );
}

export function LineupManager({ match, teamARoster, teamBRoster, teamALineup, teamBLineup, canManageA, canManageB }: {
    match: Match,
    teamARoster: RosterMemberWithStats[],
    teamBRoster: RosterMemberWithStats[],
    teamALineup: Lineup,
    teamBLineup: Lineup,
    canManageA: boolean,
    canManageB: boolean
}) {
    return (
        <Tabs defaultValue="teamA">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teamA">{match.teamAName}</TabsTrigger>
                <TabsTrigger value="teamB">{match.teamBName}</TabsTrigger>
            </TabsList>
            <TabsContent value="teamA" className="mt-4">
                <TeamLineupManager
                    key={`team-a-${match.matchId}`}
                    teamId={match.teamAId}
                    teamName={match.teamAName}
                    match={match}
                    rosterWithStats={teamARoster}
                    initialLineup={teamALineup}
                    canManage={canManageA}
                    isConfirmed={match.lineupConfirmedByCaptainA}
                />
            </TabsContent>
            <TabsContent value="teamB" className="mt-4">
                 <TeamLineupManager
                    key={`team-b-${match.matchId}`}
                    teamId={match.teamBId}
                    teamName={match.teamBName}
                    match={match}
                    rosterWithStats={teamBRoster}
                    initialLineup={teamBLineup}
                    canManage={canManageB}
                    isConfirmed={match.lineupConfirmedByCaptainB}
                />
            </TabsContent>
        </Tabs>
    )
}
