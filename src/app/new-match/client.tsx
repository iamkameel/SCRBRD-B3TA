

'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Info, PlusCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Team, Competition, Field, Season, Division } from "@/lib/data";
import { addMatchAction } from '@/lib/actions/matches';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface NewMatchClientProps {
  teams: Team[];
  competitions: Competition[];
  fields: Field[];
  seasons: Season[];
  divisions: Division[];
  isAdmin: boolean;
}

export default function NewMatchClient({ teams, competitions, fields, seasons, divisions, isAdmin }: NewMatchClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);

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
        setOpen(false);

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
    isAdmin && (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button><PlusCircle className="mr-2" />New Match</Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>Follow the steps to schedule a new fixture.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="teamAId" render={({ field }) => (<FormItem><FormLabel>4. Home Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || eligibleTeams.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!selectedCompetitionId ? "Select competition first" : "Select a team"} /></SelectTrigger></FormControl><SelectContent>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamBId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="teamBId" render={({ field }) => (<FormItem><FormLabel>5. Away Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || eligibleTeams.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!selectedCompetitionId ? "Select competition first" : "Select a team"} /></SelectTrigger></FormControl><SelectContent>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamAId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>

                 <FormField control={form.control} name="fieldId" render={({ field }) => (<FormItem><FormLabel>6. Venue / Field</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger></FormControl><SelectContent>{fields.map((field) => (<SelectItem key={field.fieldId} value={field.fieldId}>{field.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating Match..." : "Create Fixture"}
                    </Button>
                </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
    )
  );
}
