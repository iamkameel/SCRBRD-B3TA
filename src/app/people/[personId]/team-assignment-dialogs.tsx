
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Person, Team, PlayerTeamAssignment } from "@/lib/data";
import { addPlayerToRosterAction, updateRosterAssignmentAction } from '@/lib/actions/teams';

const assignSchema = z.object({
  teamId: z.string({ required_error: "Please select a team." }),
  role: z.string({ required_error: "Please select a role." }),
  status: z.string().default('active'),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

const editAssignSchema = z.object({
  role: z.string({ required_error: "Please select a role." }),
  status: z.string().default('active'),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

const PLAYER_ROLES = ["Player"];
const STAFF_ROLES = ["Coach", "Assistant Coach", "Team Manager", "Trainer", "Physiotherapist", "Scorer"];
const ASSIGNABLE_ROLES = [...PLAYER_ROLES, ...STAFF_ROLES];
const STATUSES = ["active", "on_trial", "injured", "retired", "on_loan"];

// Dialog for assigning a person to a new team
export function AssignTeamDialog({ person, teams, open, onOpenChange }: { person: Person, teams: Team[], open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof assignSchema>>({
        resolver: zodResolver(assignSchema),
        defaultValues: { isCaptain: false, isViceCaptain: false, status: "active", role: "Player" },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({ isCaptain: false, isViceCaptain: false, status: "active", role: "Player", teamId: undefined });
        }
    }, [open, form]);

    function onSubmit(data: z.infer<typeof assignSchema>) {
        startTransition(async () => {
            try {
                await addPlayerToRosterAction(data.teamId, { ...data, personId: person.personId });
                toast({ title: "Assigned to Team", description: `${person.firstName} has been added to the team.` });
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not assign to team.", variant: "destructive" });
            }
        });
    }

    const selectedRole = form.watch('role');
    const isPlayerRole = PLAYER_ROLES.includes(selectedRole);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Assign {person.firstName} to Team</DialogTitle><DialogDescription>Select a team and assign a role.</DialogDescription></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="teamId" render={({ field }) => (
                            <FormItem><FormLabel>Team</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map(t => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        
                        {isPlayerRole && (
                             <div className="flex items-center space-x-4 pt-2">
                                <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                                <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
                            </div>
                        )}

                        <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Assigning..." : "Assign to Team"}</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// Dialog for editing an existing team assignment
export function EditTeamAssignmentDialog({ assignment, open, onOpenChange }: { assignment: PlayerTeamAssignment, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
  
    const form = useForm<z.infer<typeof editAssignSchema>>({
      resolver: zodResolver(editAssignSchema),
      defaultValues: { role: assignment.role, status: assignment.status, isCaptain: assignment.isCaptain, isViceCaptain: assignment.isViceCaptain },
    });
  
    React.useEffect(() => {
      form.reset({ role: assignment.role, status: assignment.status, isCaptain: assignment.isCaptain, isViceCaptain: assignment.isViceCaptain });
    }, [assignment, form]);
  
    function onSubmit(data: z.infer<typeof editAssignSchema>) {
      startTransition(async () => {
          try {
              await updateRosterAssignmentAction({ teamId: assignment.teamId, assignmentId: assignment.assignmentId, ...data });
              toast({ title: "Roster Updated", description: `The assignment has been updated.` });
              onOpenChange(false);
          } catch (error) {
              toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update assignment.", variant: "destructive" });
          }
      });
    }
    
    const isPlayerRole = form.watch('role') === 'Player';
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
              <DialogHeader><DialogTitle>Edit Assignment for {assignment.teamName}</DialogTitle><DialogDescription>Update the role and status on this team.</DialogDescription></DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      
                      {isPlayerRole && (
                          <div className="flex items-center space-x-4 pt-2">
                              <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                              <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
                          </div>
                      )}
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
