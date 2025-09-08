

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, Undo, Wand2, Loader2, Target, Lightbulb, Bot, User, ShieldHalf, Play, MapPin, Calendar, Sun, Medal, ChevronRight, Handshake, CornerUpLeft, CornerUpRight, Clock, ChevronDown, CheckCircle, HelpCircle, XCircle, Heart, Thermometer, CloudRain, Cloudy, Wind, Lock, TrendingDown, ClipboardList, BarChart2, Repeat, Circle, Hand, Trophy, CalendarDays } from 'lucide-react';
import type { RosterMember, Match, LiveMatchUpdateOutput, PlayerStats, RosterMemberWithStats, LiveScore, BowlingAngle, MatchForecast, LiveFallOfWicket, Partnership } from '@/lib/data';
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
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DialogContent } from '@radix-ui/react-dialog';
import { PartnershipCard } from './partnership-card';


const BoundaryAnimation = ({ runs }: { runs: number }) => {
  const text = runs === 4 ? "FOUR" : "SIX";
  const textClass = runs === 4 ? "text-blue-400" : "text-purple-400";
  const bgClass = "bg-black/50";

  return (
    <div className={cn("absolute inset-0 h-full overflow-hidden z-20 pointer-events-none", bgClass)}>
      <motion.div
        className="flex items-center h-full"
        initial={{ x: "100%" }}
        animate={{ x: "-100%" }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div className="flex shrink-0 items-center">
            {Array(20).fill(0).map((_, i) => (
              <span key={i} className={cn("text-2xl font-black mx-4", textClass)}>
                {text}
              </span>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

const WicketAnimation = () => {
    const text1 = "WICKET";
    const text2 = "OUT";
    const bgClass = "bg-black/50";
    const textClass1 = "text-red-400";
    const textClass2 = "text-white";

    return (
        <div className={cn("absolute inset-0 h-full overflow-hidden z-20 pointer-events-none", bgClass)}>
            <motion.div
                className="flex items-center h-full"
                initial={{ x: "100%" }}
                animate={{ x: "-100%" }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
                <div className="flex shrink-0 items-center">
                    {Array(20).fill(0).map((_, i) => (
                        <React.Fragment key={i}>
                            <span className={cn("text-2xl font-black mx-4", textClass1)}>
                                {text1}
                            </span>
                             <span className={cn("text-2xl font-black mx-4", textClass2)}>
                                {text2}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

const HatTrickAnimation = () => (
    <div className="absolute inset-0 h-full overflow-hidden z-20 pointer-events-none bg-black/50">
        <motion.div
            className="flex items-center h-full"
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
            <div className="flex shrink-0 items-center">
                {Array(10).fill(0).map((_, i) => (
                    <span key={i} className="text-3xl font-black mx-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                        HAT-TRICK!
                    </span>
                ))}
            </div>
        </motion.div>
    </div>
);

const DuckAnimation = () => (
    <div className="absolute inset-0 h-full overflow-hidden z-20 pointer-events-none bg-black/50">
        <motion.div
            className="flex items-center h-full"
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
            <div className="flex shrink-0 items-center">
                {Array(20).fill(0).map((_, i) => (
                    <span key={i} className="text-3xl font-black mx-4 text-yellow-300">
                        DUCK! 🦆
                    </span>
                ))}
            </div>
        </motion.div>
    </div>
);

const MaidenOverAnimation = () => (
    <div className="absolute inset-0 h-full overflow-hidden z-20 pointer-events-none bg-black/50">
        <motion.div
            className="flex items-center h-full"
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
            <div className="flex shrink-0 items-center">
                {Array(20).fill(0).map((_, i) => (
                    <span key={i} className="text-3xl font-black mx-4 text-cyan-300">
                        MAIDEN OVER
                    </span>
                ))}
            </div>
        </motion.div>
    </div>
);

const getDisplayName = (playerId: string | undefined, roster: RosterMemberWithStats[]): string => {
    if (!playerId) return 'Select...';
    
    const player = roster.find(p => p.personId === playerId);
    if (!player) return 'Unknown';
    
    const nameParts = player.personName.split(' ');
    if (nameParts.length < 2) return player.personName.toUpperCase();

    const lastName = nameParts[nameParts.length - 1];
    
    const lastNameCount = roster.filter(p => {
        const pNameParts = p.personName.split(' ');
        return pNameParts.length > 1 && pNameParts[pNameParts.length - 1] === lastName;
    }).length;
    
    if (lastNameCount > 1) {
        const firstNameInitial = nameParts[0].charAt(0);
        return `${'firstNameInitial'}. ${lastName}`.toUpperCase();
    }
    
    return lastName.toUpperCase();
};

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

function FallOfWicketCard({ fow }: { fow: LiveFallOfWicket[] | undefined }) {
  if (!fow || fow.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Fall of Wickets</CardTitle></CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
          No wickets have fallen yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Fall of Wickets</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fow.map((wicket, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <span className="font-bold">{wicket.wicketNumber}</span>
                <p>{wicket.batsmanName}</p>
            </div>
            <p className="font-semibold">{wicket.runs}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


function LiveBowlingCard({ bowlerStats, roster }: { bowlerStats: LiveScore['bowlerStats'], roster: RosterMemberWithStats[] }) {
    const bowlers = Object.entries(bowlerStats).map(([personId, stats]) => {
        const player = roster.find(p => p.personId === personId);
        const overs = stats.overs || 0;
        const balls = stats.balls || 0;
        const oversDecimal = overs + (balls/6);
        const economy = oversDecimal > 0 ? ((stats.runsConceded || 0) / oversDecimal) : 0;
        return {
            name: getDisplayName(personId, roster),
            overs: overs,
            balls: balls,
            maidens: stats.maidens || 0,
            runsConceded: stats.runsConceded || 0,
            wickets: stats.wickets || 0,
            economyRate: economy.toFixed(2),
        };
    }).filter(b => b.name !== 'Unknown');

    return (
        <Table>
            <TableHeader><TableRow><TableHead>Bowler</TableHead><TableHead className="text-right">O</TableHead><TableHead className="text-right">M</TableHead><TableHead className="text-right">R</TableHead><TableHead className="text-right">W</TableHead><TableHead className="text-right">Econ</TableHead></TableRow></TableHeader>
            <TableBody>
                {bowlers.length > 0 ? bowlers.map(b => (
                    <TableRow key={b.name}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-right">{b.overs}.{b.balls}</TableCell>
                        <TableCell className="text-right">{b.maidens}</TableCell>
                        <TableCell className="text-right">{b.runsConceded}</TableCell>
                        <TableCell className="text-right">{b.wickets}</TableCell>
                        <TableCell className="text-right">{b.economyRate}</TableCell>
                    </TableRow>
                )) : (
                     <TableRow><TableCell colSpan={6} className="text-center h-24">No bowlers yet.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    )
}

function LiveBattingCard({ batsmanStats, roster, batsmenOut }: { batsmanStats: LiveScore['batsmanStats'], roster: RosterMemberWithStats[], batsmenOut: string[] }) {
    const battingLineup = roster.map(player => {
        const stats = batsmanStats[player.personId];
        const sr = (stats && stats.balls > 0) ? (stats.runs / stats.balls) * 100 : 0;
        const status = batsmenOut.includes(player.personId) ? (stats?.status || 'Out') : (stats ? 'not out' : 'Did not bat');
        return {
            name: player.personName,
            status,
            runs: stats?.runs ?? 0,
            balls: stats?.balls ?? 0,
            strikeRate: sr.toFixed(2),
        };
    });

    return (
         <Table>
            <TableHeader><TableRow><TableHead>Batsman</TableHead><TableHead>Status</TableHead><TableHead className="text-right">R</TableHead><TableHead className="text-right">B</TableHead><TableHead className="text-right">SR</TableHead></TableRow></TableHeader>
            <TableBody>
                {battingLineup.map(b => (
                    <TableRow key={b.name}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.status}</TableCell>
                        <TableCell className="text-right">{b.runs}</TableCell>
                        <TableCell className="text-right">{b.balls}</TableCell>
                        <TableCell className="text-right">{b.strikeRate}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function BowlerSelectionItem({ player, liveScore, onSelect }: { player: RosterMemberWithStats, liveScore: LiveScore, onSelect: () => void }) {
    const [statsView, setStatsView] = React.useState<'match' | 'career'>('match');
    const matchStats = liveScore.bowlerStats[player.personId] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0, economyRate: 0 };
    const careerStats = player.stats;

    // Correctly calculating overs for career view from decimal
    const careerOversInt = Math.floor(careerStats.oversBowled);
    const careerBalls = Math.round((careerStats.oversBowled - careerOversInt) * 10);
    const careerOversDisplay = `${careerOversInt}.${careerBalls}`;

    const stats = statsView === 'match' ? matchStats : {
        ...careerStats,
        oversDisplay: careerOversDisplay,
    };
    
    const bowlingHand = player.physicalAttributes?.bowlingHand ? `${player.physicalAttributes.bowlingHand}-arm` : '';
    const bowlingStyle = player.physicalAttributes?.bowlingStyles?.join(', ');

    return (
      <div onClick={onSelect} className="w-full text-left p-2 rounded-md hover:bg-muted/50 cursor-pointer">
        <div className="flex items-center gap-3">
          <Avatar><AvatarImage src={player.profileImageUrl} /><AvatarFallback>{player.personName.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
          <div className="flex-1">
            <p className="font-semibold">{player.personName}</p>
            <p className="text-xs text-muted-foreground capitalize">{bowlingHand} {bowlingStyle}</p>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            <Button size="sm" variant={statsView === 'match' ? 'secondary' : 'ghost'} onClick={(e) => { e.stopPropagation(); setStatsView('match'); }} className="h-6 text-xs px-2">Match</Button>
            <Button size="sm" variant={statsView === 'career' ? 'secondary' : 'ghost'} onClick={(e) => { e.stopPropagation(); setStatsView('career'); }} className="h-6 text-xs px-2">Career</Button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 text-center mt-2 text-xs">
          <div><strong>O</strong><br />{statsView === 'match' ? `${stats.overs || 0}.${stats.balls || 0}` : stats.oversDisplay}</div>
          <div><strong>M</strong><br />{stats.maidens || 0}</div>
          <div><strong>R</strong><br />{stats.runsConceded || 0}</div>
          <div><strong>W</strong><br />{stats.wicketsTaken || stats.wickets || 0}</div>
          <div><strong>Econ</strong><br />{(stats.economyRate || 0).toFixed(2)}</div>
        </div>
      </div>
    );
}

type WagonWheelView = 'team' | 'on-strike' | 'non-striker';

const UNDO_REASONS = [
    'Scoring error',
    'Wrong batsman selected',
    'Incorrect dismissal type',
    'Wrong bowler selected',
    'Technical issue',
    'Other (specify)',
];

function UndoDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = React.useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Undo Last Ball</DialogTitle>
                    <DialogDescription>
                        Please select a reason for this action. This will be recorded in the audit log.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <RadioGroup onValueChange={setReason} value={reason}>
                        {UNDO_REASONS.map((r) => (
                            <div key={r} className="flex items-center space-x-2">
                                <RadioGroupItem value={r} id={r} />
                                <Label htmlFor={r} className="font-normal">{r}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={!reason}>
                        <Undo className="mr-2" />
                        Confirm Undo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
  const [isUndoDialogOpen, setIsUndoDialogOpen] = React.useState(false);
  const [isChangingBowler, setIsChangingBowler] = React.useState(false);
  const [currentShot, setCurrentShot] = React.useState<{ angle: number; distance: number } | null>(null);
  const [forecast, setForecast] = React.useState<MatchForecast | null>(null);
  const [wagonWheelView, setWagonWheelView] = React.useState<WagonWheelView>('team');
  const [milestone, setMilestone] = React.useState<number | null>(null);
  const [boundary, setBoundary] = React.useState<number | null>(null);
  const [wicketEvent, setWicketEvent] = React.useState<boolean>(false);
  const [isDuck, setIsDuck] = React.useState(false);
  const [isHatTrick, setIsHatTrick] = React.useState(false);
  const [isMaidenOver, setIsMaidenOver] = React.useState(false);

  const defaultExtras = { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, partnership: 0 };
  const defaultLiveScore = { runs: 0, wickets: 0, overs: 0, balls: 0, currentOver: [], batsmenOut: [], liveInnings: 1, shots: [], batsmanStats: {}, bowlerStats: {}, extras: defaultExtras, bowlingAngle: 'Over the Wicket' as BowlingAngle, ballHistory: [], fallOfWickets: [] };

  const [liveScore, setLiveScore] = React.useState<LiveScore>({
      ...defaultLiveScore,
      ...match.liveScore,
      extras: { ...defaultExtras, ...match.liveScore?.extras },
      bowlingAngle: match.liveScore?.bowlingAngle || 'Over the Wicket',
      ballHistory: match.liveScore?.ballHistory || [],
      fallOfWickets: match.liveScore?.fallOfWickets || [],
  });
  
  const updateWinProbability = React.useCallback(() => {
    startUpdateGeneration(async () => {
        try {
            const result = await generateLiveMatchUpdateAction(match.matchId);
            setLiveUpdate(result);
        } catch(error) {
             toast({ title: "Error", description: "Could not fetch win probability.", variant: "destructive" });
        }
    });
  }, [match.matchId, toast]);

  React.useEffect(() => {
    getMatchForecastAction(match.matchId).then(data => {
        if (!("error" in data)) setForecast(data);
    });
    if (match.status === 'live') {
      updateWinProbability();
    }
  }, [match.matchId, match.status, updateWinProbability]);
  
  React.useEffect(() => {
    setLiveScore({
        ...defaultLiveScore,
        ...match.liveScore,
        extras: { ...defaultExtras, ...match.liveScore?.extras },
        bowlingAngle: match.liveScore?.bowlingAngle || 'Over the Wicket',
        ballHistory: match.liveScore?.ballHistory || [],
        fallOfWickets: match.liveScore?.fallOfWickets || [],
    });
  }, [match.liveScore]);

  const batsmenOut = liveScore.batsmenOut || [];
  
  const isFirstInnings = liveScore.liveInnings === 1;
  const battingTeam = isFirstInnings ? { id: match.teamAId, name: match.teamAName, abbrev: match.teamAAbbreviation, logoUrl: match.teamALogoUrl, teamColor: match.teamAColor } : { id: match.teamBId, name: match.teamBName, abbrev: match.teamBAbbreviation, logoUrl: match.teamBLogoUrl, teamColor: match.teamBColor };
  const bowlingTeam = isFirstInnings ? { id: match.teamBId, name: match.teamBName, abbrev: match.teamBAbbreviation, logoUrl: match.teamBLogoUrl, teamColor: match.teamBColor } : { id: match.teamAId, name: match.teamAName, abbrev: match.teamAAbbreviation, logoUrl: match.teamALogoUrl, teamColor: match.teamAColor };
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
  
  const needsNewBowler = endOfOver && !isAllOut && !isOversFinished;
  
  const needsPlayerSelection = !liveScore.onStrikeBatsmanId || !liveScore.nonStrikerBatsmanId || !liveScore.bowlerId || needsNewBatsman || needsNewBowler || (liveScore.overs === 0 && liveScore.balls === 0 && liveScore.liveInnings === 2);
  const isReadyToScore = !needsPlayerSelection && !isChangingBowler;

  
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

  const getBatsmanDisplay = (personId: string | undefined | null) => {
    if (!personId) return { name: 'SELECT...', runs: '', balls: '', isNotOut: false };
    const player = battingTeamRoster.find(p => p.personId === personId);
    if (!player) return { name: 'Unknown', runs: '', balls: '', isNotOut: false };
    
    const stats = liveScore.batsmanStats?.[personId] || { runs: 0, balls: 0 };
    const isNotOut = !liveScore.batsmenOut?.includes(personId);

    return { 
        name: getDisplayName(personId, battingTeamRoster), 
        runs: stats.runs.toString(),
        balls: stats.balls.toString(),
        isNotOut,
    };
  };

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
        if (isChangingBowler) setIsChangingBowler(false);
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
             if (eventData.runs === 4 || eventData.runs === 6) {
                setBoundary(eventData.runs);
                setTimeout(() => setBoundary(null), 4000);
            }
            if (eventData.event === 'W') {
                setWicketEvent(true);
                setTimeout(() => setWicketEvent(false), 4000);
            }
            if (result?.isHatTrick) {
                setIsHatTrick(true);
                setTimeout(() => setIsHatTrick(false), 5000);
            }
            if (result?.isDuck) {
                setIsDuck(true);
                setTimeout(() => setIsDuck(false), 5000);
            }
            if (result?.isMaidenOver) {
                setIsMaidenOver(true);
                setTimeout(() => setIsMaidenOver(false), 5000);
            }
            updateWinProbability();
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
            updateWinProbability();
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

  const handleUndo = (reason: string) => {
    startTransition(async () => {
        try {
            await undoLastBallAction(match.matchId, reason);
            toast({ title: "Action Undone", description: "The last recorded ball has been removed."});
            updateWinProbability();
        } catch(error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not undo action.", variant: "destructive" });
        } finally {
            setIsUndoDialogOpen(false);
        }
    });
  };
  
  const handleChangeBowler = () => {
    setIsChangingBowler(true);
  };

  const onStrikePlayer = getBatsmanDisplay(onStrikeBatsmanId);
  const nonStrikerPlayer = getBatsmanDisplay(nonStrikerBatsmanId);
  const bowlerStats = liveScore.bowlerStats?.[bowlerId || ''] || { wickets: 0, runsConceded: 0, overs: 0, balls: 0, maidens: 0 };
  
  const getBallColor = (ball: string) => {
    if (ball.toLowerCase().startsWith('w')) return 'bg-red-500';
    if (ball === '4') return 'bg-blue-500';
    if (ball === '6') return 'bg-purple-500';
    if (ball.toLowerCase().includes('wd')) return 'bg-fuchsia-500';
    if (ball === '.') return 'bg-gray-500';
    return 'bg-pink-500';
  }
  
  const getBallDisplay = (ball: string): string => {
    if (ball.toLowerCase().includes('wd')) {
      const runs = parseInt(ball.replace(/[^0-9]/g, '')) || 0;
      return runs > 0 ? `${runs}WD` : 'WD';
    }
     if (ball.toLowerCase().startsWith('nb')) {
      const runs = parseInt(ball.replace(/[^0-9]/g, '')) || 0;
      return runs > 0 ? `${runs}NB` : 'NB';
    }
    return ball.toUpperCase();
  }

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
        <div className="bg-gray-900 text-white rounded-lg p-4 space-y-4 relative overflow-hidden">
            {boundary && <BoundaryAnimation runs={boundary} />}
            {wicketEvent && <WicketAnimation />}
            {isHatTrick && <HatTrickAnimation />}
            {isDuck && <DuckAnimation />}
            {isMaidenOver && <MaidenOverAnimation />}

             <div className="flex items-center justify-center gap-2">
                <Avatar className="h-12 w-12 border-2 border-white/50">
                    <AvatarImage src={match.teamALogoUrl} />
                    <AvatarFallback>{match.teamAAbbreviation}</AvatarFallback>
                </Avatar>

                <div className="relative flex items-center h-16 bg-gray-800 rounded-full shadow-lg flex-1">
                    <div className="flex items-center justify-center px-4 h-full bg-primary text-primary-foreground rounded-full">
                        <p className="font-bold text-lg">{battingTeam.abbrev}</p>
                        <p className="font-bold text-lg mx-2">v</p>
                        <p className="font-bold text-lg">{bowlingTeam.abbrev}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-4 h-full px-6">
                        <p className="font-bold text-4xl">{liveScore.runs}/{liveScore.wickets}</p>
                        <div className="text-left">
                            <p className="font-bold text-xl">{liveScore.overs}.{liveScore.balls || 0}</p>
                            <p className="text-xs uppercase tracking-wider text-gray-400 -mt-1">OVERS</p>
                        </div>
                    </div>
                </div>

                <Avatar className="h-12 w-12 border-2 border-white/50">
                    <AvatarImage src={match.teamBLogoUrl} />
                    <AvatarFallback>{match.teamBAbbreviation}</AvatarFallback>
                </Avatar>
            </div>
            
            <div className="text-sm font-semibold flex justify-between items-center px-4">
                <span>1st Innings: {match.firstInningsTotal || 0}</span>
                {!isFirstInnings && match.firstInningsTotal != null && (
                    <span className="text-white font-bold text-lg">TARGET {match.firstInningsTotal + 1}</span>
                )}
            </div>

            <div className="relative flex items-center h-10 bg-gray-800 rounded-full p-1 mx-auto max-w-lg shadow-lg">
                <div className="flex items-center justify-between px-4 py-1 h-8 rounded-full bg-primary text-primary-foreground w-1/2">
                    <span className="font-bold text-base">{onStrikePlayer.name}*</span>
                    <span className="text-base">{onStrikePlayer.runs} <span className="text-sm text-gray-300">({onStrikePlayer.balls})</span></span>
                </div>
                <div className="flex items-center justify-between px-4 py-1 h-8 w-1/2 bg-gray-700 rounded-r-full">
                    <span className="font-bold text-base opacity-80">{nonStrikerPlayer.name}</span>
                    <span className="text-base opacity-80">{nonStrikerPlayer.runs} <span className="text-sm text-gray-300">({nonStrikerPlayer.balls})</span></span>
                </div>
            </div>
            
             <div className="flex flex-col items-center justify-center space-y-2 text-sm text-gray-300 px-4">
                <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold">{getDisplayName(bowlerId, bowlingTeamRoster)}</span>
                    <span className="text-xs text-muted-foreground">{bowlerStats.runsConceded}/{bowlerStats.wickets} ({bowlerStats.overs}.{bowlerStats.balls || 0})</span>
                </div>
                <div className="flex items-center justify-center gap-2 min-h-[24px]">
                    {liveScore.currentOver.map((ball, i) => (
                        <div key={i} className={cn("h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs text-white", getBallColor(ball))}>
                            {getBallDisplay(ball)}
                        </div>
                    ))}
                </div>
            </div>
             <Separator className="bg-white/10" />
            <div className="text-center text-xs text-gray-400 flex items-center justify-around flex-wrap gap-x-4 gap-y-1">
                 <div className="flex items-center gap-1.5"><Trophy className="h-3 w-3" /><span>{match.competitionName}</span></div>
                 <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /><span>{format(match.dateTime, 'dd MMM yyyy')}</span></div>
                 <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Innings {liveScore.liveInnings}</span></div>
                 <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /><span>{match.fieldName}</span></div>
                 {forecast && <>
                    <div className="flex items-center gap-1.5"><WeatherIcon condition={forecast.details.condition} className="h-3 w-3" /><span>{forecast.details.condition}</span></div>
                    <div className="flex items-center gap-1.5"><Thermometer className="h-3 w-3" /><span>{forecast.details.temperature}°C</span></div>
                 </>}
            </div>
        </div>
        <Tabs defaultValue="live">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="live">Live Scoring</TabsTrigger>
              <TabsTrigger value="scorecard">Full Scorecard</TabsTrigger>
              <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="mt-4">
              {isChangingBowler ? (
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>Change Bowler (Mid-over)</CardTitle>
                            <CardDescription>Select a new bowler to complete the over.</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setIsChangingBowler(false)}>Cancel</Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <Select onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending || isSimulating}>
                              <SelectTrigger><SelectValue placeholder="Select new bowler" /></SelectTrigger>
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
                      </CardContent>
                  </Card>
              ) : needsPlayerSelection ? (
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
                          ) : (
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                      <Label>On-Strike Batsman</Label>
                                      <Select onValueChange={(val) => handlePlayerSelection('onStrike', val)} disabled={isPending || isSimulating}>
                                          <SelectTrigger><SelectValue placeholder="Select on-strike batsman"/></SelectTrigger>
                                          <SelectContent>{availableBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{getDisplayName(p.personId, battingTeamRoster)}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                     <div className="space-y-2">
                                      <Label>Non-Striker</Label>
                                       <Select onValueChange={(val) => handlePlayerSelection('nonStriker', val)} disabled={isPending || isSimulating}>
                                          <SelectTrigger><SelectValue placeholder="Select non-striker"/></SelectTrigger>
                                          <SelectContent>{availableBatsmen.map(p => <SelectItem key={p.personId} value={p.personId}>{getDisplayName(p.personId, battingTeamRoster)}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                     <div className="space-y-2">
                                      <Label>Opening Bowler</Label>
                                      <Select onValueChange={(val) => handlePlayerSelection('bowler', val)} disabled={isPending || isSimulating}>
                                        <SelectTrigger><SelectValue placeholder="Select opening bowler"/></SelectTrigger>
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
                               </div>
                          )}
                      </CardContent>
                  </Card>
              ) : (isAllOut || isOversFinished) ? (
                  <Card className="p-8 text-center bg-muted">
                      <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                      <h3 className="mt-4 text-xl font-bold">Innings Over</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{isAllOut ? 'All 10 wickets have fallen.' : 'The 20 overs have been completed.'}</p>
                      <Button onClick={handleEndInnings} className="mt-4" disabled={isPending || isSimulating}>
                          {isFirstInnings ? "End Innings & Start 2nd" : "End Match"} <ArrowRight />
                      </Button>
                  </Card>
              ) : (isReadyToScore && !isAllOut && !isOversFinished && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-4">
                          <Card>
                              <CardHeader>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div>
                                          <CardTitle>Scoring Controls</CardTitle>
                                          <CardDescription>Select bowling angle, then tap the field where the ball was hit.</CardDescription>
                                      </div>
                                      <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                          <Button onClick={() => setWagonWheelView('team')} size="sm" variant={wagonWheelView === 'team' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs">Team</Button>
                                          <Button onClick={() => setWagonWheelView('on-strike')} size="sm" variant={wagonWheelView === 'on-strike' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs">On-strike</Button>
                                          <Button onClick={() => setWagonWheelView('non-striker')} size="sm" variant={wagonWheelView === 'non-striker' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs">Non-striker</Button>
                                      </div>
                                  </div>
                              </CardHeader>
                              <CardContent>
                                  <div className="space-y-4">
                                      <RadioGroup onValueChange={(val) => handlePlayerSelection('bowlingAngle', val)} value={liveScore.bowlingAngle} className="flex items-center justify-center gap-2" disabled={isPending || isSimulating}>
                                          <Label htmlFor="angle-over" className={cn("flex items-center gap-1.5 rounded-md border-2 p-1 px-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer", liveScore.bowlingAngle === 'Over the Wicket' ? 'border-primary' : 'border-muted bg-popover')}>
                                              <RadioGroupItem value="Over the Wicket" id="angle-over" className="sr-only" />
                                              <CornerUpRight className="h-4 w-4" /> Over the Wicket
                                          </Label>
                                          <Label htmlFor="angle-round" className={cn("flex items-center gap-1.5 rounded-md border-2 p-1 px-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer", liveScore.bowlingAngle === 'Round the Wicket' ? 'border-primary' : 'border-muted bg-popover')}>
                                              <RadioGroupItem value="Round the Wicket" id="angle-round" className="sr-only" />
                                              <CornerUpLeft className="h-4 w-4" /> Round the Wicket
                                          </Label>
                                      </RadioGroup>
                                      <div className="flex justify-center pt-4">
                                          <WagonWheel
                                              onShotSelect={handleShotSelect}
                                              disabled={isPending || isSimulating || needsNewBatsman}
                                              shots={wagonWheelShots}
                                          />
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                          <FallOfWicketCard fow={liveScore.fallOfWickets} />
                      </div>
                      <div className="lg:col-span-1 space-y-4">
                          <Card>
                              <CardHeader>
                                  <CardTitle>Win Probability</CardTitle>
                              </CardHeader>
                               <CardContent className="min-h-[10rem] flex flex-col justify-center">
                                  {isGeneratingUpdate ? (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                      <p className="mt-2 text-sm">Calculating...</p>
                                    </div>
                                  ) : liveUpdate ? (
                                      <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-left">
                                                    <p className="font-bold">{isFirstInnings ? match.teamAName : match.teamBName}</p>
                                                    <p className="text-2xl font-bold text-blue-500">{liveUpdate.winProbability}%</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{isFirstInnings ? match.teamBName : match.teamAName}</p>
                                                    <p className="text-2xl font-bold text-green-500">{100 - liveUpdate.winProbability}%</p>
                                                </div>
                                            </div>
                                            <Progress value={liveUpdate.winProbability} indicatorClassName="bg-blue-500" className="h-2 [&>div]:bg-green-500" />
                                            <div className="text-xs text-muted-foreground flex justify-between">
                                                <span>{battingTeam.abbrev} {liveUpdate.winProbability}% ({liveScore.runs}/{liveScore.wickets}, {liveScore.overs}.{liveScore.balls || 0} overs)</span>
                                                <span>{bowlingTeam.abbrev} {100 - liveUpdate.winProbability}%</span>
                                            </div>
                                      </div>
                                  ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>Win probability will appear here.</p>
                                    </div>
                                  )}
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                              <CardContent className="flex flex-col gap-2">
                                  <Button onClick={handleSimulateBall} variant="secondary" className="w-full" disabled={isSimulating || isPending}>
                                      <Bot className={cn('mr-2 h-4 w-4', isSimulating && 'animate-pulse')} />
                                      Simulate Ball
                                  </Button>
                                  <Button onClick={() => setIsUndoDialogOpen(true)} variant="secondary" className="w-full" disabled={!canUndo || isPending || isSimulating}>
                                      <Undo className="mr-2 h-4 w-4" />
                                      Undo Last Ball
                                  </Button>
                                   <Button onClick={handleChangeBowler} variant="secondary" className="w-full" disabled={isPending || isSimulating}>
                                      <Repeat className="mr-2 h-4 w-4" />
                                      Change Bowler
                                  </Button>
                                  <Button onClick={handleEndInnings} className="w-full" disabled={!canEndInnings || isPending || isSimulating}>
                                      {isFirstInnings ? "End Innings" : "End Match"}
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                              </CardContent>
                          </Card>
                      </div>
                  </div>
              ))}
            </TabsContent>
            
            <TabsContent value="scorecard" className="mt-4">
                 <Tabs defaultValue="innings1">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="innings1">{isFirstInnings ? battingTeam.name : bowlingTeam.name} Innings</TabsTrigger>
                        <TabsTrigger value="innings2" disabled={isFirstInnings}>{isFirstInnings ? bowlingTeam.name : battingTeam.name} Innings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="innings1" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Innings 1 Scorecard</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <h3 className="font-semibold">{isFirstInnings ? battingTeam.name : bowlingTeam.name} Batting</h3>
                                    <LiveBattingCard batsmanStats={isFirstInnings ? liveScore.batsmanStats : (match.firstInningsLiveScore?.batsmanStats || {})} roster={isFirstInnings ? battingTeamRoster : bowlingTeamRoster} batsmenOut={isFirstInnings ? batsmenOut : (match.firstInningsLiveScore?.batsmenOut || [])} />
                                     <Separator />
                                     <h3 className="font-semibold">{isFirstInnings ? bowlingTeam.name : battingTeam.name} Bowling</h3>
                                    <LiveBowlingCard bowlerStats={isFirstInnings ? liveScore.bowlerStats : (match.firstInningsLiveScore?.bowlerStats || {})} roster={isFirstInnings ? bowlingTeamRoster : battingTeamRoster} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="innings2" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Innings 2 Scorecard</CardTitle></CardHeader>
                            <CardContent>
                               <div className="space-y-4">
                                    <h3 className="font-semibold">{battingTeam.name} Batting</h3>
                                    <LiveBattingCard batsmanStats={liveScore.batsmanStats} roster={battingTeamRoster} batsmenOut={batsmenOut} />
                                     <Separator />
                                     <h3 className="font-semibold">{bowlingTeam.name} Bowling</h3>
                                    <LiveBowlingCard bowlerStats={liveScore.bowlerStats} roster={bowlingTeamRoster} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="partnerships" className="mt-4">
                 <Tabs defaultValue="innings1">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="innings1">{isFirstInnings ? battingTeam.name : bowlingTeam.name} Partnerships</TabsTrigger>
                        <TabsTrigger value="innings2" disabled={isFirstInnings}>{isFirstInnings ? bowlingTeam.name : battingTeam.name} Partnerships</TabsTrigger>
                    </TabsList>
                    <TabsContent value="innings1" className="mt-4">
                        <PartnershipCard partnerships={isFirstInnings ? liveScore.partnerships : match.firstInningsLiveScore?.partnerships} />
                    </TabsContent>
                    <TabsContent value="innings2" className="mt-4">
                        <PartnershipCard partnerships={isFirstInnings ? undefined : liveScore.partnerships} />
                    </TabsContent>
                 </Tabs>
            </TabsContent>
        </Tabs>
    </div>
    <ScoringDialog 
        open={isScoringDialogOpen}
        onOpenChange={setIsScoringDialogOpen}
        onScore={handleRecordBall}
        bowlingTeamRoster={bowlingTeamRoster}
    />
    <UndoDialog
        open={isUndoDialogOpen}
        onOpenChange={setIsUndoDialogOpen}
        onConfirm={handleUndo}
    />
    </>
  );
}
