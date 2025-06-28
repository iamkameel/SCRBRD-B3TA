
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
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
import { addMatchAction } from "@/lib/actions/matches";

const baseFixtureSchema = z.object({
  competitionId: z.string({ required_error: "Please select a competition." }),
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({
    required_error: "A date for the match is required.",
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format. Please use HH:MM.",
  }),
});

// A more specific schema for the form UI to handle cascading filters
const fixtureFormSchema = baseFixtureSchema.extend({
    divisionId: z.string({ required_error: "Please select a division." }),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});


type FixtureFormValues = z.infer<typeof fixtureFormSchema>;

interface NewMatchClientProps {
  teams: Team[];
  competitions: Competition[];
  fields: Field[];
  seasons: Season[];
  divisions: Division[];
}

export default function NewMatchClient({ teams, competitions, fields, seasons, divisions }: NewMatchClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [autoSelectedSeason, setAutoSelectedSeason] = React.useState<Season | null>(null);

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureFormSchema),
    defaultValues: {
      time: "10:00",
    },
  });
  
  const selectedDate = form.watch('dateTime');
  const selectedDivisionId = form.watch('divisionId');
  const teamAId = form.watch('teamAId');
  const teamBId = form.watch('teamBId');
  
  React.useEffect(() => {
    if (selectedDate) {
        const matchingSeason = seasons.find(s => 
            s.active && selectedDate >= s.startDate && selectedDate <= s.endDate
        );
        setAutoSelectedSeason(matchingSeason || null);
    } else {
        setAutoSelectedSeason(null);
    }
  }, [selectedDate, seasons]);

  const availableCompetitions = React.useMemo(() => {
    if (!autoSelectedSeason || !selectedDivisionId) return [];
    return competitions.filter(c => c.seasonId === autoSelectedSeason.seasonId && c.divisionId === selectedDivisionId);
  }, [autoSelectedSeason, selectedDivisionId, competitions]);

  const eligibleTeams = React.useMemo(() => {
    if (!autoSelectedSeason || !selectedDivisionId) return [];
    return teams.filter(t => t.seasonId === autoSelectedSeason.seasonId && t.divisionId === selectedDivisionId);
  }, [autoSelectedSeason, selectedDivisionId, teams]);
  
  React.useEffect(() => {
    form.resetField('divisionId');
    form.resetField('competitionId');
    form.resetField('teamAId');
    form.resetField('teamBId');
  }, [autoSelectedSeason, form]);

  React.useEffect(() => {
    form.resetField('competitionId');
    form.resetField('teamAId');
    form.resetField('teamBId');
  }, [selectedDivisionId, form]);

  function onSubmit(data: FixtureFormValues) {
    startTransition(async () => {
      try {
        const [hours, minutes] = data.time.split(':').map(Number);
        const combinedDateTime = new Date(data.dateTime);
        combinedDateTime.setHours(hours, minutes, 0, 0);

        const finalData = {
            competitionId: data.competitionId,
            teamAId: data.teamAId,
            teamBId: data.teamBId,
            fieldId: data.fieldId,
            dateTime: combinedDateTime
        };
        
        await addMatchAction(finalData);
        
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
          Set up the details for your next fixture by refining your choices.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Match Setup</CardTitle>
          <CardDescription>
            Begin by selecting a date to automatically determine the season, then continue to select the division, competition, and teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="dateTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>1. Match Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>2. Match Time</FormLabel><FormControl><Input type="time" className="w-full" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                 <div className="space-y-2">
                    <FormLabel>Auto-Selected Season</FormLabel>
                    <div className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm",
                        !autoSelectedSeason && "text-muted-foreground"
                    )}>
                        {autoSelectedSeason ? autoSelectedSeason.name : "Select a date to determine active season"}
                    </div>
                </div>

                <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>3. Division</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || !autoSelectedSeason}><FormControl><SelectTrigger><SelectValue placeholder={!autoSelectedSeason ? "Waiting for season..." : "Select a division"}/></SelectTrigger></FormControl><SelectContent>{divisions.map((d) => (<SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                
                <FormField control={form.control} name="competitionId" render={({ field }) => (<FormItem><FormLabel>4. Competition</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || !selectedDivisionId}><FormControl><SelectTrigger><SelectValue placeholder={!selectedDivisionId ? "Select division first" : "Select a competition"} /></SelectTrigger></FormControl><SelectContent>{availableCompetitions.map((comp) => (<SelectItem key={comp.competitionId} value={comp.competitionId}>{comp.name} ({comp.type})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="teamAId" render={({ field }) => (<FormItem><FormLabel>5. Home Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || !selectedDivisionId}><FormControl><SelectTrigger><SelectValue placeholder={!selectedDivisionId ? "Select division first" : "Select a team"} /></SelectTrigger></FormControl><SelectContent>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamBId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="teamBId" render={({ field }) => (<FormItem><FormLabel>6. Away Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || !selectedDivisionId}><FormControl><SelectTrigger><SelectValue placeholder={!selectedDivisionId ? "Select division first" : "Select a team"} /></SelectTrigger></FormControl><SelectContent>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamAId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>

                 <FormField control={form.control} name="fieldId" render={({ field }) => (<FormItem><FormLabel>7. Venue / Field</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger></FormControl><SelectContent>{fields.map((field) => (<SelectItem key={field.fieldId} value={field.fieldId}>{field.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />

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
