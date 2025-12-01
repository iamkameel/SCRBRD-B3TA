'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Info, PlusCircle, Loader2 } from "lucide-react";
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

interface NewMatchClientProps {
  teams: Team[];
  competitions: Competition[];
  fields: Field[];
  seasons?: Season[];
  divisions?: Division[];
  isAdmin: boolean;
}

export default function NewMatchClient({ teams, competitions, fields, seasons = [], divisions = [], isAdmin }: NewMatchClientProps) {
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

  // Filter competitions based on the selected date (must fall within a season)
  const availableCompetitions = React.useMemo(() => {
    if (!selectedDate) return [];
    const activeSeason = seasons.find(s => 
        s.active && selectedDate >= s.startDate && selectedDate <= s.endDate
    );
    if (!activeSeason) return [];
    return competitions.filter(c => c.seasonId === activeSeason.seasonId);
  }, [selectedDate, seasons, competitions]);

  // Filter teams: if friendly, show all. If comp, show comp teams.
  const eligibleTeams = React.useMemo(() => {
    if (isFriendly) return teams; 
    if (!selectedCompetitionId) return [];

    const competition = competitions.find(c => c.competitionId === selectedCompetitionId);
    if (!competition) return [];

    const teamIdsInCompetition = competition.teamIds || [];
    if (teamIdsInCompetition.length > 0) {
        return teams.filter(t => teamIdsInCompetition.includes(t.teamId));
    }
    
    // Fallback logic
    return teams.filter(t => t.seasonId === competition.seasonId && t.divisionId === competition.divisionId);
  }, [isFriendly, selectedCompetitionId, competitions, teams]);
  
  // UI Helper: Get Season Name
  const autoSelectedSeason = React.useMemo(() => {
    if (isFriendly || !selectedDate) return null;
    return seasons.find(s => s.active && selectedDate >= s.startDate && selectedDate <= s.endDate) || null;
  }, [isFriendly, selectedDate, seasons]);

  // UI Helper: Get Division Name
  const autoSelectedDivisionName = React.useMemo(() => {
    if (isFriendly || !selectedCompetitionId) return null;
    const competition = competitions.find(c => c.competitionId === selectedCompetitionId);
    return competition ? competition.divisionName : null;
  }, [isFriendly, selectedCompetitionId, competitions]);


  // Reset logic when dependencies change
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
        
        // Assuming the action handles redirect, otherwise: router.push('/matches');

      } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          throw error; // Let Next.js handle the redirect
        }
        toast({
          title: "Error Creating Match",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  // If not admin, access should likely be denied (or handled by layout/middleware), 
  // but we can render a simple message here.
  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view this page.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/matches"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Fixture</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
          <CardDescription>Schedule a new match, select teams, and assign a venue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Date & Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (HH:MM)</FormLabel>
                        <FormControl>
                          <Input placeholder="10:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              {/* Competition Selection */}
              <FormField
                control={form.control}
                name="competitionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDate}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedDate ? "Select a date first" : "Select competition or Friendly"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly Match</SelectItem>
                        {availableCompetitions.map((comp) => (
                          <SelectItem key={comp.competitionId} value={comp.competitionId}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contextual Alert showing inferred Season/Division */}
              {selectedCompetitionId && (
                 <Alert className="bg-muted/50 border-none">
                    <Info className="h-4 w-4" />
                    <AlertTitle>{isFriendly ? "Friendly Match" : "Competition Match"}</AlertTitle>
                    <AlertDescription>
                        {isFriendly 
                           ? "This match will not count towards league tables." 
                           : `Part of ${autoSelectedSeason?.name || 'Active Season'} • ${autoSelectedDivisionName || 'General Division'}`
                        }
                    </AlertDescription>
                 </Alert>
              )}

              {/* Teams Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="teamAId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Team</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompetitionId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select home team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eligibleTeams.map((team) => (
                              <SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamBId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Away Team</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompetitionId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select away team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eligibleTeams.map((team) => (
                              <SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              {/* Field Selection */}
              <FormField
                control={form.control}
                name="fieldId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field / Venue</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fields.map((f) => (
                          <SelectItem key={f.fieldId} value={f.fieldId}>{f.name} ({f.location})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Creating Fixture..." : "Create Fixture"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}