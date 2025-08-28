

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, Undo, Users, Wand2, Loader2, Target, Lightbulb, Bot, User, ShieldHalf, Play, MapPin, Calendar, Sun, Medal, ChevronRight, Handshake, CornerUpLeft, CornerUpRight, Clock, ChevronDown, CheckCircle, HelpCircle, XCircle, Heart, Thermometer, CloudRain, Cloudy, Wind, Lock } from 'lucide-react';
import type { RosterMember, Match, LiveMatchUpdateOutput, PlayerStats, RosterMemberWithStats, LiveScore, BowlingAngle, MatchForecast } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { updateLivePlayersAction, recordBallAction, endInningsAction, undoLastBallAction, simulateBallAction } from '@/lib/actions/matches';
import { generateLiveMatchUpdateAction, getMatchForecastAction } from '@/lib/actions/analysis';
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
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { ConfettiBurst } from '@/components/confetti-burst';


const getDisplayName = (playerId: string | undefined, roster: RosterMemberWithStats[]): string => {
    if (!playerId) return 'Select...';
    
    const player = roster.find(p => p.personId === playerId);
    if (!player) return 'Unknown';
    
    const nameParts = player.personName.split(' ');
    if (nameParts.length < 2) return player.personName; // Handle single names

    const lastName = nameParts[nameParts.length - 1];
    
    const lastNameCount = roster.filter(p => {
        const pNameParts = p.personName.split(' ');
        return pNameParts.length > 1 && pNameParts[pNameParts.length - 1] === lastName;
    }).length;
    
    if (lastNameCount > 1) {
        const firstNameInitial = nameParts[0].charAt(0);
        return `${firstNameInitial}. ${lastName}`;
    }
    
    return player.personName;
};


function DynamicContextBar({ liveScore, match, bowler, bowlerStats, bowlingTeamRoster }: { liveScore: LiveScore, match: Match, bowler?: RosterMemberWithStats, bowlerStats: any, bowlingTeamRoster: RosterMemberWithStats[] }) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const messages: (string | null)[] = [];

    const isFirstInnings = liveScore.liveInnings === 1;
    
    const oversDecimal = (liveScore.overs || 0) + ((liveScore.balls || 0)/6);
    if(oversDecimal > 0) {
        const crr = (liveScore.runs / oversDecimal).toFixed(2);
        messages.push(`Current Run Rate: ${crr}`);
    }

    if (!isFirstInnings && match.firstInningsTotal) {
        const runsRequired = (match.firstInningsTotal + 1) - liveScore.runs;
        const ballsRemaining = (20 * 6) - (liveScore.overs * 6 + (liveScore.balls || 0));
        if (runsRequired > 0 && ballsRemaining > 0) {
            messages.push(`${match.teamBName} requires ${runsRequired} runs from ${ballsRemaining} balls.`);
            const rrr = (runsRequired / (ballsRemaining / 6)).toFixed(2);
            messages.push(`Required Rate: ${rrr}`);
        } else if (runsRequired <= 0) {
            messages.push(`${match.teamBName} won the match.`);
        } else {
            messages.push(`${match.teamAName} won the match.`);
        }
    }
    
    if (isFirstInnings && oversDecimal > 0) {
        const crr = (liveScore.runs / oversDecimal);
        const projected = Math.round(liveScore.runs + (20 - oversDecimal) * crr);
        messages.push(`Projected Score: ~${projected}`);
    }

    const partnership = liveScore.extras?.partnership;
    if (partnership && partnership > 0) {
        messages.push(`Partnership: ${partnership} runs`);
    }

    if (bowler && bowlerStats) {
        const bowlerName = getDisplayName(bowler.personId, bowlingTeamRoster)?.split(' ').pop()?.toUpperCase();
        messages.push(`${bowlerName}: ${bowlerStats.overs}-${bowlerStats.maidens}-${bowlerStats.runsConceded}-${bowlerStats.wickets}`);
    }

    const activeMessages = messages.filter(m => m !== null);

    React.useEffect(() => {
        if (activeMessages.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % activeMessages.length);
            }, 10000); 

            return () => clearInterval(interval);
        }
    }, [activeMessages.length]);

    if (activeMessages.length === 0) {
        return <span className="truncate">First ball of the match.</span>
    }

    return (
        <span className="truncate">{activeMessages[currentIndex]}</span>
    );
}

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
            ball === '1' && 'bg-pink-500 text-white',
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

function RecentBalls({ history }: { history: string[] }) {
    if (!history || history.length === 0) {
        return (
            <div className="text-center text-xs text-muted-foreground p-2">
                Ball history will appear here.
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {history.map((ball, index) => {
                if (ball === '|') {
                    return <Separator key={`divider-${index}`} orientation="vertical" className="h-6 bg-muted-foreground" />;
                }
                return (
                    <span
                      key={index}
                      className={cn(
                        'flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold',
                        ball.includes('W') && 'bg-destructive text-destructive-foreground',
                        ball.includes('4') && 'bg-blue-500 text-white',
                        ball.includes('6') && 'bg-purple-600 text-white',
                        ball === '1' && 'bg-pink-500 text-white',
                        ball === '2' && 'bg-lime-300 text-black',
                        ball === '3' && 'bg-amber-300 text-black',
                        ball === '.' && 'bg-gray-500 text-white',
                        (ball.includes('wd') || ball.includes('nb')) && 'bg-yellow-500 text-black'
                      )}
                    >
                      {ball}
                    </span>
                );
            })}
        </div>
    );
}

function WeatherIcon({ condition, ...props }: { condition: string } & React.ComponentProps<typeof Sun>) {
    switch (condition?.toLowerCase()) {
        case "sunny": return <Sun {...props} />;
        case "cloudy": return <Cloudy {...props} />;
        case "rain":
        case "showers":
        case "storm":
             return <CloudRain {...props} />;
        default: return <Cloudy {...props} />;
    }
}

function BowlingCard({ bowlerStats, roster }: { bowlerStats: LiveScore['bowlerStats'], roster: RosterMemberWithStats[] }) {
    const bowlers = Object.entries(bowlerStats).map(([personId, stats]) => {
        const player = roster.find(p => p.personId === personId);
        return {
            name: getDisplayName(personId, roster),
            ...stats,
        };
    }).filter(b => b.name !== 'Unknown');

    return (
        <Card>
            <CardHeader><CardTitle>Bowling Figures</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Bowler</TableHead><TableHead className="text-right">O</TableHead><TableHead className="text-right">M</TableHead><TableHead className="text-right">R</TableHead><TableHead className="text-right">W</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {bowlers.length > 0 ? bowlers.map(b => (
                            <TableRow key={b.name}>
                                <TableCell className="font-medium">{b.name}</TableCell>
                                <TableCell className="text-right">{b.overs}.{b.balls}</TableCell>
                                <TableCell className="text-right">{b.maidens}</TableCell>
                                <TableCell className="text-right">{b.runsConceded}</TableCell>
                                <TableCell className="text-right">{b.wickets}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow><TableCell colSpan={5} className="text-center h-24">No bowlers yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function BowlerSelectionItem({ player, liveScore, onSelect }: { player: RosterMemberWithStats, liveScore: LiveScore, onSelect: () => void }) {
    const [statsView, setStatsView] = React.useState<'match' | 'career'>('match');
    const matchStats = liveScore.bowlerStats[player.personId] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0, economyRate: 0 };
    const careerStats = player.stats;
    const stats = statsView === 'match' ? matchStats : careerStats;
    const bowlingHand = player.physicalAttributes?.bowlingHand ? `${player.physicalAttributes.bowlingHand}-arm` : '';
    const bowlingStyle = player.physicalAttributes?.bowlingStyles?.join(', ');

    return (
      <div onClick={onSelect} className="w-full text-left p-2 rounded-md hover:bg-muted/50 cursor-pointer">
        <div className="flex items-center gap-3">
          <Avatar><AvatarImage src={player.profileImageUrl} /><AvatarFallback>{player.personName.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
          <div className="flex-1">
            <p className="font-semibold">{getDisplayName(player.personId, [player])}</p>
            <p className="text-xs text-muted-foreground capitalize">{bowlingHand} {bowlingStyle}</p>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            <Button size="sm" variant={statsView === 'match' ? 'secondary' : 'ghost'} onClick={(e) => { e.stopPropagation(); setStatsView('match'); }} className="h-6 text-xs px-2">Match</Button>
            <Button size="sm" variant={statsView === 'career' ? 'secondary' : 'ghost'} onClick={(e) => { e.stopPropagation(); setStatsView('career'); }} className="h-6 text-xs px-2">Career</Button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 text-center mt-2 text-xs">
          <div><strong>O</strong><br />{statsView === 'match' ? `${stats?.overs || 0}.${stats?.balls || 0}` : (stats?.oversBowled || 0).toFixed(1)}</div>
          <div><strong>M</strong><br />{stats?.maidens || 0}</div>
          <div><strong>R</strong><br />{stats?.runsConceded || 0}</div>
          <div><strong>W</strong><br />{stats?.wicketsTaken || stats?.wickets || 0}</div>
          <div><strong>Econ</strong><br />{(stats?.economyRate || 0).toFixed(2)}</div>
        </div>
      </div>
    );
}

type WagonWheelView = 'team' | 'on-strike' | 'non-striker';

export function LiveScoringInterface({
  teamARoster,
  teamBRoster,
  match,
  canLiveScore
}: {
  teamARoster: RosterMemberWithStats[];
  teamBRoster: RosterMemberWithStats[];
  match: Match;
  canLiveScore: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isSimulating, startSimulation] = React.useTransition();
  const [isGeneratingUpdate, startUpdateGeneration] = React.useTransition();
  const [liveUpdate, setLiveUpdate] = React.useState<LiveMatchUpdateOutput | null>(null);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = React.useState(false);
  const [currentShot, setCurrentShot] = React.useState<{ angle: number; distance: number } | null>(null);
  const [forecast, setForecast] = React.useState<MatchForecast | null>(null);
  const [wagonWheelView, setWagonWheelView] = React.useState<WagonWheelView>('team');
  const [milestone, setMilestone] = React.useState<number | null>(null);


  React.useEffect(() => {
      getMatchForecastAction(match.matchId).then(data => {
          if (!("error" in data)) {
              setForecast(data);
          }
      });
  }, [match.matchId]);

  const defaultExtras = { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0 };
  const defaultLiveScore = { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [], batsmanStats: {}, bowlerStats: {}, extras: defaultExtras, bowlingAngle: 'Over the Wicket' as BowlingAngle, ballHistory: [] };

  const [liveScore, setLiveScore] = React.useState<LiveScore>({
      ...defaultLiveScore,
      ...match.liveScore,
      extras: {
          ...defaultExtras,
          ...match.liveScore?.extras,
      },
      bowlingAngle: match.liveScore?.bowlingAngle || 'Over the Wicket',
      ballHistory: match.liveScore?.ballHistory || [],
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
        ballHistory: match.liveScore?.ballHistory || [],
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
  
  const isAllOut = liveScore.wickets >= 10;
  const isOversFinished = liveScore.overs >= 20;

  const endOfOver = liveScore.endOfOver === true;
  const needsNewBatsman = liveScore.newBatsmanRequired === true && !isAllOut;
  const needsNewBowler = endOfOver && !isAllOut;
  const isReadyToScore = liveScore.onStrikeBatsmanId && liveScore.nonStrikerBatsmanId && liveScore.bowlerId && !needsNewBowler;
  
  const needsPlayerSelection = (needsNewBatsman || needsNewBowler) && !isAllOut;

  
  const canEndInnings = isAllOut || isOversFinished;
  const canUndo = !!match.previousLiveScore;

  const availableBatsmen = battingTeamRoster.filter(p => !batsmenOut.includes(p.personId) && p.personId !== nonStrikerBatsmanId && p.personId !== onStrikeBatsmanId);
  
  const availableBowlers = bowlingTeamRoster.filter(p => {
    const bowlerStats = liveScore.bowlerStats[p.personId];
    return p.personId !== liveScore.lastBowlerId && (!bowlerStats || bowlerStats.overs < 4);
  });

  const wagonWheelShots = React.useMemo(() => {
    const allShots = liveScore.shots || [];
    if (wagonWheelView === 'team') {
      return allShots;
    }
    if (wagonWheelView === 'on-strike') {
      return allShots.filter(shot => shot.batsmanId === onStrikeBatsmanId);
    }
    if (wagonWheelView === 'non-striker') {
      return allShots.filter(shot => shot.batsmanId === nonStrikerBatsmanId);
    }
    return [];
  }, [wagonWheelView, liveScore.shots, onStrikeBatsmanId, nonStrikerBatsmanId]);

  const [firstBatsman, secondBatsman] = onStrikeBatsmanId === nonStrikerBatsmanId
    ? [onStrikeBatsmanId, null] 
    : onStrikeBatsmanId
        ? [onStrikeBatsmanId, nonStrikerBatsmanId] 
        : [nonStrikerBatsmanId, onStrikeBatsmanId];

  const firstBatsmanStats = firstBatsman ? (liveScore.batsmanStats?.[firstBatsman] || { runs: 0, balls: 0 }) : null;
  const secondBatsmanStats = secondBatsman ? (liveScore.batsmanStats?.[secondBatsman] || { runs: 0, balls: 0 }) : null;


  const handlePlayerSelection = (type: 'onStrike' | 'nonStriker' | 'bowler' | 'bowlingAngle', value: string) => {
    startTransition(async () => {
      try {
        const updates: Partial<LiveScore> = {};
        if (type === 'onStrike') {
            updates.onStrikeBatsmanId = value;
            updates.newBatsmanRequired = false;
        }
        if (type === 'nonStriker') updates.nonStrikerBatsmanId = value;
        if (type === 'bowler') {
            updates.bowlerId = value;
            updates.endOfOver = false;
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
            const result = await recordBallAction(match.matchId, { ...eventData, ...currentShot });
            if (result?.milestone) {
                setMilestone(result.milestone);
                setTimeout(() => setMilestone(null), 4000);
            }
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
  
  const bowlerStats = liveScore.bowlerStats?.[bowlerId || ''] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0 };
  const tossWinner = match.tossWinnerId === match.teamAId ? match.teamAName : match.teamBName;

  if (!canLiveScore) {
      return (
          <Alert variant="warning">
              <Lock className="h-4 w-4" />
              <AlertTitle>Permission Denied</AlertTitle>
              <AlertDescription>You do not have the required permissions (Admin, Sportsmaster, or confirmed Match Official) to use the live scoring controls for this match.</AlertDescription>
          </Alert>
      );
  }

  return (
    <>
    <ConfettiBurst isActive={!!milestone} />
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
                            <p className="text-xs sm:text-sm font-semibold">{getDisplayName(bowler?.personId, bowlingTeamRoster)?.split(' ').pop()?.toUpperCase()} {bowlerStats.overs}-{bowlerStats.maidens}-{bowlerStats.runsConceded}-{bowlerStats.wickets}</p>
                            <OverHistory balls={liveScore.currentOver || []} />
                        </div>
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-green-400 shadow-lg"><AvatarImage src={bowlingTeam.logoUrl} /><AvatarFallback>{bowlingTeam.abbrev[0]}</AvatarFallback></Avatar>
                    </div>
                </div>
            </div>

             {/* Batsmen Bar & Context */}
             <div className="flex flex-col items-center gap-2 pt-2">
                <div className="flex items-center w-full max-w-xl bg-black/30 rounded-full h-9 sm:h-10 px-1">
                    <div className={cn("flex-1 flex items-center justify-between px-2 sm:px-3 h-full rounded-full", onStrikeBatsmanId === firstBatsman && onStrikeBatsmanId && "bg-green-500 h-[calc(100%-8px)] shadow-md")}>
                        {firstBatsman && firstBatsmanStats ? (
                             <>
                                <span className="font-bold text-xs sm:text-sm uppercase truncate">{getDisplayName(firstBatsman, battingTeamRoster).split(' ').pop()}</span>
                                <span className="font-bold text-xs sm:text-sm">{firstBatsmanStats.runs} <span className="opacity-70 font-normal">({firstBatsmanStats.balls})</span></span>
                            </>
                        ) : (<span className="font-bold text-xs sm:text-sm uppercase truncate w-full text-center">SELECT...</span>)}
                    </div>
                    <div className={cn("flex-1 flex items-center justify-between px-2 sm:px-3 h-full rounded-full", onStrikeBatsmanId === secondBatsman && onStrikeBatsmanId && "bg-green-500 h-[calc(100%-8px)] shadow-md")}>
                        {secondBatsman && secondBatsmanStats ? (
                            <>
                                <span className="font-bold text-xs sm:text-sm uppercase truncate">{getDisplayName(secondBatsman, battingTeamRoster).split(' ').pop()}</span>
                                <span className="font-bold text-xs sm:text-sm">{secondBatsmanStats.runs} <span className="opacity-70 font-normal">({secondBatsmanStats.balls})</span></span>
                            </>
                         ) : onStrikeBatsmanId ? (<span className="font-bold text-xs sm:text-sm uppercase truncate w-full text-center">SELECT...</span>) : null}
                    </div>
                </div>
                <div className="text-center text-xs text-gray-300 h-4 mt-1">
                    <DynamicContextBar liveScore={liveScore} match={match} bowler={bowler} bowlerStats={bowlerStats} bowlingTeamRoster={bowlingTeamRoster} />
                </div>
            </div>
            
            <Separator className="bg-white/20"/>

             {/* Context Bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 text-xs text-gray-300">
                 {isFirstInnings && <span>1st Innings</span>}
                { !isFirstInnings && <span>2nd Innings</span> }
                <Separator orientation="vertical" className="h-4 bg-white/20"/>
                <span>{format(match.dateTime, 'p')}</span>
                <Separator orientation="vertical" className="h-4 bg-white/20"/>
                <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{match.fieldName}</span>
                 {forecast && <><Separator orientation="vertical" className="h-4 bg-white/20"/><span className="flex items-center gap-1.5"><WeatherIcon condition={forecast.details.condition} className="h-3 w-3" />{forecast.details.condition}, {forecast.details.temperature}°C</span></>}
                 {match.tossWinnerId && <><Separator orientation="vertical" className="h-4 bg-white/20"/><span className="flex items-center gap-1.5"><Medal className="h-3 w-3" />{tossWinner} won the toss & chose to {match.tossDecision}</span></>}
                 { !isFirstInnings && <><Separator orientation="vertical" className="h-4 bg-white/20"/><span>TARGET: {match.firstInningsTotal ? match.firstInningsTotal + 1 : '-'}</span></> }
            </div>
        </div>

        {needsPlayerSelection && (
             <Card>
                <CardHeader>
                    <CardTitle>Player Selection Required</CardTitle>
                    <CardDescription>Select the next batsman or bowler to continue.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {needsNewBatsman ? (
                        <div className="space-y-2">
                            <Label className="text-destructive font-bold">WICKET! Select Incoming Batsman</Label>
                            <Select onValueChange={(val) => handlePlayerSelection('onStrike', val)} disabled={isPending || isSimulating}>
                                <SelectTrigger><SelectValue placeholder="Select next batsman"/></SelectTrigger>
                                <SelectContent>{availableBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{getDisplayName(p.personId, battingTeamRoster)}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    ) : needsNewBowler ? (
                        <div className="space-y-2">
                            <Label className="text-primary font-bold">End of Over! Select Next Bowler</Label>
                            <Select onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending || isSimulating}>
                                <SelectTrigger><SelectValue placeholder="Select next bowler"/></SelectTrigger>
                                <SelectContent className="max-h-96">
                                  {availableBowlers.map(p => (
                                      <BowlerSelectionItem
                                          key={p.personId}
                                          player={p}
                                          liveScore={liveScore}
                                          onSelect={() => handlePlayerSelection('bowler', p.personId)}
                                      />
                                  ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        )}
        {isAllOut && (
             <Card className="p-8 text-center bg-muted">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-xl font-bold">Innings Over</h3>
                <p className="mt-1 text-sm text-muted-foreground">All 10 wickets have fallen.</p>
                 <Button onClick={handleEndInnings} className="mt-4" disabled={isPending || isSimulating}>
                    {isFirstInnings ? "End Innings & Start 2nd" : "End Match"} <ArrowRight />
                </Button>
            </Card>
        )}
        {!needsPlayerSelection && !isAllOut && isReadyToScore && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <CardTitle>Scoring Controls</CardTitle>
                                    <CardDescription>Select bowling angle, then tap the field where the ball was hit.</CardDescription>
                                </div>
                                 <div className="flex items-center rounded-md bg-muted p-1">
                                    <Button onClick={() => setWagonWheelView('team')} size="sm" variant={wagonWheelView === 'team' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs gap-1.5"><Users className="h-4 w-4"/>Team</Button>
                                    <Button onClick={() => setWagonWheelView('on-strike')} size="sm" variant={wagonWheelView === 'on-strike' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs gap-1.5"><User className="h-4 w-4"/>On-strike</Button>
                                    <Button onClick={() => setWagonWheelView('non-striker')} size="sm" variant={wagonWheelView === 'non-striker' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs gap-1.5"><User className="h-4 w-4"/>Non-striker</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <RadioGroup onValueChange={(val) => handlePlayerSelection('bowlingAngle', val)} value={liveScore.bowlingAngle} className="flex items-center justify-center gap-2" disabled={isPending || isSimulating}>
                                    <Label htmlFor="angle-over" className={cn("flex items-center gap-1.5 rounded-md border-2 p-1 px-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer", liveScore.bowlingAngle === 'Over the Wicket' ? 'border-primary' : 'border-muted bg-popover')}>
                                        <RadioGroupItem value="Over the Wicket" id="angle-over" className="sr-only" />
                                        <CornerUpRight className="h-4 w-4"/> Over the Wicket
                                    </Label>
                                    <Label htmlFor="angle-round" className={cn("flex items-center gap-1.5 rounded-md border-2 p-1 px-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer", liveScore.bowlingAngle === 'Round the Wicket' ? 'border-primary' : 'border-muted bg-popover')}>
                                        <RadioGroupItem value="Round the Wicket" id="angle-round" className="sr-only" />
                                        <CornerUpLeft className="h-4 w-4"/> Round the Wicket
                                    </Label>
                                </RadioGroup>
                                <div className="flex justify-center pt-4">
                                    <WagonWheel
                                        onShotSelect={handleShotSelect}
                                        disabled={isPending || isSimulating || needsNewBatsman}
                                        shots={wagonWheelShots}
                                    />
                                </div>
                                <div className="pt-4 border-t">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Balls</h4>
                                <RecentBalls history={liveScore.ballHistory || []} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-4">
                    <BowlingCard bowlerStats={liveScore.bowlerStats} roster={bowlingTeamRoster} />
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
