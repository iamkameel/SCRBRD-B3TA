
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowRight, Dot, Undo } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { RosterMember, Match } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

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
  const [runs, setRuns] = React.useState(0);
  const [wickets, setWickets] = React.useState(0);
  const [overs, setOvers] = React.useState(0);
  const [balls, setBalls] = React.useState(0);
  const [currentOver, setCurrentOver] = React.useState<string[]>([]);
  
  const isSetupComplete = true; // Placeholder for now

  const handleAddBall = (ball: string, isLegalBall: boolean = true) => {
    setCurrentOver((prev) => [...prev, ball]);
    if (isLegalBall) {
      if (balls === 5) {
        setBalls(0);
        setOvers((o) => o + 1);
        setCurrentOver([]);
      } else {
        setBalls((b) => b + 1);
      }
    }
  };
  
  const handleScore = (run: number) => {
    setRuns(r => r + run);
    handleAddBall(run === 0 ? '.' : run.toString());
  };

  const handleExtra = (type: 'wd' | 'nb') => {
    setRuns(r => r + 1);
    handleAddBall(type, false);
  }

  const handleWicket = () => {
    if (wickets < 10) {
      setWickets(w => w + 1);
      handleAddBall('W');
    }
  }
  
  const runRate = overs + balls / 6 > 0 ? (runs / (overs + balls / 6)).toFixed(2) : '0.00';


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
              {runs} / {wickets}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                {overs}.{balls}
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
      
      {!isSetupComplete ? (
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
                            {[0, 1, 2, 3, 4, 5, 6].map(run => <Button key={run} onClick={() => handleScore(run)} variant="outline">{run}</Button>)}
                            <Button onClick={handleWicket} variant="destructive">Wicket</Button>
                        </div>
                        <Label>Extras</Label>
                        <div className="grid grid-cols-2 gap-2">
                             <Button onClick={() => handleExtra('wd')} variant="outline">Wide</Button>
                             <Button onClick={() => handleExtra('nb')} variant="outline">No Ball</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Current Over</CardTitle></CardHeader>
                    <CardContent>
                        <OverHistory balls={currentOver} />
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
