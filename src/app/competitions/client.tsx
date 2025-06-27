'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Competition, Season, Division } from "@/lib/data";
import { addCompetitionAction, updateCompetitionAction, deleteCompetitionAction } from '@/lib/actions/competitions';

const competitionSchema = z.object({
  name: z.string().min(1, { message: "Competition name is required." }),
  type: z.enum(['League', 'Knockout', 'Series'], { required_error: "Type is required." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  status: z.enum(['Draft', 'In Progress', 'Completed']).default('Draft'),
});
type CompetitionFormValues = z.infer<typeof competitionSchema>;
const COMPETITION_TYPES = ['League', 'Knockout', 'Series'] as const;
const COMPETITION_STATUSES = ['Draft', 'In Progress', 'Completed'] as const;

function CompetitionDialog({ mode, competition, seasons, divisions, open, onOpenChange }: { mode: 'add' | 'edit', competition?: Competition, seasons: Season[], divisions: Division[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: mode === 'edit' && competition ? {
      name: competition.name,
      type: competition.type,
      seasonId: competition.seasonId,
      divisionId: competition.divisionId,
      status: competition.status,
    } : {
      name: "", type: "League", status: "Draft"
    },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && competition) {
        form.reset({ ...competition });
      } else {
        form.reset({ name: "", type: "League", status: "Draft", seasonId: undefined, divisionId: undefined });
      }
    }
  }, [competition, mode, open, form]);

  function onSubmit(data: CompetitionFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && competition) {
          await updateCompetitionAction({ competitionId: competition.competitionId, ...data });
          toast({ title: "Competition Updated", description: `${data.name} has been updated.` });
        } else {
          await addCompetitionAction(data);
          toast({ title: "Competition Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} competition.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Competition' : 'Add New Competition'}</DialogTitle>
          <DialogDescription>Enter the details for the competition.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Competition Name</FormLabel><FormControl><Input placeholder="e.g. U19 Varsity League" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="League" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent>{COMPETITION_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="seasonId" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger></FormControl><SelectContent>{seasons.map((s) => (<SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger></FormControl><SelectContent>{divisions.map((d) => (<SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="Draft" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{COMPETITION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Competition"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CompetitionsClient({ competitions, seasons, divisions }: { competitions: Competition[], seasons: Season[], divisions: Division[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedCompetition, setSelectedCompetition] = React.useState<Competition | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isCompetitionDialogOpen, setIsCompetitionDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Filtering state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [seasonFilter, setSeasonFilter] = React.useState("all");
  const [divisionFilter, setDivisionFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  
  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || comp.type === typeFilter;
    const matchesSeason = seasonFilter === 'all' || comp.seasonId === seasonFilter;
    const matchesDivision = divisionFilter === 'all' || comp.divisionId === divisionFilter;
    const matchesStatus = statusFilter === 'all' || comp.status === statusFilter;
    return matchesSearch && matchesType && matchesSeason && matchesDivision && matchesStatus;
  });

  const filtersApplied = searchQuery || typeFilter !== 'all' || seasonFilter !== 'all' || divisionFilter !== 'all' || statusFilter !== 'all';

  const handleDelete = () => {
    if (!selectedCompetition) return;
    startTransition(async () => {
      try {
        await deleteCompetitionAction(selectedCompetition.competitionId);
        toast({ title: "Competition Deleted", description: `${selectedCompetition.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedCompetition(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete competition.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedCompetition(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Competitions</h1><p className="text-muted-foreground">Manage your leagues, cups, and tournaments.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedCompetition(null); setIsCompetitionDialogOpen(true); }}><PlusCircle className="mr-2"/>Add Competition</Button>
        </header>
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Competition List</CardTitle>
                        <CardDescription>A list of all competitions in the system.</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="relative">
                                <Search className="h-4 w-4" />
                                <span className="sr-only">Filter Competitions</span>
                                {filtersApplied && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2"><h4 className="font-medium leading-none">Filter Competitions</h4><p className="text-sm text-muted-foreground">Find competitions by name, type, or status.</p></div>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="search-input">Name</Label><Input id="search-input" placeholder="Competition name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="col-span-2 h-8"/></div>
                                    <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="type-filter">Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="col-span-2 h-8 capitalize"><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{COMPETITION_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="season-filter">Season</Label><Select value={seasonFilter} onValueChange={setSeasonFilter}><SelectTrigger className="col-span-2 h-8"><SelectValue placeholder="All Seasons"/></SelectTrigger><SelectContent><SelectItem value="all">All Seasons</SelectItem>{seasons.map(s => <SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="division-filter">Division</Label><Select value={divisionFilter} onValueChange={setDivisionFilter}><SelectTrigger className="col-span-2 h-8"><SelectValue placeholder="All Divisions"/></SelectTrigger><SelectContent><SelectItem value="all">All Divisions</SelectItem>{divisions.map(d => <SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="status-filter">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="col-span-2 h-8 capitalize"><SelectValue placeholder="All Statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{COMPETITION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredCompetitions.length > 0 ? (
                    filteredCompetitions.map((comp) => (
                    <TableRow key={comp.competitionId}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell>{comp.type}</TableCell>
                        <TableCell>{comp.seasonName}</TableCell>
                        <TableCell>{comp.divisionName}</TableCell>
                        <TableCell><Badge variant={comp.status === 'Completed' ? 'secondary' : (comp.status === 'In Progress' ? 'default' : 'outline')}>{comp.status}</Badge></TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedCompetition(comp); setDialogMode('edit'); setIsCompetitionDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedCompetition(comp); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">{filtersApplied ? "No competitions found matching your filters." : "No competitions found. Get started by adding one."}</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>
      
      <CompetitionDialog mode={dialogMode} competition={selectedCompetition ?? undefined} seasons={seasons} divisions={divisions} open={isCompetitionDialogOpen} onOpenChange={setIsCompetitionDialogOpen} />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedCompetition?.name}</strong>. Any matches associated with this competition will need to be updated manually.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompetition(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Competition"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
