
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight, Undo, Users, Wand2, Loader2 } from 'lucide-react';
import type { RosterMember, Match } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { updateLivePlayersAction, recordBallAction } from '@/lib/actions/matches';
import { generateLiveMatchUpdateAction } from '@/lib/actions/analysis';
import { useToast } from '@/hooks/use-toast';

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
  const [liveUpdateText, setLiveUpdateText] = React.useState<string | null>(null);

  const liveScore = match.liveScore || { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [] };
  const batsmenOut = liveScore.batsmenOut || [];
  
  // For this demo, let's assume Team A is always the batting team.
  const battingTeamRoster = teamARoster;
  const bowlingTeamRoster = teamBRoster;

  const onStrikeBatsmanId = liveScore.onStrikeBatsmanId;
  const nonStrikerBatsmanId = liveScore.nonStrikerBatsmanId;
  const bowlerId = liveScore.bowlerId;
  
  const isReadyToScore = onStrikeBatsmanId && nonStrikerBatsmanId && bowlerId;
  const runRate = liveScore.overs + liveScore.balls / 6 > 0 ? (liveScore.runs / (liveScore.overs + liveScore.balls / 6)).toFixed(2) : '0.00';

  const isAllOut = liveScore.wickets >= 10;
  const needsNewBatsman = !isAllOut && liveScore.wickets > 0 && !onStrikeBatsmanId;

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

  const handleRecordBall = (event: string, runs?: number) => {
    startTransition(async () => {
        try {
            await recordBallAction(match.matchId, { event, runs });
        } catch(error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not record ball.", variant: "destructive" });
        }
    });
  };
  
  const handleScore = (run: number) => {
    handleRecordBall(run === 0 ? '.' : run.toString(), run);
  };
  const handleExtra = (type: 'wd' | 'nb') => {
    handleRecordBall(type);
  }
  const handleWicket = () => {
    handleRecordBall('W');
  }

  const handleGetLiveUpdate = () => {
    startUpdateGeneration(async () => {
        setLiveUpdateText(null);
        try {
            const result = await generateLiveMatchUpdateAction(match.matchId);
            setLiveUpdateText(result.updateText);
        } catch(error) {
             toast({ title: "Error", description: error instanceof Error ? error.message : "Could not get live update.", variant: "destructive" });
        }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Live Score</CardTitle>
          <CardDescription>
            {match.teamAName} is batting.
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
                    <CardHeader><CardTitle>Scoring Controls</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Label>Runs Scored</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map(run => <Button key={run} onClick={() => handleScore(run)} variant="outline" disabled={isPending}>{run}</Button>)}
                            <Button onClick={handleWicket} variant="destructive" disabled={isPending}>Wicket</Button>
                        </div>
                        <Label>Extras</Label>
                        <div className="grid grid-cols-2 gap-2">
                             <Button onClick={() => handleExtra('wd')} variant="outline" disabled={isPending}>Wide</Button>
                             <Button onClick={() => handleExtra('nb')} variant="outline" disabled={isPending}>No Ball</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Current Over</CardTitle></CardHeader>
                    <CardContent>
                        <OverHistory balls={liveScore.currentOver} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>AI Match Analysis</CardTitle>
                            <Button size="sm" variant="outline" onClick={handleGetLiveUpdate} disabled={isGeneratingUpdate}>
                                <Wand2 className={`mr-2 h-4 w-4 ${isGeneratingUpdate ? 'animate-spin' : ''}`} />
                                Update
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="min-h-[6rem] flex items-center justify-center">
                        {isGeneratingUpdate && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                        {!isGeneratingUpdate && liveUpdateText && <p className="text-sm text-muted-foreground">{liveUpdateText}</p>}
                        {!isGeneratingUpdate && !liveUpdateText && <p className="text-sm text-center text-muted-foreground">Click "Update" for a live AI analysis.</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="flex gap-2">
                        <Button variant="secondary" className="w-full" disabled><Undo />Undo</Button>
                        <Button variant="secondary" className="w-full" disabled>End Innings<ArrowRight /></Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
