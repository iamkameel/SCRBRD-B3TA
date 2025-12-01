
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Info } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Team, Competition, Field, Season, Division } from "@/lib/data";
import { addMatchAction } from '@/lib/actions/matches';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fixtureSchema = z.object({
  competitionId: z.string({ required_error: "Please select a competition or 'Friendly'." }),
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({
    required_error: "A date for the match is required.",
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format. Please use HH:MM.",
  }),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});


type FixtureFormValues = z.infer<typeof fixtureSchema>;

interface NewMatchPageClientProps {
  teams: Team[];
  competitions: Competition[];
  fields: Field[];
  seasons: Season[];
  divisions: Division[];
}

export default function NewMatchPageClient({ teams, competitions, fields, seasons, divisions }: NewMatchPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      time: "10:00",
    },
  });
  
  const selectedDate = form.watch('dateTime');
  const selectedCompetitionId = form.watch('competitionId');
  const teamAId = form.watch('teamAId');
  const teamBId = form.watch('teamBId');
  
  const isFriendly = selectedCompetitionId === 'friendly';

  const availableCompetitions = React.useMemo(() => {
    if (!selectedDate || !seasons) return [];
    const activeSeason = seasons.find(s => 
        s.active && selectedDate >= s.startDate && selectedDate <= s.endDate
    );
    if (!activeSeason) return [];
    return competitions.filter(c => c.seasonId === activeSeason.seasonId);
  }, [selectedDate, seasons, competitions]);

  const eligibleTeams = React.useMemo(() => {
    if (isFriendly) return teams; // All teams are eligible for friendlies
    if (!selectedCompetitionId) return [];

    const competition = competitions.find(c => c.competitionId === selectedCompetitionId);
    if (!competition) return [];

    const teamIdsInCompetition = competition.teamIds || [];
    if (teamIdsInCompetition.length > 0) {
        return teams.filter(t => teamIdsInCompetition.includes(t.teamId));
    }
    
    // Fallback if no teams are assigned to the competition: filter by season and division
    return teams.filter(t => t.seasonId === competition.seasonId && t.divisionId === competition.divisionId);
  }, [isFriendly, selectedCompetitionId, competitions, teams]);
  
  const autoSelectedSeason = React.useMemo(() => {
    if (isFriendly || !selectedDate || !seasons) return null;
    return seasons.find(s => s.active && selectedDate >= s.startDate && selectedDate <= s.endDate) || null;
  }, [isFriendly, selectedDate, seasons]);

  const autoSelectedDivisionName = React.useMemo(() => {
    if (isFriendly || !selectedCompetitionId) return null;
    const competition = competitions.find(c => c.competitionId === selectedCompetitionId);
    return competition ? competition.divisionName : null;
  }, [isFriendly, selectedCompetitionId, competitions]);


  React.useEffect(() => {
    form.resetField('competitionId');
  }, [selectedDate, form]);

  React.useEffect(() => {
    form.resetField('teamAId');
    form.resetField('teamBId');
  }, [selectedCompetitionId, form]);


  function onSubmit(data: FixtureFormValues) {
    startTransition(async () => {
      try {
        const [hours, minutes] = data.time.split(':').map(Number);
        const combinedDateTime = new Date(data.dateTime);
        combinedDateTime.setHours(hours, minutes, 0, 0);
        
        await addMatchAction({ ...data, dateTime: combinedDateTime });
        
        toast({
          title: "Fixture Created",
          description: "Redirecting to the match page..."
        });

      } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          throw error;
        }
        toast({
          title: "Error Creating Match",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/matches" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Matches
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create a New Match
        </h1>
        <p className="text-muted-foreground">
          Follow the steps below to schedule a new fixture.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
          <CardDescription>
            Begin by selecting a date to filter the available competitions and teams for that season.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="dateTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>1. Match Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>2. Match Time</FormLabel><FormControl><Input type="time" className="w-full" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                 <FormField control={form.control} name="competitionId" render={({ field }) => (<FormItem><FormLabel>3. Competition</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || !selectedDate}><FormControl><SelectTrigger><SelectValue placeholder={!selectedDate ? "Select a date first" : "Select a competition"} /></SelectTrigger></FormControl><SelectContent><SelectItem value="friendly">-- Friendly Match --</SelectItem>{availableCompetitions.map((comp) => (<SelectItem key={comp.competitionId} value={comp.competitionId}>{comp.name} ({comp.divisionName})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                 
                {isFriendly && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Friendly Mode</AlertTitle>
                        <AlertDescription>
                            You’ve selected a Friendly match. Opponents, age divisions, and classifications can be mixed.
                        </AlertDescription>
                    </Alert>
                )}

                {!isFriendly && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <FormLabel>Auto-Selected Season</FormLabel>
                            <div className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm",!autoSelectedSeason && "text-muted-foreground")}>{autoSelectedSeason ? autoSelectedSeason.name : "Waiting for date..."}</div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Auto-Selected Division</FormLabel>
                            <div className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm", !autoSelectedDivisionName && "text-muted-foreground")}>{autoSelectedDivisionName || "Waiting for competition..."}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="teamAId" render={({ field }) => (<FormItem><FormLabel>4. Home Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || eligibleTeams.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!selectedCompetitionId ? "Select competition first" : "Select a team"} /></SelectTrigger></FormControl><SelectContent>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamBId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="teamBId" render={({ field }) => (<FormItem><FormLabel>5. Away Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || eligibleTeams.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!selectedCompetitionId ? "Select competition first" : "Select a team"} /></SelectTrigger></FormControl><SelectContent>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamAId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>

                 <FormField control={form.control} name="fieldId" render={({ field }) => (<FormItem><FormLabel>6. Venue / Field</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger></FormControl><SelectContent>{fields.map((field) => (<SelectItem key={field.fieldId} value={field.fieldId}>{field.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />

                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating Match..." : "Create Fixture & Start Scoring"}
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
