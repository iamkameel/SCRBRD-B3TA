

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight, Undo, Users, Wand2, Loader2, Target, Lightbulb, Bot, User, ShieldHalf, Play, MapPin, Calendar, Sun, Medal, ChevronRight, Handshake } from 'lucide-react';
import type { RosterMember, Match, LiveMatchUpdateOutput, PlayerStats, RosterMemberWithStats, LiveScore, Extras } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { updateLivePlayersAction, recordBallAction, endInningsAction, undoLastBallAction, simulateBallAction } from '@/lib/actions/matches';
import { generateLiveMatchUpdateAction } from '@/lib/actions/analysis';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { WagonWheel } from '@/components/wagon-wheel';
import { ScoringDialog } from './scoring-dialog';
import { Separator } from '@/components/ui/separator';
import { getPlayerStats } from '@/lib/actions/stats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// A simple display component for the current over
function OverHistory({ balls }: { balls: string[] }) {
  const displayBalls = [...balls];
  while (displayBalls.length < 6) {
    displayBalls.push('');
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayBalls.map((ball, index) => (
        <span
          key={index}
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-full border text-xs font-bold',
             ball === '' && 'bg-transparent border-white/30',
            ball.includes('W') && 'bg-destructive text-destructive-foreground',
            ball.includes('4') && 'bg-blue-500 text-white',
            ball.includes('6') && 'bg-purple-600 text-white',
            ball === '.' && 'bg-gray-500 text-white',
            (ball.includes('wd') || ball.includes('nb')) && 'bg-yellow-500 text-black'
          )}
        >
          {ball}
        </span>
      ))}
    </div>
  );
}

const StatDisplay = ({ label, value, color }: { label: string, value: string | number, color?: string }) => (
    <div className="text-center">
        <p className="text-xs uppercase opacity-70 tracking-wider">{label}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
    </div>
);

function DynamicContextBar({ liveScore, match, onStrikeBatsman, nonStriker }: { liveScore: LiveScore; match: Match; onStrikeBatsman?: RosterMemberWithStats; nonStriker?: RosterMemberWithStats }) {
    const [eventText, setEventText] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!liveScore.currentOver || liveScore.currentOver.length === 0) {
            return;
        }

        const lastEvent = liveScore.currentOver[liveScore.currentOver.length - 1];
        if (lastEvent === 'W') {
            setEventText('WICKET!');
            const timer = setTimeout(() => setEventText(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [liveScore.currentOver]);

    // Priority 1: Macro-Narrative (The Chase)
    if (liveScore.liveInnings === 2 && match.firstInningsTotal !== undefined) {
        const runsRequired = match.firstInningsTotal + 1 - liveScore.runs;
        const totalBalls = 120;
        const ballsBowled = liveScore.overs * 6 + liveScore.balls;
        const ballsRemaining = totalBalls - ballsBowled;
        
        if (runsRequired <= 0) {
            return <p className="font-semibold">{match.teamBName} won!</p>;
        }

        return <p className="font-semibold">{match.teamBName} requires {runsRequired} runs from {ballsRemaining} balls.</p>;
    }

    // Priority 2: Event-Driven Alert
    if (eventText) {
        return <p className="font-semibold text-red-400 animate-pulse">{eventText}</p>;
    }
    
    // Priority 3: Micro-Narrative (Default)
    const pship = liveScore.extras?.partnership || 0;
    const batsman1Name = onStrikeBatsman?.personName.split(' ').pop() || '...';
    const batsman2Name = nonStriker?.personName.split(' ').pop() || '...';

    return <p className="font-semibold">Partnership: {pship} ({`${batsman1Name} & ${batsman2Name}`})</p>;
}


export function LiveScoringInterface({
  teamARoster,
  teamBRoster,
  match,
}: {
  teamARoster: RosterMemberWithStats[];
  teamBRoster: RosterMemberWithStats[];
  match: Match;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isSimulating, startSimulation] = React.useTransition();
  const [isGeneratingUpdate, startUpdateGeneration] = React.useTransition();
  const [liveUpdate, setLiveUpdate] = React.useState<LiveMatchUpdateOutput | null>(null);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = React.useState(false);
  const [currentShot, setCurrentShot] = React.useState<{ angle: number; distance: number } | null>(null);

  const defaultExtras = { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0 };
  const defaultLiveScore = { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [], batsmanStats: {}, bowlerStats: {}, extras: defaultExtras };

  const [liveScore, setLiveScore] = React.useState<LiveScore>({
      ...defaultLiveScore,
      ...match.liveScore,
      extras: {
          ...defaultExtras,
          ...match.liveScore?.extras,
      }
  });

  React.useEffect(() => {
    setLiveScore({
        ...defaultLiveScore,
        ...match.liveScore,
        extras: {
            ...defaultExtras,
            ...match.liveScore?.extras,
        }
    });
  }, [match.liveScore]);

  const batsmenOut = liveScore.batsmenOut || [];
  
  const isFirstInnings = liveScore.liveInnings === 1;
  const battingTeam = isFirstInnings ? { id: match.teamAId, name: match.teamAName, abbrev: match.teamAName.substring(0,4).toUpperCase(), logoUrl: match.teamALogoUrl } : { id: match.teamBId, name: match.teamBName, abbrev: match.teamBName.substring(0,4).toUpperCase(), logoUrl: match.teamBLogoUrl };
  const bowlingTeam = isFirstInnings ? { id: match.teamBId, name: match.teamBName, abbrev: match.teamBName.substring(0,4).toUpperCase(), logoUrl: match.teamBLogoUrl } : { id: match.teamAId, name: match.teamAName, abbrev: match.teamAName.substring(0,4).toUpperCase(), logoUrl: match.teamALogoUrl };
  const battingTeamRoster = isFirstInnings ? teamARoster : teamBRoster;
  const bowlingTeamRoster = isFirstInnings ? teamBRoster : teamARoster;

  const onStrikeBatsmanId = liveScore.onStrikeBatsmanId;
  const nonStrikerBatsmanId = liveScore.nonStrikerBatsmanId;
  const bowlerId = liveScore.bowlerId;

  const onStrikeBatsman = battingTeamRoster.find(p => p.personId === onStrikeBatsmanId);
  const nonStriker = battingTeamRoster.find(p => p.personId === nonStrikerBatsmanId);
  const bowler = bowlingTeamRoster.find(p => p.personId === bowlerId);
  
  const isReadyToScore = onStrikeBatsmanId && nonStrikerBatsmanId && bowlerId;
  const oversDecimal = liveScore.overs + liveScore.balls / 6;
  const runRate = oversDecimal > 0 ? (liveScore.runs / oversDecimal) : 0;
  const requiredRunRate = !isFirstInnings && match.firstInningsTotal && oversDecimal < 20 ? ((match.firstInningsTotal + 1 - liveScore.runs) / (20 - oversDecimal)).toFixed(2) : '0.00';
  const projectedScore = isFirstInnings && runRate > 0 ? Math.round(liveScore.runs + ((20 - oversDecimal) * runRate)) : 0;


  const isAllOut = liveScore.wickets >= 10;
  const isOversFinished = liveScore.overs >= 20;
  const needsNewBatsman = isReadyToScore && !liveScore.onStrikeBatsmanId && !isAllOut;
  const isEndOfOver = liveScore.balls === 0 && liveScore.overs > 0 && liveScore.currentOver.length === 6;
  
  const canEndInnings = isAllOut || isOversFinished;
  const canUndo = !!match.previousLiveScore;

  const availableOnStrikeBatsmen = battingTeamRoster.filter(p => !batsmenOut.includes(p.personId) && p.personId !== nonStrikerBatsmanId);
  const availableNonStrikers = battingTeamRoster.filter(p => !batsmenOut.includes(p.personId) && p.personId !== onStrikeBatsmanId);

  const handlePlayerSelection = (type: 'onStrike' | 'nonStriker' | 'bowler', personId: string) => {
    startTransition(async () => {
      try {
        const updates = {
            onStrikeBatsmanId: type === 'onStrike' ? personId : onStrikeBatsmanId,
            nonStrikerBatsmanId: type === 'nonStriker' ? personId : nonStrikerBatsmanId,
            bowlerId: type === 'bowler' ? personId : bowlerId,
        };
        await updateLivePlayersAction(match.matchId, updates);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update player selection.", variant: "destructive" });
      }
    });
  };

  const handleShotSelect = (shotData: { angle: number; distance: number }) => {
    setCurrentShot(shotData);
    setIsScoringDialogOpen(true);
  };

  const handleRecordBall = (eventData: { event: string; runs?: number, dismissal?: { type: string; fielderIds?: string[] } }) => {
    startTransition(async () => {
        try {
            await recordBallAction(match.matchId, { ...eventData, ...currentShot });
        } catch(error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not record ball.", variant: "destructive" });
        } finally {
            setCurrentShot(null);
        }
    });
  };
  
  const handleSimulateBall = () => {
    startSimulation(async () => {
        try {
            await simulateBallAction(match.matchId);
        } catch(error) {
            toast({ title: "Simulation Error", description: error instanceof Error ? error.message : "Could not simulate ball.", variant: "destructive" });
        }
    });
  };

  const handleEndInnings = () => {
    startTransition(async () => {
        try {
            await endInningsAction(match.matchId);
            toast({ title: "Innings Ended", description: "The second innings is ready to begin."});
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not end innings.", variant: "destructive" });
        }
    });
  };

  const handleGetLiveUpdate = () => {
    startUpdateGeneration(async () => {
        setLiveUpdate(null);
        try {
            const result = await generateLiveMatchUpdateAction(match.matchId);
            setLiveUpdate(result);
        } catch(error) {
             toast({ title: "Error", description: error instanceof Error ? error.message : "Could not get live update.", variant: "destructive" });
        }
    });
  }

  const handleUndo = () => {
    startTransition(async () => {
        try {
            await undoLastBallAction(match.matchId);
            toast({ title: "Action Undone", description: "The last recorded ball has been removed."});
        } catch(error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not undo action.", variant: "destructive" });
        }
    });
  };
  
  const onStrikeStats = liveScore.batsmanStats?.[onStrikeBatsmanId || ''] || { runs: 0, balls: 0 };
  const nonStrikerStats = liveScore.batsmanStats?.[nonStrikerBatsmanId || ''] || { runs: 0, balls: 0 };
  const bowlerStats = liveScore.bowlerStats?.[bowlerId || ''] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0 };

  return (
    <>
    <div className="space-y-4">
        <div className="bg-gray-800 text-white rounded-lg p-2 md:p-4 space-y-2 font-sans shadow-lg">
            <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center text-center">
                    <p className="font-semibold text-sm uppercase truncate mb-2">{battingTeam.name}</p>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-green-400 shadow-lg"><AvatarImage src={battingTeam.logoUrl} /><AvatarFallback>{battingTeam.abbrev[0]}</AvatarFallback></Avatar>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tighter text-green-400">{liveScore.runs}-{liveScore.wickets}</p>
                    </div>
                </div>

                <div className="col-span-1 flex-1 flex flex-col items-center justify-center w-full">
                    <div className="flex items-center w-full max-w-lg bg-black/30 rounded-full h-10 px-1">
                        <div className={cn("flex-1 flex items-center justify-between px-3 h-full rounded-full")}>
                           <span className="font-bold text-sm uppercase truncate">{nonStriker?.personName.split(' ').pop()}</span>
                            <span className="font-bold text-sm">{nonStrikerStats.runs} <span className="opacity-70 font-normal">({nonStrikerStats.balls})</span></span>
                        </div>
                        <div className={cn("flex-1 flex items-center justify-between px-3 bg-green-500 rounded-full h-9 shadow-md")}>
                            <span className="font-bold text-sm uppercase flex items-center gap-1 truncate"><ChevronRight className="h-4 w-4 flex-shrink-0" />{onStrikeBatsman?.personName.split(' ').pop()}</span>
                            <span className="font-bold text-sm">{onStrikeStats.runs} <span className="opacity-70 font-normal">({onStrikeStats.balls})</span></span>
                        </div>
                    </div>
                    <div className="text-center text-xs mt-2 text-gray-300 h-4">
                        <DynamicContextBar liveScore={liveScore} match={match} onStrikeBatsman={onStrikeBatsman} nonStriker={nonStriker} />
                    </div>
                </div>

                <div className="flex flex-col items-center text-center">
                    <p className="font-semibold text-sm uppercase truncate mb-2">{bowlingTeam.name}</p>
                    <div className="flex items-center justify-end gap-3">
                        <div className="text-right">
                            <p className="text-xs font-semibold">{bowler?.personName.split(' ').pop()?.toUpperCase()} {bowlerStats.wickets}-{bowlerStats.runsConceded}</p>
                            <OverHistory balls={liveScore.currentOver} />
                        </div>
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-green-400 shadow-lg"><AvatarImage src={bowlingTeam.logoUrl} /><AvatarFallback>{bowlingTeam.abbrev[0]}</AvatarFallback></Avatar>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 text-xs mt-2 text-gray-300">
                <span>OVERS: {liveScore.overs}.{liveScore.balls}</span>
                <span>CRR: {runRate.toFixed(2)}</span>
                { !isFirstInnings && <span>TARGET: {match.firstInningsTotal ? match.firstInningsTotal + 1 : '-'}</span> }
                { !isFirstInnings && <span>RRR: {+requiredRunRate > 0 ? requiredRunRate : '-'}</span>}
                { isFirstInnings && <span>PROJ: {projectedScore > 0 ? `~${projectedScore}` : '-'}</span>}
                <span className="flex items-center gap-1"><Handshake className="h-3 w-3" /> {liveScore.extras.partnership}</span>
            </div>
        </div>
      
        {isAllOut ? (
        <Card className="p-8 text-center bg-muted">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-4 text-xl font-bold">Innings Over</h3>
            <p className="mt-1 text-sm text-muted-foreground">All 10 wickets have fallen.</p>
             <Button onClick={handleEndInnings} className="mt-4" disabled={isPending || isSimulating}>
                {isFirstInnings ? "End Innings & Start 2nd" : "End Match"} <ArrowRight />
            </Button>
        </Card>
      ) : !isReadyToScore ? (
        <Card>
            <CardHeader><CardTitle>Player Selection</CardTitle><CardDescription>Select the opening batsmen and bowler to start scoring.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>On Strike Batsman</Label>
                    <Select value={onStrikeBatsmanId || ''} onValueChange={(val) => handlePlayerSelection('onStrike', val)} disabled={isPending || isSimulating || needsNewBatsman}>
                        <SelectTrigger><SelectValue placeholder="Select Batsman"/></SelectTrigger>
                        <SelectContent>{availableOnStrikeBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName} <Badge variant="outline" className="ml-2">Not Out</Badge></SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Non-Striker Batsman</Label>
                    <Select value={nonStrikerBatsmanId} onValueChange={(val) => handlePlayerSelection('nonStriker', val)} disabled={isPending || isSimulating}>
                        <SelectTrigger><SelectValue placeholder="Select Batsman"/></SelectTrigger>
                        <SelectContent>{availableNonStrikers.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName} <Badge variant="outline" className="ml-2">Not Out</Badge></SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Current Bowler</Label>
                    <Select value={bowlerId} onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending || isSimulating}><SelectTrigger><SelectValue placeholder="Select Bowler"/></SelectTrigger>
                        <SelectContent>{bowlingTeamRoster.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
      ) : needsNewBatsman ? (
        <Card className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/30">
            <Users className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            <h3 className="mt-4 text-xl font-bold">Wicket! Select Next Batsman</h3>
            <div className="space-y-2 max-w-xs mx-auto mt-4">
                <Label>Next Batsman</Label>
                <Select onValueChange={(val) => handlePlayerSelection('onStrike', val)} disabled={isPending || isSimulating}>
                    <SelectTrigger><SelectValue placeholder="Select next batsman"/></SelectTrigger>
                    <SelectContent>{availableOnStrikeBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName} <Badge variant="outline" className="ml-2">Not Out</Badge></SelectItem>)}</SelectContent>
                </Select>
            </div>
        </Card>
      ) : isEndOfOver ? (
         <Card className="p-8 text-center bg-blue-50 dark:bg-blue-900/30">
            <Users className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
            <h3 className="mt-4 text-xl font-bold">End of Over</h3>
            <div className="space-y-2 max-w-xs mx-auto mt-4">
                <Label>Select New Bowler</Label>
                <Select onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending || isSimulating}>
                    <SelectTrigger><SelectValue placeholder="Select new bowler"/></SelectTrigger>
                    <SelectContent>{bowlingTeamRoster.filter(p => p.personId !== bowlerId).map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Scoring Controls</CardTitle>
                        <CardDescription>Tap the location on the wagon-wheel where the ball was hit.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <WagonWheel
                            onShotSelect={handleShotSelect}
                            disabled={isPending || isSimulating}
                            shots={liveScore.shots || []}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Win Probability</CardTitle>
                            <Button size="sm" variant="outline" onClick={handleGetLiveUpdate} disabled={isGeneratingUpdate || isSimulating}>
                                <Wand2 className={cn('mr-2 h-4 w-4', isGeneratingUpdate && 'animate-spin')} />
                                Analyze
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="min-h-[10rem] flex flex-col justify-center">
                        {isGeneratingUpdate && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />}
                        {!isGeneratingUpdate && liveUpdate && (
                            <div className="space-y-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{isFirstInnings ? match.teamAName : match.teamBName}</span>
                                    <span>{liveUpdate.winProbability}%</span>
                                </div>
                                <Progress value={liveUpdate.winProbability} />
                                <p className="text-xs text-muted-foreground text-center">{liveUpdate.summary}</p>
                                {liveUpdate.tacticalSuggestions && liveUpdate.tacticalSuggestions.length > 0 && (
                                    <div className="pt-4">
                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Lightbulb className="text-yellow-400" /> AI Suggestions</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                                            {liveUpdate.tacticalSuggestions.map((suggestion, index) => (
                                                <li key={index}>{suggestion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        {!isGeneratingUpdate && !liveUpdate && <p className="text-sm text-center text-muted-foreground">Click "Analyze" for a win probability prediction.</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-2">
                         <Button onClick={handleSimulateBall} variant="secondary" className="w-full" disabled={isSimulating || isPending}>
                            <Bot className={cn('mr-2 h-4 w-4', isSimulating && 'animate-pulse')} />
                            Simulate Ball
                        </Button>
                        <Button onClick={handleUndo} variant="secondary" className="w-full" disabled={!canUndo || isPending || isSimulating}>
                            <Undo className="mr-2 h-4 w-4" />
                            Undo Last Ball
                        </Button>
                         <Button onClick={handleEndInnings} className="w-full" disabled={!canEndInnings || isPending || isSimulating}>
                            {isFirstInnings ? "End Innings" : "End Match"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
    <ScoringDialog 
        open={isScoringDialogOpen}
        onOpenChange={setIsScoringDialogOpen}
        onScore={handleRecordBall}
        bowlingTeamRoster={bowlingTeamRoster}
    />
    </>
  );
}
