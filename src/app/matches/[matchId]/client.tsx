
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Calendar, Clock, Trash2, RefreshCcw, ArrowLeft, Sun, Cloudy, CloudRain, Wind, Thermometer, Loader2, Bus, BarChart, Settings, ClipboardList, Download, Award, PlayCircle, Wand2, RadioTower } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
import { Checkbox } from "@/components/ui/checkbox";
import { assignOfficialToMatchAction, saveMatchLineupAction, removeOfficialFromMatchAction, generateAndSaveScorecardAction, generateMatchReportAction, getMatchForecastAction, generateMatchPreviewAction, generateMatchCommentaryAction, autoSelectLineupAction } from '@/lib/actions/matches';
import { assignVehicleToMatchAction, removeVehicleFromMatchAction } from '@/lib/actions/transport';
import type { Match, Person, Official, Innings, RosterMember, MatchForecast, Vehicle, TransportAssignment } from "@/lib/data";
import { Scorecard } from "./scorecard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const lineupSchema = z.object({
  playerIds: z.array(z.string()).refine(value => value.length > 0, {
    message: "You must select at least one player.",
  }).refine(value => value.length <= 11, {
    message: "You can select a maximum of 11 players."
  }),
});

type LineupFormValues = z.infer<typeof lineupSchema>;

interface LineupSelectionCardProps {
  teamId: string;
  teamName: string;
  matchId: string;
  roster: RosterMember[];
  lineup: string[];
}

function LineupSelectionCard({ teamId, teamName, matchId, roster, lineup }: LineupSelectionCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isAutoSelecting, startAutoSelectTransition] = React.useTransition();

  const form = useForm<LineupFormValues>({
    resolver: zodResolver(lineupSchema),
    defaultValues: {
      playerIds: lineup || [],
    },
  });

  function onSubmit(data: LineupFormValues) {
    startTransition(async () => {
      try {
        await saveMatchLineupAction(matchId, teamId, data.playerIds);
        toast({
          title: "Lineup Saved",
          description: `The lineup for ${teamName} has been updated.`,
        });
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not save lineup.",
          variant: "destructive",
        });
      }
    });
  }
  
  function handleAutoSelect() {
    startAutoSelectTransition(async () => {
      try {
        const { playerIds, justification } = await autoSelectLineupAction(matchId, teamId);
        form.setValue('playerIds', playerIds, { shouldValidate: true, shouldDirty: true });
        toast({ 
          title: "AI Lineup Suggested", 
          description: justification,
          duration: 10000, 
        });
      } catch (error) {
        toast({
          title: "Error Auto-Selecting Team",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  const selectedCount = form.watch('playerIds')?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{teamName} - Select Lineup ({selectedCount}/11)</CardTitle>
        <CardDescription>Select the 11 players for this match.</CardDescription>
      </CardHeader>
      <CardContent>
        {roster.length > 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="playerIds"
                render={() => (
                  <FormItem className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {roster.map((member) => (
                        <FormField
                          key={member.personId}
                          control={form.control}
                          name="playerIds"
                          render={({ field }) => (
                            <FormItem key={member.personId} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(member.personId)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, member.personId])
                                      : field.onChange(field.value?.filter((id) => id !== member.personId));
                                  }}
                                  disabled={isPending || isAutoSelecting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal flex flex-col">
                                {member.personName}
                                <span className="text-xs text-muted-foreground">{member.role}</span>
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-2">
                  <Button type="submit" disabled={isPending || isAutoSelecting}>
                      {isPending ? "Saving..." : `Save ${teamName} Lineup`}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleAutoSelect} disabled={isPending || isAutoSelecting}>
                      <Wand2 className={`mr-2 h-4 w-4 ${isAutoSelecting ? 'animate-spin' : ''}`} />
                      {isAutoSelecting ? 'Selecting...' : 'Auto-Select'}
                  </Button>
              </div>
            </form>
          </Form>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No players on this team's roster. Add players on the <Link href={`/teams/${teamId}`} className="underline">team page</Link>.
          </p>
        )}
      </CardContent>
    </Card>
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
  teamARoster: RosterMember[];
  teamBRoster: RosterMember[];
  teamALineup: string[];
  teamBLineup: string[];
  innings1?: Innings;
  innings2?: Innings;
  transportAssignments: TransportAssignment[];
  vehicles: Vehicle[];
  drivers: Person[];
}

export default function MatchDetailsClient({ match, initialOfficials, people, teamARoster, teamBRoster, teamALineup, teamBLineup, innings1, innings2, transportAssignments, vehicles, drivers }: MatchDetailsClientProps) {
  const { toast } = useToast();
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

  React.useEffect(() => {
    setIsClient(true);
  }, []);

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
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{match.teamAName} vs {match.teamBName}</h1>
                    <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        {match.competitionName && <span className="font-medium text-foreground/90">{match.competitionName}</span>}
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {isClient ? format(match.dateTime, "PPPP") : '\u00A0'}</span>
                        <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {isClient ? format(match.dateTime, "p") : '\u00A0'}</span>
                        <span>{match.fieldName}</span>
                    </p>
                </div>
                <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize h-fit">{match.status}</Badge>
            </div>
        </header>

        <Tabs defaultValue={match.status === 'live' ? 'scoring' : 'scorecard'}>
            <TabsList className={cn(
                "grid w-full",
                match.status === 'live' ? "grid-cols-4" : "grid-cols-3"
            )}>
                {match.status === 'live' && (
                    <TabsTrigger value="scoring"><RadioTower />Live Scoring</TabsTrigger>
                )}
                <TabsTrigger value="scorecard"><ClipboardList />Scorecard</TabsTrigger>
                <TabsTrigger value="analysis"><BarChart />Analysis</TabsTrigger>
                <TabsTrigger value="logistics"><Settings />Logistics</TabsTrigger>
            </TabsList>

            {match.status === 'live' && (
                <TabsContent value="scoring" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Scoring Interface</CardTitle>
                            <CardDescription>This is where the live scoring controls for the match will appear.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">Live scoring feature coming soon!</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            <TabsContent value="scorecard" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Scorecard</CardTitle>
                                <CardDescription>
                                    {match.status === 'completed' ? 'Detailed match scorecard for both innings.' : 'Generate a scorecard once lineups are set.'}
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
                        {match.status === 'completed' && innings1 && innings2 ? (
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
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="analysis" className="mt-4 space-y-4">
                 {match.status === 'scheduled' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div><CardTitle>Match Preview</CardTitle><CardDescription>An AI-generated preview of the upcoming match.</CardDescription></div>
                                <Button onClick={handleGeneratePreview} disabled={isGeneratingPreview}><RefreshCcw className={`mr-2 h-4 w-4 ${isGeneratingPreview ? 'animate-spin' : ''}`} />{isGeneratingPreview ? "Generating..." : (match.preview ? "Regenerate" : "Generate")}</Button>
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
                        <div className="flex items-center justify-between"><div><CardTitle>Weather Forecast</CardTitle><CardDescription>AI-generated forecast for the match day and location.</CardDescription></div><Button onClick={handleGetForecast} disabled={isFetchingForecast}>{isFetchingForecast ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}{isFetchingForecast ? "Fetching..." : (forecast ? "Refresh" : "Get Forecast")}</Button></div>
                    </CardHeader>
                    <CardContent>{!forecast ? (<div className="text-center text-muted-foreground py-8"><p>No weather forecast available.</p><p className="text-xs">Click the button above to fetch the forecast.</p></div>) : (<div><p className="text-sm text-foreground/80 mb-4">{forecast.summary}</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm"><div className="flex items-center gap-2 p-3 rounded-md border"><WeatherIcon condition={forecast.details.condition} className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Condition</span><span className="font-semibold">{forecast.details.condition}</span></div></div><div className="flex items-center gap-2 p-3 rounded-md border"><Thermometer className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Temperature</span><span className="font-semibold">{forecast.details.temperature}°C</span></div></div><div className="flex items-center gap-2 p-3 rounded-md border"><CloudRain className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Precipitation</span><span className="font-semibold">{forecast.details.precipitationChance}%</span></div></div><div className="flex items-center gap-2 p-3 rounded-md border"><Wind className="h-6 w-6 text-primary"/><div className="flex flex-col"><span className="text-muted-foreground text-xs">Wind</span><span className="font-semibold">{forecast.details.windSpeed} km/h</span></div></div></div></div>)}</CardContent>
                </Card>
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
            </TabsContent>

            <TabsContent value="logistics" className="mt-4 space-y-4">
                {match.status !== 'completed' && (
                    <Card>
                        <CardHeader><CardTitle>Lineups</CardTitle><CardDescription>Select the 11 players who will participate in this match.</CardDescription></CardHeader>
                        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <LineupSelectionCard teamId={match.teamAId} teamName={match.teamAName} matchId={match.matchId} roster={teamARoster} lineup={teamALineup} />
                            <LineupSelectionCard teamId={match.teamBId} teamName={match.teamBName} matchId={match.matchId} roster={teamBRoster} lineup={teamBLineup} />
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Transport &amp; Logistics</CardTitle><CardDescription>Manage vehicles and drivers assigned to this match.</CardDescription></div><AssignTransportDialog matchId={match.matchId} vehicles={vehicles} drivers={drivers} transportAssignments={transportAssignments} /></CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Type</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{transportAssignments.length > 0 ? (transportAssignments.map(t => (<TableRow key={t.assignmentId}><TableCell className="font-medium">{t.vehicleName}</TableCell><TableCell>{t.vehicleType}</TableCell><TableCell>{t.driverName}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { setSelectedTransport(t); setIsDeleteTransportDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No transport assigned to this match yet.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Match Officials</CardTitle><CardDescription>Manage the umpires and scorers assigned to this match.</CardDescription></div><AssignOfficialDialog matchId={match.matchId} people={people.filter(p => !initialOfficials.some(o => o.personId === p.personId) && (p.roles.includes('Umpire') || p.roles.includes('Scorer')))} /></CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{initialOfficials.length > 0 ? (initialOfficials.map(official => (<TableRow key={official.assignmentId}><TableCell className="font-medium">{official.personName}</TableCell><TableCell>{official.role}</TableCell><TableCell><Badge variant={official.confirmed ? 'secondary' : 'outline'}>{official.confirmed ? 'Confirmed' : 'Pending'}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { setSelectedOfficial(official); setIsDeleteOfficialDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No officials assigned to this match yet.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                </Card>
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
