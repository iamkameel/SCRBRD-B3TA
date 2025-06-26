
'use client';

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Team, School, Division, Season } from "@/lib/data";
import { addTeamAction, updateTeamAction, deleteTeamAction } from '@/lib/actions/teams';

const teamSchema = z.object({
  name: z.string().min(1, { message: "Team name is required." }),
  schoolId: z.string({ required_error: "Please select a school." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

function TeamDialog({ mode, team, schools, divisions, seasons, open, onOpenChange }: { mode: 'add' | 'edit', team?: Team, schools: School[], divisions: Division[], seasons: Season[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: mode === 'edit' && team ? {
      name: team.name, schoolId: team.schoolId, divisionId: team.divisionId, seasonId: team.seasonId,
      primaryColor: team.teamColors?.primary, secondaryColor: team.teamColors?.secondary
    } : {
      name: "", primaryColor: "#000000", secondaryColor: "#ffffff",
    },
  });

  React.useEffect(() => {
    if (mode === 'edit' && team) {
      form.reset({
        name: team.name, schoolId: team.schoolId, divisionId: team.divisionId, seasonId: team.seasonId,
        primaryColor: team.teamColors?.primary, secondaryColor: team.teamColors?.secondary
      });
    } else {
      form.reset({
        name: "", schoolId: undefined, divisionId: undefined, seasonId: undefined,
        primaryColor: "#000000", secondaryColor: "#ffffff",
      });
    }
  }, [team, mode, open, form]);

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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Team' : 'Add New Team'}</DialogTitle>
          <DialogDescription>Enter the details for the team. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Team Name</FormLabel><FormControl><Input placeholder="e.g. Greenwood Gators" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="schoolId" render={({ field }) => (<FormItem><FormLabel>School</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger></FormControl><SelectContent>{schools.map((s) => (<SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger></FormControl><SelectContent>{divisions.map((d) => (<SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="seasonId" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger></FormControl><SelectContent>{seasons.map((s) => (<SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="primaryColor" render={({ field }) => (<FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} disabled={isPending} className="p-1 h-10" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="secondaryColor" render={({ field }) => (<FormItem><FormLabel>Secondary Color</FormLabel><FormControl><Input type="color" {...field} disabled={isPending} className="p-1 h-10" /></FormControl><FormMessage /></FormItem>)} />
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


export default function TeamsClient({ teams, schools, divisions, seasons }: { teams: Team[]; schools: School[]; divisions: Division[]; seasons: Season[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isTeamDialogOpen, setIsTeamDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedTeam) return;
    startTransition(async () => {
      try {
        await deleteTeamAction(selectedTeam.teamId);
        toast({ title: "Team Deleted", description: `${selectedTeam.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedTeam(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete team.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedTeam(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Teams</h1><p className="text-muted-foreground">Manage your cricket teams.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedTeam(null); setIsTeamDialogOpen(true); }}><PlusCircle className="mr-2" />Add Team</Button>
        </header>

        <Card>
          <CardHeader><CardTitle>Team List</CardTitle><CardDescription>A list of all teams in the system.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Team Name</TableHead><TableHead>School</TableHead><TableHead>Division</TableHead><TableHead>Season</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <TableRow key={team.teamId}>
                      <TableCell className="font-medium"><Link href={`/teams/${team.teamId}`} className="hover:underline">{team.name}</Link></TableCell>
                      <TableCell>{team.schoolName}</TableCell>
                      <TableCell>{team.divisionName}</TableCell>
                      <TableCell>{team.seasonName}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedTeam(team); setDialogMode('edit'); setIsTeamDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedTeam(team); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No teams found. Get started by adding a team.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TeamDialog mode={dialogMode} team={selectedTeam ?? undefined} schools={schools} divisions={divisions} seasons={seasons} open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedTeam?.name}</strong>, its roster, and all of its associated matches.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTeam(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Team"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
