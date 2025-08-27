

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight, Undo, Users, Wand2, Loader2, Target, Lightbulb, Bot, User, ShieldHalf, Play, MapPin, Calendar, Sun, Medal, ChevronRight, Handshake, CornerUpLeft, CornerUpRight, Clock, ChevronDown, CheckCircle, HelpCircle, XCircle, Heart } from 'lucide-react';
import type { RosterMember, Match, LiveMatchUpdateOutput, PlayerStats, RosterMemberWithStats, LiveScore, Extras, BowlingAngle } from '@/lib/data';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';


function DynamicContextBar({ liveScore, match, onStrikeBatsman, nonStriker }: { liveScore: LiveScore, match: Match, onStrikeBatsman?: RosterMember, nonStriker?: RosterMember }) {
    const [displayMessage, setDisplayMessage] = React.useState<string | null>(null);

    React.useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        // Priority 1: Macro-Narrative (The Chase)
        if (liveScore.liveInnings === 2 && match.firstInningsTotal) {
            const runsRequired = (match.firstInningsTotal + 1) - liveScore.runs;
            const ballsRemaining = (20 * 6) - (liveScore.overs * 6 + (liveScore.balls || 0));
            if (runsRequired > 0 && ballsRemaining > 0) {
                 setDisplayMessage(`${match.teamBName} requires ${runsRequired} runs from ${ballsRemaining} balls.`);
            } else if (runsRequired <= 0) {
                 setDisplayMessage(`${match.teamBName} won the match.`);
            } else {
                 setDisplayMessage(`${match.teamAName} won the match.`);
            }
        } 
        // Priority 2: Micro-Narrative (The Partnership)
        else {
            const partnership = liveScore.extras.partnership;
            if (partnership > 0 && onStrikeBatsman && nonStriker) {
                setDisplayMessage(`Partnership: ${partnership} runs`);
            } else {
                 setDisplayMessage(`CRR: ${(liveScore.runs / (liveScore.overs + ((liveScore.balls || 0)/6) || 1)).toFixed(2)}`);
            }
        }
        
        return () => clearTimeout(timeoutId);

    }, [liveScore, match, onStrikeBatsman, nonStriker]);


    return (
        <span className="truncate">{displayMessage}</span>
    );
}


// A simple display component for the current over
function OverHistory({ balls }: { balls: string[] }) {
  const displayBalls = [...balls];
  while (displayBalls.length < 6) {
    displayBalls.push('');
  }
  return (
    <div className="flex items-center gap-1.5 mt-2 justify-end">
      {displayBalls.map((ball, index) => (
        <span
          key={index}
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-full border text-xs font-bold',
             ball === '' && 'bg-transparent border-white/30',
            ball.includes('W') && 'bg-destructive text-destructive-foreground',
            ball.includes('4') && 'bg-blue-500 text-white',
            ball.includes('6') && 'bg-purple-600 text-white',
            ball === '1' && 'bg-white/80 text-black',
            ball === '2' && 'bg-lime-300 text-black',
            ball === '3' && 'bg-amber-300 text-black',
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
  const defaultLiveScore = { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [], batsmanStats: {}, bowlerStats: {}, extras: defaultExtras, bowlingAngle: 'Over the Wicket' as BowlingAngle };

  const [liveScore, setLiveScore] = React.useState<LiveScore>({
      ...defaultLiveScore,
      ...match.liveScore,
      extras: {
          ...defaultExtras,
          ...match.liveScore?.extras,
      },
      bowlingAngle: match.liveScore?.bowlingAngle || 'Over the Wicket',
  });

  React.useEffect(() => {
    setLiveScore({
        ...defaultLiveScore,
        ...match.liveScore,
        extras: {
            ...defaultExtras,
            ...match.liveScore?.extras,
        },
        bowlingAngle: match.liveScore?.bowlingAngle || 'Over the Wicket',
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
  const oversDecimal = (liveScore.overs || 0) + (liveScore.balls || 0) / 6;
  const runRate = oversDecimal > 0 ? (liveScore.runs / oversDecimal) : 0;
  const requiredRunRate = !isFirstInnings && match.firstInningsTotal && oversDecimal < 20 ? ((match.firstInningsTotal + 1 - liveScore.runs) / (20 - oversDecimal)).toFixed(2) : '0.00';
  const projectedScore = isFirstInnings && runRate > 0 ? Math.round(liveScore.runs + ((20 - oversDecimal) * runRate)) : 0;


  const isAllOut = liveScore.wickets >= 10;
  const isOversFinished = liveScore.overs >= 20;
  const needsNewBatsman = isReadyToScore && !liveScore.onStrikeBatsmanId && !isAllOut;
  
  const isLegalDelivery = (liveScore.balls || 0) < 6;
  
  const isEndOfOver = isLegalDelivery && liveScore.balls === 0 && liveScore.overs > 0 && (liveScore.overs !== (match.liveScore?.overs || 0));
  
  const canEndInnings = isAllOut || isOversFinished;
  const canUndo = !!match.previousLiveScore;

  const availableBatsmen = battingTeamRoster.filter(p => !batsmenOut.includes(p.personId) && p.personId !== nonStrikerBatsmanId && p.personId !== onStrikeBatsmanId);
  const availableBowlers = bowlingTeamRoster.filter(p => p.personId !== liveScore.lastBowlerId);

  const handlePlayerSelection = (type: 'onStrike' | 'nonStriker' | 'bowler' | 'bowlingAngle', value: string) => {
    startTransition(async () => {
      try {
        const updates: Partial<LiveScore> = {};
        if (type === 'onStrike') updates.onStrikeBatsmanId = value;
        if (type === 'nonStriker') updates.nonStrikerBatsmanId = value;
        if (type === 'bowler') {
            const currentLiveScore = match.liveScore || defaultLiveScore;
            updates.bowlerId = value;
            updates.lastBowlerId = currentLiveScore.bowlerId || null;
            updates.currentOver = []; // Reset over history for new bowler
        }
        if (type === 'bowlingAngle') updates.bowlingAngle = value as BowlingAngle;

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
        <div className="bg-gray-800 text-white rounded-lg p-3 md:p-4 font-sans shadow-lg space-y-3">
            {/* Team Names & Score */}
            <div className="grid grid-cols-3 items-start gap-2">
                <div className="text-left space-y-1">
                    <p className="font-semibold text-sm sm:text-base uppercase truncate flex items-center gap-2">{battingTeam.name}</p>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-green-400 shadow-lg"><AvatarImage src={battingTeam.logoUrl} /><AvatarFallback>{battingTeam.abbrev[0]}</AvatarFallback></Avatar>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tighter text-green-400">{liveScore.runs}-{liveScore.wickets}</p>
                    </div>
                </div>
                
                <div className="text-center text-xs text-gray-300">
                    <p className="font-bold text-sm sm:text-base">OVERS</p>
                    <p className="font-bold text-3xl sm:text-4xl">{liveScore.overs || 0}.{liveScore.balls || 0}</p>
                </div>
                
                <div className="text-right space-y-1">
                     <p className="font-semibold text-sm sm:text-base uppercase truncate flex items-center justify-end gap-2">{bowlingTeam.name}</p>
                    <div className="flex items-center justify-end gap-2">
                         <div>
                            <p className="text-xs sm:text-sm font-semibold">{bowler?.personName.split(' ').pop()?.toUpperCase()} {bowlerStats.wickets}-{bowlerStats.runsConceded}</p>
                            <OverHistory balls={liveScore.currentOver || []} />
                        </div>
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-green-400 shadow-lg"><AvatarImage src={bowlingTeam.logoUrl} /><AvatarFallback>{bowlingTeam.abbrev[0]}</AvatarFallback></Avatar>
                    </div>
                </div>
            </div>

             {/* Batsmen Bar & Context */}
             <div className="flex flex-col items-center gap-2 pt-2">
                <div className="flex items-center w-full max-w-xl bg-black/30 rounded-full h-9 sm:h-10 px-1">
                    <div className="flex-1 flex items-center justify-between px-2 sm:px-3 h-full rounded-full">
                       <span className="font-bold text-xs sm:text-sm uppercase truncate">{nonStriker?.personName.split(' ').pop()}</span>
                        <span className="font-bold text-xs sm:text-sm">{nonStrikerStats.runs} <span className="opacity-70 font-normal">({nonStrikerStats.balls})</span></span>
                    </div>
                    <div className="flex-1 flex items-center justify-between px-2 sm:px-3 bg-green-500 rounded-full h-[calc(100%-8px)] shadow-md">
                        <span className="font-bold text-xs sm:text-sm uppercase flex items-center gap-1 truncate"><ChevronRight className="h-4 w-4 flex-shrink-0" />{onStrikeBatsman?.personName.split(' ').pop()}</span>
                        <span className="font-bold text-xs sm:text-sm">{onStrikeStats.runs} <span className="opacity-70 font-normal">({onStrikeStats.balls})</span></span>
                    </div>
                </div>
                <div className="text-center text-xs text-gray-300 h-4 mt-1">
                    <DynamicContextBar liveScore={liveScore} match={match} onStrikeBatsman={onStrikeBatsman} nonStriker={nonStriker} />
                </div>
            </div>

            {/* Bottom Row: Rates */}
             <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 text-xs mt-2 text-gray-300">
                <span>CRR: {runRate.toFixed(2)}</span>
                { !isFirstInnings && <span>TARGET: {match.firstInningsTotal ? match.firstInningsTotal + 1 : '-'}</span> }
                { !isFirstInnings && <span>RRR: {+requiredRunRate > 0 ? requiredRunRate : '-'}</span>}
                { isFirstInnings && <span>PROJECTED: {projectedScore > 0 ? `~${projectedScore}` : '-'}</span>}
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
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Player Selection & Controls</CardTitle>
                    <CardDescription>Select the next batsman or bowler when prompted.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {needsNewBatsman ? (
                        <div className="space-y-2">
                            <Label className="text-destructive font-bold">WICKET! Select Incoming Batsman</Label>
                            <Select onValueChange={(val) => handlePlayerSelection('onStrike', val)} disabled={isPending || isSimulating}>
                                <SelectTrigger><SelectValue placeholder="Select next batsman"/></SelectTrigger>
                                <SelectContent>{availableBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    ) : isEndOfOver ? (
                        <div className="space-y-2">
                            <Label className="text-primary font-bold">End of Over! Select Next Bowler</Label>
                            <Select onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending || isSimulating}>
                                <SelectTrigger><SelectValue placeholder="Select next bowler"/></SelectTrigger>
                                <SelectContent>{availableBowlers.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground py-4">
                            <p>Current Batsmen and Bowler are set.</p>
                            <p className="text-xs">Use the scoring controls below to record the next ball.</p>
                        </div>
                    )}
                </CardContent>
             </Card>
        )}

        {isReadyToScore && !needsNewBatsman && !isEndOfOver && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scoring Controls</CardTitle>
                            <CardDescription>Tap the location on the wagon-wheel where the ball was hit.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-center block">Bowling Angle</Label>
                                    <RadioGroup onValueChange={(val) => handlePlayerSelection('bowlingAngle', val)} value={liveScore.bowlingAngle} className="flex gap-2 justify-center">
                                        <Button type="button" onClick={() => handlePlayerSelection('bowlingAngle', 'Over the Wicket')} variant={liveScore.bowlingAngle === 'Over the Wicket' ? 'secondary' : 'outline'} className="flex-1 max-w-xs gap-2"><CornerUpRight /> Over</Button>
                                        <Button type="button" onClick={() => handlePlayerSelection('bowlingAngle', 'Round the Wicket')} variant={liveScore.bowlingAngle === 'Round the Wicket' ? 'secondary' : 'outline'} className="flex-1 max-w-xs gap-2"><CornerUpLeft /> Round</Button>
                                    </RadioGroup>
                                </div>
                                <div className="flex justify-center">
                                    <WagonWheel
                                        onShotSelect={handleShotSelect}
                                        disabled={isPending || isSimulating || needsNewBatsman}
                                        shots={liveScore.shots || []}
                                    />
                                </div>
                            </div>
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
