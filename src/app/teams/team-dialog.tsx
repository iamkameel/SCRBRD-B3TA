
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Team, School, Division, Season } from "@/lib/data";
import { addTeamAction, updateTeamAction } from '@/lib/actions/teams';
import { Separator } from "@/components/ui/separator";

const teamSchema = z.object({
  name: z.string().min(1, { message: "Team name is required." }),
  alias: z.string().optional(),
  schoolId: z.string({ required_error: "Please select a school." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  teamClass: z.string({ required_error: "Please select a class." }),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const CLASS_DIVISION_MAP: { [key: string]: string[] } = {
    'Open': ['1st XI', '2nd XI', '3rd XI', '4th XI'],
    'u16': ['U16A', 'U16B', 'U16C'],
    'u15': ['U15A', 'U15B', 'U15C'],
    'u14': ['U14A', 'U14B', 'U14C'],
    'u13': ['U13A', 'U13B'],
};

export function TeamDialog({ mode, team, schools, divisions, seasons, open, onOpenChange }: { mode: 'add' | 'edit', team?: Team, schools: School[], divisions: Division[], seasons: Season[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: mode === 'edit' && team ? {
      name: team.name, alias: team.alias, schoolId: team.schoolId, divisionId: team.divisionId, seasonId: team.seasonId, teamClass: team.teamClass,
    } : {
      name: "", alias: "",
    },
  });
  
  const schoolId = form.watch('schoolId');
  const divisionId = form.watch('divisionId');
  const teamClass = form.watch('teamClass');

  const eligibleClasses = React.useMemo(() => {
    if (!divisionId) return [];
    const selectedDivision = divisions.find(d => d.divisionId === divisionId);
    if (!selectedDivision) return [];
    return CLASS_DIVISION_MAP[selectedDivision.name as keyof typeof CLASS_DIVISION_MAP] || [];
  }, [divisionId, divisions]);

  React.useEffect(() => {
    const school = schools.find(s => s.schoolId === schoolId);
    if (school && teamClass) {
        form.setValue('name', `${school.name} ${teamClass}`);
    } else if (school) {
        form.setValue('name', school.name);
    }
  }, [schoolId, teamClass, schools, form]);

  React.useEffect(() => {
      form.resetField('teamClass');
  }, [divisionId, form]);

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && team) {
        form.reset({
          name: team.name, alias: team.alias, schoolId: team.schoolId, divisionId: team.divisionId, seasonId: team.seasonId, teamClass: team.teamClass
        });
      } else {
        const activeSeason = seasons.find(s => {
            const now = new Date();
            return s.active && now >= s.startDate && now <= s.endDate;
        });
        form.reset({
          name: "", alias: "", schoolId: undefined, divisionId: undefined, seasonId: activeSeason?.seasonId, teamClass: undefined,
        });
      }
    }
  }, [team, mode, open, form, seasons]);

  function onSubmit(data: TeamFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && team) {
          await updateTeamAction({ teamId: team.teamId, ...data });
          toast({ title: "Team Updated", description: `${data.name} has been updated.` });
        } else {
          await addTeamAction(data);
          toast({ title: "Team Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} team.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Team' : 'Add New Team'}</DialogTitle>
          <DialogDescription>Enter the details for the team. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Team Name (Auto-generated)</FormLabel><FormControl><Input placeholder="Auto-generated from selections..." {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="alias" render={({ field }) => (<FormItem><FormLabel>Team Alias (Optional)</FormLabel><FormControl><Input placeholder="e.g. MHS 1sts" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
            <div className="space-y-4">
               <h3 className="text-sm font-medium text-muted-foreground">Team Association</h3>
              <FormField control={form.control} name="schoolId" render={({ field }) => (<FormItem><FormLabel>School</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger></FormControl><SelectContent>{schools.map((s) => (<SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger></FormControl><SelectContent>{divisions.map((d) => (<SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="teamClass" render={({ field }) => (<FormItem><FormLabel>Class / Level</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending || !divisionId || eligibleClasses.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!divisionId ? "Select division first" : "Select a class"} /></SelectTrigger></FormControl><SelectContent>{eligibleClasses.map((cls) => (<SelectItem key={cls} value={cls}>{cls}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="seasonId" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger></FormControl><SelectContent>{seasons.map((s) => (<SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Team"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
