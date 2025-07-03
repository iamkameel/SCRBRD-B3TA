'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Match, Team, Competition, Field, MatchStatus } from "@/lib/data";
import { updateMatchAction } from '@/lib/actions/matches';

const fixtureSchema = z.object({
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  competitionId: z.string().optional(), // Optional for friendlies
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({ required_error: "A date for the match is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Please use HH:MM." }),
  status: z.enum(['scheduled', 'live', 'completed', 'postponed', 'cancelled', 'abandoned']),
  statusReason: z.string().optional(),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

const MATCH_STATUSES: MatchStatus[] = ['scheduled', 'live', 'completed', 'postponed', 'cancelled', 'abandoned'];

export function EditMatchDialog({ match, teams, competitions, fields, open, onOpenChange }: { match: Match; teams: Team[]; competitions: Competition[]; fields: Field[]; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      competitionId: match.competitionId,
      fieldId: match.fieldId,
      dateTime: match.dateTime,
      time: format(match.dateTime, "HH:mm"),
      status: match.status,
      statusReason: match.statusReason || "",
    },
  });

  const teamAId = form.watch('teamAId');
  const teamBId = form.watch('teamBId');
  const status = form.watch('status');
  
  React.useEffect(() => {
    if (match) {
        form.reset({
            teamAId: match.teamAId, teamBId: match.teamBId, competitionId: match.competitionId, fieldId: match.fieldId, dateTime: match.dateTime, time: format(match.dateTime, "HH:mm"), status: match.status, statusReason: match.statusReason || "",
        });
    }
  }, [match, form]);

  function onSubmit(data: FixtureFormValues) {
    startTransition(async () => {
        try {
            const [hours, minutes] = data.time.split(':').map(Number);
            const combinedDateTime = new Date(data.dateTime);
            combinedDateTime.setHours(hours, minutes, 0, 0);

            const { time, ...rest } = data;
            const finalData = { ...rest, dateTime: combinedDateTime };

            await updateMatchAction(match.matchId, finalData);
            toast({ title: "Match Updated", description: "The match details have been successfully updated." });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update match.", variant: "destructive" });
        }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Edit Match</DialogTitle><DialogDescription>Update the details for this fixture. Click save when you're done.</DialogDescription></DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="teamAId" render={({ field }) => (<FormItem><FormLabel>Home Team</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamBId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="teamBId" render={({ field }) => (<FormItem><FormLabel>Away Team</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamAId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="competitionId" render={({ field }) => (<FormItem><FormLabel>Competition</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a competition" /></SelectTrigger></FormControl><SelectContent><SelectItem value="friendly">Friendly Match</SelectItem>{competitions.map((comp) => (<SelectItem key={comp.competitionId} value={comp.competitionId}>{comp.name} ({comp.seasonName})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fieldId" render={({ field }) => (<FormItem><FormLabel>Venue / Field</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger></FormControl><SelectContent>{fields.map((field) => (<SelectItem key={field.fieldId} value={field.fieldId}>{field.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="dateTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Match Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Match Time</FormLabel><FormControl><Input type="time" className="w-full" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Match Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{MATCH_STATUSES.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    {['postponed', 'cancelled', 'abandoned'].includes(status) && (
                        <FormField control={form.control} name="statusReason" render={({ field }) => (<FormItem><FormLabel>Reason for Status</FormLabel><FormControl><Input placeholder="e.g., Bad weather" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
