
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight, Undo, Users, Wand2, Loader2, Target, Lightbulb } from 'lucide-react';
import type { RosterMember, Match, LiveMatchUpdateOutput } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { updateLivePlayersAction, recordBallAction, endInningsAction, undoLastBallAction } from '@/lib/actions/matches';
import { generateLiveMatchUpdateAction } from '@/lib/actions/analysis';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { WagonWheel } from '@/components/wagon-wheel';
import { ScoringDialog } from './scoring-dialog';


// A simple display component for the current over
function OverHistory({ balls }: { balls: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {balls.map((ball, index) => (
        <span
          key={index}
          className={cn(
            'flex items-center justify-center h-8 w-8 rounded-full border text-sm font-bold',
            ball.includes('W') && 'bg-destructive text-destructive-foreground',
            ball.includes('4') && 'bg-blue-500 text-white',
            ball.includes('6') && 'bg-purple-600 text-white',
            ball === '.' && 'bg-muted text-muted-foreground',
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
  teamARoster: RosterMember[];
  teamBRoster: RosterMember[];
  match: Match;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isGeneratingUpdate, startUpdateGeneration] = React.useTransition();
  const [liveUpdate, setLiveUpdate] = React.useState<LiveMatchUpdateOutput | null>(null);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = React.useState(false);
  const [currentShot, setCurrentShot] = React.useState<{ angle: number; distance: number } | null>(null);


  const liveScore = match.liveScore || { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [] };
  const batsmenOut = liveScore.batsmenOut || [];
  
  const isFirstInnings = liveScore.liveInnings === 1;
  const battingTeamRoster = isFirstInnings ? teamARoster : teamBRoster;
  const bowlingTeamRoster = isFirstInnings ? teamBRoster : teamARoster;

  const onStrikeBatsmanId = liveScore.onStrikeBatsmanId;
  const nonStrikerBatsmanId = liveScore.nonStrikerBatsmanId;
  const bowlerId = liveScore.bowlerId;
  
  const isReadyToScore = onStrikeBatsmanId && nonStrikerBatsmanId && bowlerId;
  const runRate = liveScore.overs + liveScore.balls / 6 > 0 ? (liveScore.runs / (liveScore.overs + liveScore.balls / 6)).toFixed(2) : '0.00';

  const isAllOut = liveScore.wickets >= 10;
  const isOversFinished = liveScore.overs >= 20;
  const needsNewBatsman = !isAllOut && liveScore.wickets > 0 && !onStrikeBatsmanId;
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

  const handleRecordBall = (eventData: { event: string; runs?: number }) => {
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

  return (
    <>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
            <CardTitle>Live Score</CardTitle>
            <CardDescription>
                Innings {liveScore.liveInnings}: {isFirstInnings ? match.teamAName : match.teamBName} is batting.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex items-center justify-between">
                <div className="text-6xl font-bold text-foreground">
                {liveScore.runs} / {liveScore.wickets}
                </div>
                <div className="text-right">
                <p className="text-3xl font-bold">
                    {liveScore.overs}.{liveScore.balls}
                </p>
                <p className="text-sm text-muted-foreground">Overs</p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>Run Rate: {runRate}</span>
                <span>Projected: {+runRate > 0 ? Math.round(+runRate * 20) : 'N/A'}</span>
            </div>
            </CardContent>
        </Card>

        {!isFirstInnings && match.firstInningsTotal != null && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target /> Target Score</CardTitle>
                    <CardDescription>
                        To win, {match.teamBName} needs to score {match.firstInningsTotal + 1} runs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-6xl font-bold text-foreground">
                        {match.firstInningsTotal + 1}
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
      
      <Card>
        <CardHeader><CardTitle>Player Selection</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>On Strike</Label>
                <Select value={onStrikeBatsmanId} onValueChange={(val) => handlePlayerSelection('onStrike', val)} disabled={isPending || needsNewBatsman}><SelectTrigger><SelectValue placeholder="Select Batsman"/></SelectTrigger>
                    <SelectContent>{availableOnStrikeBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Non-Striker</Label>
                <Select value={nonStrikerBatsmanId} onValueChange={(val) => handlePlayerSelection('nonStriker', val)} disabled={isPending}><SelectTrigger><SelectValue placeholder="Select Batsman"/></SelectTrigger>
                    <SelectContent>{availableNonStrikers.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Bowler</Label>
                <Select value={bowlerId} onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending}><SelectTrigger><SelectValue placeholder="Select Bowler"/></SelectTrigger>
                    <SelectContent>{bowlingTeamRoster.map(p => <SelectItem key={p.personId} value={p.personId}>{p.personName}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      {isAllOut ? (
        <Card className="p-8 text-center bg-muted">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-4 text-xl font-bold">Innings Over</h3>
            <p className="mt-1 text-sm text-muted-foreground">All 10 wickets have fallen.</p>
             <Button onClick={handleEndInnings} className="mt-4" disabled={isPending}>
                {isFirstInnings ? "End Innings & Start 2nd" : "End Match"} <ArrowRight />
            </Button>
        </Card>
      ) : needsNewBatsman ? (
        <Card className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/30">
            <Users className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            <h3 className="mt-4 text-xl font-bold">Wicket! Select Next Batsman</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose the new batsman for the 'On Strike' position to continue scoring.</p>
        </Card>
      ) : !isReadyToScore ? (
        <Card className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-4 text-lg font-medium">Setup Required</h3>
            <p className="mt-1 text-sm text-muted-foreground">Please select the opening batsmen and bowler to begin scoring.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Scoring Controls</CardTitle>
                        <CardDescription>Tap the location on the wagon-wheel where the ball was hit.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <WagonWheel
                            onShotSelect={handleShotSelect}
                            disabled={isPending}
                            shots={liveScore.shots}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-4">
                <Card>
                    <CardHeader><CardTitle>Current Over</CardTitle></CardHeader>
                    <CardContent>
                        <OverHistory balls={liveScore.currentOver} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Win Probability</CardTitle>
                            <Button size="sm" variant="outline" onClick={handleGetLiveUpdate} disabled={isGeneratingUpdate}>
                                <Wand2 className={`mr-2 h-4 w-4 ${isGeneratingUpdate ? 'animate-spin' : ''}`} />
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
                        <Button onClick={handleUndo} variant="secondary" className="w-full" disabled={!canUndo || isPending}>
                            <Undo className="mr-2 h-4 w-4" />
                            Undo Last Ball
                        </Button>
                         <Button onClick={handleEndInnings} className="w-full" disabled={!canEndInnings || isPending}>
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
    />
    </>
  );
}
