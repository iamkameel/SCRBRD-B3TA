
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Calendar, Clock, Trash2, RefreshCcw, ArrowLeft, Sun, Cloudy, CloudRain, Wind, Thermometer, Loader2, Bus, BarChart, Settings, ClipboardList, Download, Award, PlayCircle, Wand2, RadioTower, Users, Trophy, MapPin, BrainCircuit, CheckCircle, HelpCircle, Film, BarChartHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assignOfficialToMatchAction, removeOfficialFromMatchAction } from '@/lib/actions/matches';
import { generateAndSaveScorecardAction, generateMatchReportAction, getMatchForecastAction, generateMatchPreviewAction, generateMatchCommentaryAction, generateOppositionAnalysisAction, generatePlayerPerformanceForecastAction, generateHighlightReelAction } from '@/lib/actions/analysis';
import { assignVehicleToMatchAction, removeVehicleFromMatchAction } from '@/lib/actions/transport';
import type { Match, Person, Official, Innings, MatchForecast, Vehicle, TransportAssignment, PlayerPerformanceForecast, HighlightReelOutput, RosterMemberWithStats } from "@/lib/data";
import { Scorecard } from "./scorecard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LiveScoringInterface } from "./live-scoring-interface";
import { useAuth } from "@/lib/auth-context";
import { LineupManager } from "./lineup-manager";
import { ManhattanChart, WormChart, WagonWheelSummary } from "./match-charts";

const officialAssignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type OfficialAssignmentFormValues = z.infer<typeof officialAssignmentSchema>;

const OFFICIAL_ROLES = ["Umpire", "Scorer"];

function AssignOfficialDialog({ matchId, people }: { matchId: string, people: Person[]}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<OfficialAssignmentFormValues>({
    resolver: zodResolver(officialAssignmentSchema),
    defaultValues: { role: "Umpire" },
  });

  function onSubmit(data: OfficialAssignmentFormValues) {
    startTransition(async () => {
      try {
        await assignOfficialToMatchAction(matchId, data);
        toast({
          title: "Official Assigned",
          description: `The person has been assigned to the match.`,
        });
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not assign official.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isPending}>
          <PlusCircle className="mr-2" />
          Assign Official
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Official to Match</DialogTitle>
          <DialogDescription>Select a person and their role for this match.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {people.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="Umpire" disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {OFFICIAL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Assigning..." : "Assign to Match"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const transportAssignmentSchema = z.object({
  vehicleId: z.string({ required_error: "Please select a vehicle." }),
  driverId: z.string({ required_error: "Please select a driver." }),
});
type TransportAssignmentFormValues = z.infer<typeof transportAssignmentSchema>;

function AssignTransportDialog({ matchId, vehicles, drivers, transportAssignments }: { matchId: string; vehicles: Vehicle[]; drivers: Person[]; transportAssignments: TransportAssignment[] }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const availableVehicles = vehicles.filter(v => !transportAssignments.some(a => a.vehicleId === v.vehicleId));
  const availableDrivers = drivers.filter(d => !transportAssignments.some(a => a.driverId === d.personId));

  const form = useForm<TransportAssignmentFormValues>({
    resolver: zodResolver(transportAssignmentSchema),
  });

  function onSubmit(data: TransportAssignmentFormValues) {
    startTransition(async () => {
      try {
        await assignVehicleToMatchAction(matchId, data);
        toast({ title: "Vehicle Assigned", description: "The vehicle and driver have been assigned to this match." });
        setOpen(false);
        form.reset();
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not assign vehicle.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Assign Vehicle</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Vehicle &amp; Driver</DialogTitle><DialogDescription>Assign transport for this match.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="vehicleId" render={({ field }) => (
              <FormItem><FormLabel>Vehicle</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a vehicle" /></SelectTrigger></FormControl><SelectContent>{availableVehicles.map(v => <SelectItem key={v.vehicleId} value={v.vehicleId}>{v.name} ({v.type} - {v.capacity} seats)</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="driverId" render={({ field }) => (
              <FormItem><FormLabel>Driver</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a driver" /></SelectTrigger></FormControl><SelectContent>{availableDrivers.map(d => <SelectItem key={d.personId} value={d.personId}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Assigning..." : "Assign"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ScorecardPlaceholder() {
  return (
    <div className="text-center text-muted-foreground py-8 px-4">
        <p className="font-semibold">No scorecard exists for this match yet.</p>
        <p>A scorecard can be generated once lineups are set and the match status is 'scheduled'.</p>
    </div>
  );
}

function WeatherIcon({ condition, ...props }: { condition: string } & React.ComponentProps<typeof Sun>) {
    switch (condition.toLowerCase()) {
        case "sunny": return <Sun {...props} />;
        case "cloudy": return <Cloudy {...props} />;
        case "rain":
        case "showers":
        case "storm":
             return <CloudRain {...props} />;
        default: return <Cloudy {...props} />;
    }
}

interface MatchDetailsClientProps {
  match: Match;
  initialOfficials: Official[];
  people: Person[];
  teamARosterWithStats: RosterMemberWithStats[];
  teamBRosterWithStats: RosterMemberWithStats[];
  teamALineup: string[];
  teamBLineup: string[];
  scorecard: { innings1: Innings, innings2: Innings } | null;
  transportAssignments: TransportAssignment[];
  vehicles: Vehicle[];
  drivers: Person[];
}

export default function MatchDetailsClient({ 
    match, initialOfficials, people, 
    teamARosterWithStats, teamBRosterWithStats, 
    teamALineup, teamBLineup, scorecard, 
    transportAssignments, vehicles, drivers 
}: MatchDetailsClientProps) {
  const { toast } = useToast();
  const { person } = useAuth();
  const [isClient, setIsClient] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [isGenerating, startGenerationTransition] = React.useTransition();
  const [isGeneratingReport, startReportGeneration] = React.useTransition();
  const [isGeneratingPreview, startPreviewGeneration] = React.useTransition();
  const [isGeneratingCommentary, startCommentaryGeneration] = React.useTransition();
  const [isFetchingForecast, startForecastTransition] = React.useTransition();
  const [selectedOfficial, setSelectedOfficial] = React.useState<Official | null>(null);
  const [selectedTransport, setSelectedTransport] = React.useState<TransportAssignment | null>(null);
  const [isDeleteOfficialDialogOpen, setIsDeleteOfficialDialogOpen] = React.useState(false);
  const [isDeleteTransportDialogOpen, setIsDeleteTransportDialogOpen] = React.useState(false);
  const [forecast, setForecast] = React.useState<MatchForecast | null>(null);
  const [isGeneratingAnalysis, startAnalysisGeneration] = React.useTransition();
  const [analyzedTeamId, setAnalyzedTeamId] = React.useState<string | null>(null);
  const [isGeneratingHighlights, startHighlightsGeneration] = React.useTransition();
  const [highlightReel, setHighlightReel] = React.useState<HighlightReelOutput | null>(null);

  const [isGeneratingForecast, startForecastGeneration] = React.useTransition();
  const [forecastedPlayer, setForecastedPlayer] = React.useState<string>('');
  const [forecastResult, setForecastResult] = React.useState<PlayerPerformanceForecast | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const playersInMatch = React.useMemo(() => {
    const allPlayers = new Map<string, { name: string; teamName: string }>();
    teamARosterWithStats.forEach(p => {
        if (teamALineup.includes(p.personId)) {
            allPlayers.set(p.personId, { name: p.personName, teamName: match.teamAName });
        }
    });
    teamBRosterWithStats.forEach(p => {
        if (teamBLineup.includes(p.personId)) {
            allPlayers.set(p.personId, { name: p.personName, teamName: match.teamBName });
        }
    });
    return Array.from(allPlayers.entries()).map(([id, data]) => ({ id, ...data }));
  }, [teamARosterWithStats, teamBRosterWithStats, teamALineup, teamBLineup, match.teamAName, match.teamBName]);

  const handleGenerateForecast = () => {
    if (!forecastedPlayer) {
        toast({ title: 'Player not selected', description: 'Please select a player to generate a forecast.', variant: 'destructive' });
        return;
    }
    startForecastGeneration(async () => {
        setForecastResult(null);
        try {
            const result = await generatePlayerPerformanceForecastAction({
                playerId: forecastedPlayer,
                matchId: match.matchId,
            });
            setForecastResult(result);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate forecast.", variant: "destructive" });
        }
    });
  };

  const handleRemoveOfficial = () => {
    if (!selectedOfficial) return;
    startTransition(async () => {
      try {
        await removeOfficialFromMatchAction(match.matchId, selectedOfficial.assignmentId);
        toast({ title: "Official Removed", description: `${selectedOfficial.personName} has been removed from the match.` });
        setIsDeleteOfficialDialogOpen(false);
        setSelectedOfficial(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove official.", variant: "destructive" });
        setIsDeleteOfficialDialogOpen(false);
        setSelectedOfficial(null);
      }
    });
  };

  const handleRemoveTransport = () => {
    if (!selectedTransport) return;
    startTransition(async () => {
      try {
        await removeVehicleFromMatchAction(match.matchId, selectedTransport.assignmentId);
        toast({ title: "Transport Removed", description: `${selectedTransport.vehicleName} has been removed from the match.` });
        setIsDeleteTransportDialogOpen(false);
        setSelectedTransport(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove transport.", variant: "destructive" });
        setIsDeleteTransportDialogOpen(false);
        setSelectedTransport(null);
      }
    });
  };

  const handleGenerateScorecard = () => {
    startGenerationTransition(async () => {
        try {
            const result = await generateAndSaveScorecardAction(match.matchId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate scorecard.", variant: "destructive" });
        }
    });
  };
  
  const handleGenerateReport = () => {
    startReportGeneration(async () => {
        try {
            const result = await generateMatchReportAction(match.matchId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate report.", variant: "destructive" });
        }
    });
  };

  const handleGenerateCommentary = () => {
    startCommentaryGeneration(async () => {
        try {
            const result = await generateMatchCommentaryAction(match.matchId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate commentary.", variant: "destructive" });
        }
    });
  };
  
  const handleGeneratePreview = () => {
    startPreviewGeneration(async () => {
        try {
            const result = await generateMatchPreviewAction(match.matchId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate preview.", variant: "destructive" });
        }
    });
  };

  const handleGetForecast = () => {
    startForecastTransition(async () => {
        try {
            const result = await getMatchForecastAction(match.matchId);
            if ('error' in result) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setForecast(null);
            } else {
                setForecast(result);
            }
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not fetch forecast.", variant: "destructive" });
        }
    });
  };

  const handleGenerateAnalysis = (teamToAnalyzeId: string) => {
    setAnalyzedTeamId(teamToAnalyzeId);
    startAnalysisGeneration(async () => {
        try {
            const result = await generateOppositionAnalysisAction(match.matchId, teamToAnalyzeId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
             toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate analysis.", variant: "destructive" });
        } finally {
            setAnalyzedTeamId(null);
        }
    });
  };

  const handleDownloadReport = () => {
    if (!match.report) return;
    const blob = new Blob([match.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match-report-${match.teamAName}-vs-${match.teamBName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleGenerateHighlights = () => {
    startHighlightsGeneration(async () => {
        setHighlightReel(null);
        try {
            const result = await generateHighlightReelAction(match.matchId);
            setHighlightReel(result);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate highlights.", variant: "destructive" });
        }
    });
  };

  const innings1 = scorecard?.innings1;
  const innings2 = scorecard?.innings2;

  const firstInnings = innings1?.teamName === match.teamAName ? innings1 : (innings2?.teamName === match.teamAName ? innings2 : undefined);
  const secondInnings = innings1?.teamName === match.teamBName ? innings1 : (innings2?.teamName === match.teamBName ? innings2 : undefined);
  const canGenerateScorecard = teamALineup.length === 11 && teamBLineup.length === 11;


  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
            <Link href="/matches" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />Back to Matches
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{match.teamAName} vs {match.teamBName || 'TBD'}</h1>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                        {match.competitionName && <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /> {match.competitionName}</span>}
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {isClient ? format(match.dateTime, "PPP") : '...'}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {isClient ? format(match.dateTime, "p") : '...'}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{match.fieldName}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge
                        variant={
                            match.status === 'completed' ? 'secondary' :
                            match.status === 'live' ? 'destructive' :
                            ['postponed', 'cancelled', 'abandoned'].includes(match.status) ? 'outline' :
                            'default'
                        }
                        className={cn("capitalize h-fit", match.status === 'live' && "bg-red-500 text-white animate-pulse")}
                    >
                        {match.status}
                    </Badge>
                    {match.statusReason && <p className="text-xs text-muted-foreground">{match.statusReason}</p>}
                </div>
            </div>
        </header>

        <Tabs defaultValue="scorecard" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="scorecard"><ClipboardList className="mr-2 h-4 w-4" />Scorecard</TabsTrigger>
                <TabsTrigger value="visuals" disabled={match.status !== 'completed'}><BarChartHorizontal className="mr-2 h-4 w-4"/>Visuals</TabsTrigger>
                <TabsTrigger value="lineups" disabled={match.status === 'completed'}><Users className="mr-2 h-4 w-4" />Lineups</TabsTrigger>
                <TabsTrigger value="analysis"><BarChart className="mr-2 h-4 w-4"/>Analysis</TabsTrigger>
                <TabsTrigger value="highlights"><Film className="mr-2 h-4 w-4"/>Highlights</TabsTrigger>
                <TabsTrigger value="logistics"><Bus className="mr-2 h-4 w-4" />Logistics</TabsTrigger>
            </TabsList>

            <TabsContent value="scorecard" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>
                                    {match.status === 'live' ? 'Live Scoring Interface' : 'Match Scorecard'}
                                </CardTitle>
                                <CardDescription>
                                    {match.status === 'live' ? 'Enter ball-by-ball data here.' : (match.status === 'completed' ? 'Detailed match scorecard for both innings.' : 'Generate a scorecard once lineups are set.')}
                                </CardDescription>
                            </div>
                             <div className="flex items-center gap-2 mt-4 md:mt-0">
                                {match.status === 'scheduled' && !innings1 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="inline-block">
                                                    <Button onClick={handleGenerateScorecard} disabled={!canGenerateScorecard || isGenerating}>
                                                        <RefreshCcw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                                        {isGenerating ? "Generating..." : "Generate Scorecard"}
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            {!canGenerateScorecard && (
                                                <TooltipContent>
                                                    <p>Select 11 players for each team to enable generation.</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                {match.status === 'completed' && innings1 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" disabled={isGenerating}>
                                                <RefreshCcw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                                {isGenerating ? "Regenerating..." : "Regenerate Scorecard"}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will generate a new scorecard, permanently overwriting the current one. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isGenerating}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleGenerateScorecard} disabled={isGenerating}>
                                                    {isGenerating ? "Regenerating..." : "Yes, Regenerate"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {match.status === 'live' ? (
                            <LiveScoringInterface
                                teamARoster={teamARosterWithStats}
                                teamBRoster={teamBRosterWithStats}
                                match={match}
                            />
                        ) : (
                            (innings1 && innings2) ? (
                                <Tabs defaultValue="team-a-innings-scorecard">
                                    <TabsList>
                                        <TabsTrigger value="team-a-innings-scorecard">{match.teamAName}</TabsTrigger>
                                        <TabsTrigger value="team-b-innings-scorecard">{match.teamBName}</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="team-a-innings-scorecard" className="mt-4">
                                        {firstInnings ? <Scorecard innings={firstInnings} /> : <ScorecardPlaceholder />}
                                    </TabsContent>
                                    <TabsContent value="team-b-innings-scorecard" className="mt-4">
                                        {secondInnings ? <Scorecard innings={secondInnings} /> : <ScorecardPlaceholder />}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <ScorecardPlaceholder />
                            )
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="visuals" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <ManhattanChart />
                    <WormChart />
                    <WagonWheelSummary />
                </div>
            </TabsContent>

            <TabsContent value="lineups" className="mt-4">
                 <Tabs defaultValue="team-a-lineup" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="team-a-lineup">{match.teamAName}</TabsTrigger>
                        <TabsTrigger value="team-b-lineup" disabled={!match.teamBId}>{match.teamBName || 'TBD'}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="team-a-lineup" className="mt-4">
                        <LineupManager 
                            key={`team-a-${match.matchId}`}
                            teamId={match.teamAId}
                            teamName={match.teamAName}
                            match={match}
                            rosterWithStats={teamARosterWithStats}
                            initialLineupIds={teamALineup}
                        />
                    </TabsContent>
                     <TabsContent value="team-b-lineup" className="mt-4">
                        {match.teamBId ? (
                            <LineupManager 
                                key={`team-b-${match.matchId}`}
                                teamId={match.teamBId}
                                teamName={match.teamBName}
                                match={match}
                                rosterWithStats={teamBRosterWithStats}
                                initialLineupIds={teamBLineup}
                            />
                        ) : (
                            <Card><CardHeader><CardTitle>{match.teamBName || 'TBD'}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-center">The opposing team will be determined later.</p></CardContent></Card>
                        )}
                    </TabsContent>
                 </Tabs>
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <div className="space-y-4">
                        {match.status === 'scheduled' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div><CardTitle>Match Preview</CardTitle><CardDescription>An AI-generated preview of the upcoming match.</CardDescription></div>
                                        <Button onClick={handleGeneratePreview} disabled={isGeneratingPreview || !match.teamBId}><RefreshCcw className={`mr-2 h-4 w-4 ${isGeneratingPreview ? 'animate-spin' : ''}`} />{isGeneratingPreview ? "Generating..." : (match.preview ? "Regenerate" : "Generate")}</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>{match.preview ? (<p className="text-sm text-foreground/80 whitespace-pre-wrap">{match.preview}</p>) : (<div className="text-center text-muted-foreground py-8"><p>No preview has been generated for this match yet.</p><p className="text-xs">Click the button above to generate one with AI.</p></div>)}</CardContent>
                            </Card>
                        )}
                        {match.status === 'completed' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div><CardTitle>Match Report</CardTitle><CardDescription>A detailed, journalistic report of the match highlights.</CardDescription></div>
                                        <div className="flex items-center gap-2">
                                            {match.report && (
                                                <Button variant="outline" onClick={handleDownloadReport}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </Button>
                                            )}
                                            {innings1 && (<Button onClick={handleGenerateReport} disabled={isGeneratingReport}><RefreshCcw className={`mr-2 h-4 w-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />{isGeneratingReport ? "Generating..." : (match.report ? "Regenerate" : "Generate")}</Button>)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>{match.report ? (<p className="text-sm text-foreground/80 whitespace-pre-wrap">{match.report}</p>) : (<div className="text-center text-muted-foreground py-8"><p>No report has been generated for this match yet.</p>{innings1 && <p className="text-xs">Click the button above to generate one with AI.</p>}{!innings1 && <p className="text-xs">A report can be generated once a scorecard exists.</p>}</div>)}</CardContent>
                            </Card>
                        )}
                        {match.playerOfTheMatch && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Player of the Match</CardTitle>
                                    <CardDescription>AI-selected most valuable player for this match.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <Award className="h-10 w-10 text-accent flex-shrink-0" />
                                        <div>
                                            <p className="text-xl font-bold">{match.playerOfTheMatch.name}</p>
                                            <p className="text-sm text-muted-foreground">{match.playerOfTheMatch.teamName}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm text-foreground/80 whitespace-pre-wrap">{match.playerOfTheMatch.justification}</p>
                                </CardContent>
                            </Card>
                        )}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Audio Commentary</CardTitle>
                                        <CardDescription>An AI-generated audio highlight reel of the match.</CardDescription>
                                    </div>
                                    {match.status === 'completed' && innings1 && (
                                        <Button onClick={handleGenerateCommentary} disabled={isGeneratingCommentary}>
                                            <PlayCircle className={`mr-2 h-4 w-4 ${isGeneratingCommentary ? 'animate-spin' : ''}`} />
                                            {isGeneratingCommentary ? "Generating..." : (match.audioCommentaryUrl ? "Regenerate" : "Generate")}
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {match.audioCommentaryUrl ? (
                                    <audio controls className="w-full">
                                        <source src={match.audioCommentaryUrl} type="audio/wav" />
                                        Your browser does not support the audio element.
                                    </audio>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>No audio commentary has been generated yet.</p>
                                        {match.status === 'completed' && innings1 && <p className="text-xs">Click the button above to generate one with AI.</p>}
                                        {match.status !== 'completed' && <p className="text-xs">Commentary can be generated for completed matches.</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Performance Forecast</CardTitle>
                                <CardDescription>Predict a player's performance based on their stats, form, and match conditions.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Select onValueChange={setForecastedPlayer} value={forecastedPlayer}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a player from the lineup..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {playersInMatch.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.teamName})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleGenerateForecast} disabled={isGeneratingForecast || !forecastedPlayer} className="w-full sm:w-auto">
                                        <Wand2 className={`mr-2 h-4 w-4 ${isGeneratingForecast ? 'animate-spin' : ''}`} />
                                        {isGeneratingForecast ? 'Forecasting...' : 'Get Forecast'}
                                    </Button>
                                </div>

                                {isGeneratingForecast && (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <p className="mt-2 text-sm">AI is analyzing the data...</p>
                                    </div>
                                )}

                                {forecastResult && (
                                    <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                                        <div className="flex items-center gap-4">
                                            <BrainCircuit className="h-10 w-10 text-primary flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-xl">{forecastResult.predictedPerformance}</p>
                                                <p className="text-sm text-muted-foreground">Predicted performance for {playersInMatch.find(p => p.id === forecastedPlayer)?.name}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">Justification</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{forecastResult.justification}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Opposition Analysis</CardTitle>
                                <CardDescription>Generate a strategic scouting report on either team.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(match.status === 'scheduled' && match.teamBId) &&
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Button 
                                            onClick={() => handleGenerateAnalysis(match.teamBId)} 
                                            disabled={isGeneratingAnalysis}
                                            variant="outline"
                                        >
                                            {(isGeneratingAnalysis && analyzedTeamId === match.teamBId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                            Analyze {match.teamBName}
                                        </Button>
                                        <Button 
                                            onClick={() => handleGenerateAnalysis(match.teamAId)} 
                                            disabled={isGeneratingAnalysis}
                                            variant="outline"
                                        >
                                            {(isGeneratingAnalysis && analyzedTeamId === match.teamAId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                            Analyze {match.teamAName}
                                        </Button>
                                    </div>
                                }
                                <div className="space-y-4">
                                    {match.analysisReports?.[match.teamAId] && (
                                        <div className="border p-4 rounded-md bg-muted/50">
                                            <h3 className="font-semibold text-lg mb-2">Scouting Report: {match.teamAName}</h3>
                                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{match.analysisReports[match.teamAId]}</p>
                                        </div>
                                    )}
                                    {match.analysisReports?.[match.teamBId] && (
                                        <div className="border p-4 rounded-md bg-muted/50">
                                            <h3 className="font-semibold text-lg mb-2">Scouting Report: {match.teamBName}</h3>
                                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{match.analysisReports[match.teamBId]}</p>
                                        </div>
                                    )}
                                    {Object.keys(match.analysisReports || {}).length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>No analysis has been generated yet.</p>
                                            {match.status === 'scheduled' && match.teamBId && <p className="text-xs">Click a button above to generate a scouting report.</p>}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between"><div><CardTitle>Weather Forecast</CardTitle><CardDescription>AI-generated forecast for the match day and location.</CardDescription></div><Button onClick={handleGetForecast} disabled={isFetchingForecast}>{isFetchingForecast ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}{isFetchingForecast ? "Fetching..." : (forecast ? "Refresh" : "Get Forecast")}</Button></div>
                            </CardHeader>
                            <CardContent>{!forecast ? (<div className="text-center text-muted-foreground py-8"><p>No weather forecast available.</p><p className="text-xs">Click the button above to fetch the forecast.</p></div>) : (<div><p className="text-sm text-foreground/80 mb-4">{forecast.summary}</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm"><div className="flex items-center gap-2 p-3 rounded-md border"><WeatherIcon condition={forecast.details.condition} className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Condition</span><span className="font-semibold">{forecast.details.condition}</span></div></div><div className="flex items-center gap-2 p-3 rounded-md border"><Thermometer className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Temperature</span><span className="font-semibold">{forecast.details.temperature}°C</span></div></div><div className="flex items-center gap-2 p-3 rounded-md border"><CloudRain className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Precipitation</span><span className="font-semibold">{forecast.details.precipitationChance}%</span></div></div><div className="flex items-center gap-2 p-3 rounded-md border"><Wind className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Wind</span><span className="font-semibold">{forecast.details.windSpeed} km/h</span></div></div></div></div>)}</CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            
            <TabsContent value="highlights" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>AI Highlight Reel</CardTitle>
                                <CardDescription>Key moments from the match, identified by AI.</CardDescription>
                            </div>
                            {match.status === 'completed' && innings1 && (
                                <Button onClick={handleGenerateHighlights} disabled={isGeneratingHighlights}>
                                    <Wand2 className={`mr-2 h-4 w-4 ${isGeneratingHighlights ? 'animate-spin' : ''}`} />
                                    {isGeneratingHighlights ? "Generating..." : (highlightReel ? "Regenerate" : "Generate")}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isGeneratingHighlights && (
                            <div className="flex flex-col items-center justify-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground">Finding key moments...</p>
                            </div>
                        )}
                        {!isGeneratingHighlights && !highlightReel && (
                            <div className="text-center text-muted-foreground py-8">
                                <p>No highlights have been generated for this match yet.</p>
                                {match.status === 'completed' && innings1 && <p className="text-xs">Click the button above to generate them with AI.</p>}
                                {match.status !== 'completed' && <p className="text-xs">Highlights can be generated for completed matches.</p>}
                            </div>
                        )}
                        {!isGeneratingHighlights && highlightReel && (
                            <div className="space-y-6">
                                {highlightReel.highlights.map((highlight, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg bg-muted/30">
                                        <div className="w-full sm:w-48 h-32 relative flex-shrink-0">
                                            <Image 
                                                src={highlight.imageUrl} 
                                                alt={highlight.description} 
                                                fill
                                                className="rounded-md object-cover"
                                                sizes="(max-width: 640px) 100vw, 12rem"
                                                data-ai-hint="cricket action"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Badge variant="secondary" className="mb-2">Over: {highlight.over}</Badge>
                                            <p className="font-medium text-foreground">{highlight.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="logistics" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Transport &amp; Logistics</CardTitle><CardDescription>Manage vehicles and drivers assigned to this match.</CardDescription></div><AssignTransportDialog matchId={match.matchId} vehicles={vehicles} drivers={drivers} transportAssignments={transportAssignments} /></CardHeader>
                        <CardContent><Table><TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Type</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{transportAssignments.length > 0 ? (transportAssignments.map(t => (<TableRow key={t.assignmentId}><TableCell className="font-medium">{t.vehicleName}</TableCell><TableCell>{t.vehicleType}</TableCell><TableCell>{t.driverName}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { setSelectedTransport(t); setIsDeleteTransportDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No transport assigned to this match yet.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Match Officials</CardTitle><CardDescription>Manage the umpires and scorers assigned to this match.</CardDescription></div><AssignOfficialDialog matchId={match.matchId} people={people.filter(p => !initialOfficials.some(o => o.personId === p.personId) && (p.roles.includes('Umpire') || p.roles.includes('Scorer')))} /></CardHeader>
                        <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{initialOfficials.length > 0 ? (initialOfficials.map(official => (<TableRow key={official.assignmentId}><TableCell className="font-medium">{official.personName}</TableCell><TableCell>{official.role}</TableCell><TableCell><Badge variant={official.confirmed ? 'secondary' : 'outline'} className={cn(official.confirmed ? 'bg-green-100 text-green-800' : '')}>{official.confirmed ? <CheckCircle className="mr-1" /> : <HelpCircle className="mr-1" />} {official.confirmed ? "Confirmed" : "Pending"}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { setSelectedOfficial(official); setIsDeleteOfficialDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No officials assigned to this match yet.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={isDeleteOfficialDialogOpen} onOpenChange={setIsDeleteOfficialDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will remove <strong>{selectedOfficial?.personName}</strong> from this match. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOfficial(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveOfficial} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Official"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteTransportDialogOpen} onOpenChange={setIsDeleteTransportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the assignment for <strong>{selectedTransport?.vehicleName}</strong> from this match. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransport(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTransport} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Assignment"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
