

'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, Trophy, List, LayoutGrid, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Competition, Season, Division, Team } from "@/lib/data";
import { addCompetitionAction, updateCompetitionAction, deleteCompetitionAction } from '@/lib/actions/competitions';
import { CompetitionCard } from "./competition-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const competitionSchema = z.object({
  name: z.string().min(1, { message: "Competition name is required." }),
  competitionClass: z.string().optional(),
  type: z.enum(['League', 'Cup', 'Tournament', 'Festival', 'Friendlies'], { required_error: "Type is required." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  status: z.enum(['Draft', 'In Progress', 'Completed']).default('Draft'),
  winnerTeamId: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
});
type CompetitionFormValues = z.infer<typeof competitionSchema>;
type SortableColumn = 'name' | 'type' | 'seasonName' | 'divisionName' | 'status';


const CLASS_DIVISION_MAP: { [key: string]: string[] } = {
    'Open': ['1st XI', '2nd XI', '3rd XI', '4th XI'],
    'u16': ['U16A', 'U16B', 'U16C'],
    'u15': ['U15A', 'U15B', 'U15C'],
    'u14': ['U14A', 'U14B', 'U14C'],
    'u13': ['U13A', 'U13B'],
};

const COMPETITION_TYPE_DEFINITIONS = [
    {
        id: 'League',
        label: 'League',
        description: 'A round-robin format testing consistency. Teams play each other home and away over a season.',
    },
    {
        id: 'Cup',
        label: 'Cup',
        description: 'A high-stakes, single-elimination knockout competition. Matchups are often determined by a random draw.',
    },
    {
        id: 'Tournament',
        label: 'Tournament',
        description: 'A showcase event combining a league-style group stage followed by an intense knockout phase.',
    },
    {
        id: 'Festival',
        label: 'Festival',
        description: 'A broader, celebratory event focused on community and atmosphere, which can host multiple competitions.',
    },
    {
        id: 'Friendlies',
        label: 'Friendlies',
        description: 'A collection of one-off matches not assigned to a formal league or cup structure.',
    }
] as const;

const COMPETITION_TYPES = COMPETITION_TYPE_DEFINITIONS.map(t => t.id);
const COMPETITION_STATUSES = ['Draft', 'In Progress', 'Completed'] as const;

function CompetitionDialog({ mode, competition, seasons, divisions, teams, open, onOpenChange }: { mode: 'add' | 'edit', competition?: Competition, seasons: Season[], divisions: Division[], teams: Team[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [schoolFilters, setSchoolFilters] = React.useState<string[]>([]);

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: mode === 'edit' && competition ? {
      name: competition.name,
      competitionClass: competition.competitionClass || " ",
      type: competition.type,
      seasonId: competition.seasonId,
      divisionId: competition.divisionId,
      status: competition.status,
      winnerTeamId: competition.winnerTeamId || "",
      teamIds: competition.teamIds || [],
    } : {
      name: "", competitionClass: " ", type: "League", status: "Draft", winnerTeamId: "", teamIds: [],
    },
  });
  
  const status = form.watch('status');
  const seasonId = form.watch('seasonId');
  const divisionId = form.watch('divisionId');
  
  const eligibleTeams = React.useMemo(() => {
    if (!divisionId || !seasonId) return [];
    return teams.filter(team => team.divisionId === divisionId && team.seasonId === seasonId);
  }, [teams, divisionId, seasonId]);

  const eligibleSchools = React.useMemo(() => {
      const schoolMap = new Map<string, { schoolId: string, schoolName: string }>();
      eligibleTeams.forEach(team => {
          if (team.schoolId && team.schoolName && !schoolMap.has(team.schoolId)) {
              schoolMap.set(team.schoolId, { schoolId: team.schoolId, schoolName: team.schoolName });
          }
      });
      return Array.from(schoolMap.values()).sort((a,b) => a.schoolName.localeCompare(b.schoolName));
  }, [eligibleTeams]);
  
  const filteredTeams = React.useMemo(() => {
    if (schoolFilters.length === 0) return eligibleTeams;
    return eligibleTeams.filter(team => schoolFilters.includes(team.schoolId));
  }, [eligibleTeams, schoolFilters]);

  const eligibleClasses = React.useMemo(() => {
    if (!divisionId) return [];
    const selectedDivision = divisions.find(d => d.divisionId === divisionId);
    if (!selectedDivision) return [];
    return CLASS_DIVISION_MAP[selectedDivision.name as keyof typeof CLASS_DIVISION_MAP] || [];
  }, [divisionId, divisions]);

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && competition) {
        form.reset({ ...competition, winnerTeamId: competition.winnerTeamId || "", competitionClass: competition.competitionClass || " ", teamIds: competition.teamIds || [] });
      } else {
        const activeSeason = seasons.find(s => {
            const now = new Date();
            return s.active && now >= s.startDate && now <= s.endDate;
        });
        form.reset({ name: "", competitionClass: " ", type: "League", status: "Draft", seasonId: activeSeason?.seasonId, divisionId: undefined, winnerTeamId: "", teamIds: [] });
      }
      setSchoolFilters([]);
    }
  }, [competition, mode, open, form, seasons]);
  
  // When season changes, reset division, class, and teams
  React.useEffect(() => {
    form.resetField('divisionId');
    form.resetField('competitionClass');
    form.resetField('teamIds');
  }, [seasonId, form]);

  // When division changes, reset class and teams
  React.useEffect(() => {
    form.resetField('competitionClass');
    form.resetField('teamIds');
    setSchoolFilters([]);
  }, [divisionId, form]);


  React.useEffect(() => {
    if (form.getValues('status') !== 'Completed') {
      form.setValue('winnerTeamId', '');
    }
  }, [status, form]);

  function onSubmit(data: CompetitionFormValues) {
    startTransition(async () => {
      try {
        const payload = {
          ...data,
          competitionClass: data.competitionClass?.trim(),
        };

        if (mode === 'edit' && competition) {
          await updateCompetitionAction({ competitionId: competition.competitionId, ...payload });
          toast({ title: "Competition Updated", description: `${data.name} has been updated.` });
        } else {
          await addCompetitionAction(payload);
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Competition' : 'Add New Competition'}</DialogTitle>
          <DialogDescription>Follow the steps to setup your competition.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Define Scope</CardTitle>
                    <CardDescription>Select the season and division. This will determine which teams are eligible to participate.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="seasonId" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger></FormControl><SelectContent>{seasons.map((s) => (<SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending || !seasonId}><FormControl><SelectTrigger><SelectValue placeholder={!seasonId ? "Select a season first" : "Select a division"}/></SelectTrigger></FormControl><SelectContent>{divisions.map((d) => (<SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Competition Details</CardTitle>
                    <CardDescription>Provide a name, format, and optional class for the competition.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Competition Name</FormLabel><FormControl><Input placeholder="e.g. U19 Varsity League" {...field} disabled={isPending || !divisionId} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField
                        control={form.control} name="type" render={({ field }) => (
                        <FormItem className="space-y-3"><FormLabel>Competition Type</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4" disabled={isPending || !divisionId}>
                            {COMPETITION_TYPE_DEFINITIONS.map(typeDef => (
                                <FormItem key={typeDef.id} className={cn("flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors", (isPending || !divisionId) ? "cursor-not-allowed opacity-50" : "hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary" )}>
                                <FormControl><RadioGroupItem value={typeDef.id} disabled={isPending || !divisionId} /></FormControl>
                                <div className="space-y-1 leading-none"><FormLabel className="font-semibold">{typeDef.label}</FormLabel><p className="text-sm text-muted-foreground">{typeDef.description}</p></div>
                                </FormItem>
                            ))}
                        </RadioGroup></FormControl><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="competitionClass" render={({ field }) => (<FormItem><FormLabel>Class / Level (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || " "} disabled={isPending || !divisionId || eligibleClasses.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!divisionId ? "Select a division first" : "Select a class"} /></SelectTrigger></FormControl><SelectContent><SelectItem value=" ">-- No Class --</SelectItem>{eligibleClasses.map((cls) => (<SelectItem key={cls} value={cls}>{cls}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Step 3: Assign Teams</CardTitle>
                    <CardDescription>Select participating teams. The list is filtered based on your selections in Step 1.</CardDescription>
                </CardHeader>
                <CardContent className={cn(!seasonId || !divisionId ? "opacity-50 cursor-not-allowed" : "")}>
                    <fieldset disabled={!seasonId || !divisionId} className="space-y-4">
                        <FormField control={form.control} name="teamIds" render={() => (
                            <FormItem>
                            {eligibleTeams.length > 0 && (
                                <div className="mb-4">
                                    <Label>Filter by School</Label>
                                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate">{schoolFilters.length === 0 && "Select schools to filter..."}{schoolFilters.length === 1 && eligibleSchools.find(s => s.schoolId === schoolFilters[0])?.schoolName}{schoolFilters.length > 1 && `${schoolFilters.length} schools selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[300px]"><DropdownMenuLabel>Filter by School</DropdownMenuLabel><DropdownMenuSeparator />
                                            {eligibleSchools.map(school => (<DropdownMenuCheckboxItem key={school.schoolId} checked={schoolFilters.includes(school.schoolId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => {const newFilters = checked ? [...schoolFilters, school.schoolId] : schoolFilters.filter(id => id !== school.schoolId); setSchoolFilters(newFilters);}}>{school.schoolName}</DropdownMenuCheckboxItem>))}
                                            {schoolFilters.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setSchoolFilters([])} className="justify-center text-sm">Clear filters</DropdownMenuItem></>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            <ScrollArea className="h-48 rounded-md border"><div className="p-4">
                                {filteredTeams.length > 0 ? (
                                    filteredTeams.map((team) => (<FormField key={team.teamId} control={form.control} name="teamIds" render={({ field }) => { return (<FormItem key={team.teamId} className="flex flex-row items-start space-x-3 space-y-0 mb-4"><FormControl><Checkbox checked={field.value?.includes(team.teamId)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), team.teamId]) : field.onChange(field.value?.filter((value) => value !== team.teamId))}}/></FormControl><FormLabel className="font-normal">{team.name}</FormLabel></FormItem>)}}/>))
                                ) : ( <p className="text-sm text-muted-foreground text-center pt-4">{eligibleTeams.length === 0 ? "No teams available for the selected division and season." : "No teams found for the selected school filter."}</p>)}
                            </div></ScrollArea><FormMessage />
                            </FormItem>
                        )}/>
                    </fieldset>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Step 4: Set Status</CardTitle>
                    <CardDescription>Define the current status of the competition. If 'Completed', you can select a winner.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="Draft" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{COMPETITION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    {status === 'Completed' && (
                        <FormField control={form.control} name="winnerTeamId" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Winner (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isPending || eligibleTeams.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={eligibleTeams.length === 0 ? "No eligible teams" : "Select a winning team"} /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value=" ">-- No Winner --</SelectItem>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>))}</SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )} />
                    )}
                </CardContent>
            </Card>

            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Competition"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CompetitionsClient({ competitions, seasons, divisions, teams, isAdmin }: { competitions: Competition[], seasons: Season[], divisions: Division[], teams: Team[], isAdmin: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedCompetition, setSelectedCompetition] = React.useState<Competition | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isCompetitionDialogOpen, setIsCompetitionDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // View and Pagination state
  const [view, setView] = React.useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 9;

  // Filtering and Sorting state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [seasonFilter, setSeasonFilter] = React.useState<string[]>([]);
  const [divisionFilter, setDivisionFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableColumn; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  const filteredCompetitions = React.useMemo(() => {
    return competitions.filter(comp => {
        const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter.length === 0 || typeFilter.includes(comp.type);
        const matchesSeason = seasonFilter.length === 0 || seasonFilter.includes(comp.seasonId);
        const matchesDivision = divisionFilter.length === 0 || divisionFilter.includes(comp.divisionId);
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(comp.status);
        return matchesSearch && matchesType && matchesSeason && matchesDivision && matchesStatus;
    });
  }, [competitions, searchQuery, typeFilter, seasonFilter, divisionFilter, statusFilter]);

  const sortedCompetitions = React.useMemo(() => {
    let sortableItems = [...filteredCompetitions];
    sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [filteredCompetitions, sortConfig]);

  const filtersApplied = searchQuery || typeFilter.length > 0 || seasonFilter.length > 0 || divisionFilter.length > 0 || statusFilter.length > 0;
  
  // Reset page on filter/view/sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, seasonFilter, divisionFilter, statusFilter, view, sortConfig]);

  // Pagination logic
  const paginatedCompetitions = sortedCompetitions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedCompetitions.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const requestSort = (key: SortableColumn) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (column: SortableColumn) => {
    if (sortConfig.key !== column) return null;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

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

  const SortableHeader = ({ column, children }: { column: SortableColumn, children: React.ReactNode }) => (
    <TableHead>
        <Button variant="ghost" onClick={() => requestSort(column)} className="px-0 hover:bg-transparent">
            {children}
            {getSortIcon(column)}
        </Button>
    </TableHead>
  );

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Competitions</h1><p className="text-muted-foreground">Manage your leagues, cups, and tournaments.</p></div>
          {isAdmin && <Button onClick={() => { setDialogMode('add'); setSelectedCompetition(null); setIsCompetitionDialogOpen(true); }}><PlusCircle className="mr-2"/>Add Competition</Button>}
        </header>
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Competition List</CardTitle>
                        <CardDescription>A list of all competitions in the system.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
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
                                        
                                        <div className="grid grid-cols-3 items-center gap-4"><Label>Type</Label>
                                            <DropdownMenu><DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">
                                                    {typeFilter.length === 0 && "Select types..."}
                                                    {typeFilter.length === 1 && typeFilter[0]}
                                                    {typeFilter.length > 1 && `${typeFilter.length} types selected`}
                                                </span><ChevronDown className="h-4 w-4 opacity-50" /></Button>
                                            </DropdownMenuTrigger><DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Type</DropdownMenuLabel><DropdownMenuSeparator />
                                                {COMPETITION_TYPES.map(type => (<DropdownMenuCheckboxItem key={type} checked={typeFilter.includes(type)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => {
                                                    const newFilters = checked ? [...typeFilter, type] : typeFilter.filter(id => id !== type); setTypeFilter(newFilters);
                                                }}>{type}</DropdownMenuCheckboxItem>))}
                                                {typeFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setTypeFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                            </DropdownMenuContent></DropdownMenu>
                                        </div>

                                        <div className="grid grid-cols-3 items-center gap-4"><Label>Season</Label>
                                            <DropdownMenu><DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">
                                                    {seasonFilter.length === 0 && "Select seasons..."}
                                                    {seasonFilter.length === 1 && seasons.find(s => s.seasonId === seasonFilter[0])?.name}
                                                    {seasonFilter.length > 1 && `${seasonFilter.length} seasons selected`}
                                                </span><ChevronDown className="h-4 w-4 opacity-50" /></Button>
                                            </DropdownMenuTrigger><DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Season</DropdownMenuLabel><DropdownMenuSeparator />
                                                {seasons.map(season => (<DropdownMenuCheckboxItem key={season.seasonId} checked={seasonFilter.includes(season.seasonId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => {
                                                    const newFilters = checked ? [...seasonFilter, season.seasonId] : seasonFilter.filter(id => id !== season.seasonId); setSeasonFilter(newFilters);
                                                }}>{season.name}</DropdownMenuCheckboxItem>))}
                                                {seasonFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setSeasonFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                            </DropdownMenuContent></DropdownMenu>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 items-center gap-4"><Label>Division</Label>
                                            <DropdownMenu><DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">
                                                    {divisionFilter.length === 0 && "Select divisions..."}
                                                    {divisionFilter.length === 1 && divisions.find(d => d.divisionId === divisionFilter[0])?.name}
                                                    {divisionFilter.length > 1 && `${divisionFilter.length} divisions selected`}
                                                </span><ChevronDown className="h-4 w-4 opacity-50" /></Button>
                                            </DropdownMenuTrigger><DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Division</DropdownMenuLabel><DropdownMenuSeparator />
                                                {divisions.map(division => (<DropdownMenuCheckboxItem key={division.divisionId} checked={divisionFilter.includes(division.divisionId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => {
                                                    const newFilters = checked ? [...divisionFilter, division.divisionId] : divisionFilter.filter(id => id !== division.divisionId); setDivisionFilter(newFilters);
                                                }}>{division.name}</DropdownMenuCheckboxItem>))}
                                                {divisionFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setDivisionFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                            </DropdownMenuContent></DropdownMenu>
                                        </div>

                                        <div className="grid grid-cols-3 items-center gap-4"><Label>Status</Label>
                                            <DropdownMenu><DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">
                                                    {statusFilter.length === 0 && "Select statuses..."}
                                                    {statusFilter.length === 1 && statusFilter[0]}
                                                    {statusFilter.length > 1 && `${statusFilter.length} statuses selected`}
                                                </span><ChevronDown className="h-4 w-4 opacity-50" /></Button>
                                            </DropdownMenuTrigger><DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Status</DropdownMenuLabel><DropdownMenuSeparator />
                                                {COMPETITION_STATUSES.map(status => (<DropdownMenuCheckboxItem key={status} checked={statusFilter.includes(status)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => {
                                                    const newFilters = checked ? [...statusFilter, status] : statusFilter.filter(id => id !== status); setStatusFilter(newFilters);
                                                }}>{status}</DropdownMenuCheckboxItem>))}
                                                {statusFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setStatusFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                            </DropdownMenuContent></DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center rounded-md bg-muted p-1">
                            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className="gap-1"><List className="h-4 w-4" /> List</Button>
                            <Button variant={view === 'card' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('card')} className="gap-1"><LayoutGrid className="h-4 w-4" /> Card</Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
             {view === 'list' && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHeader column="name">Name</SortableHeader>
                            <SortableHeader column="type">Type</SortableHeader>
                            <TableHead>Class</TableHead>
                            <SortableHeader column="seasonName">Season</SortableHeader>
                            <SortableHeader column="divisionName">Division</SortableHeader>
                            <SortableHeader column="status">Status</SortableHeader>
                            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedCompetitions.length > 0 ? (
                        paginatedCompetitions.map((comp) => (
                        <TableRow key={comp.competitionId}>
                            <TableCell className="font-medium">
                                <Link href={`/competitions/${comp.competitionId}`} className="hover:underline">{comp.name}</Link>
                                {comp.winnerTeamName && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Trophy className="h-3 w-3 text-accent" />
                                        <span>Winner: {comp.winnerTeamName}</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{comp.type}</TableCell>
                            <TableCell>{comp.competitionClass || '-'}</TableCell>
                            <TableCell>{comp.seasonName}</TableCell>
                            <TableCell>{comp.divisionName}</TableCell>
                            <TableCell><Badge variant={comp.status === 'Completed' ? 'secondary' : (comp.status === 'In Progress' ? 'default' : 'outline')}>{comp.status}</Badge></TableCell>
                            {isAdmin && <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setSelectedCompetition(comp); setDialogMode('edit'); setIsCompetitionDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setSelectedCompetition(comp); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>}
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">{filtersApplied ? "No competitions found matching your filters." : "No competitions found. Get started by adding one."}</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
             )}
             {view === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedCompetitions.length > 0 ? (
                        paginatedCompetitions.map(comp => (
                            <CompetitionCard 
                                key={comp.competitionId} 
                                competition={comp} 
                                onEdit={() => { setSelectedCompetition(comp); setDialogMode('edit'); setIsCompetitionDialogOpen(true); }}
                                onDelete={() => { setSelectedCompetition(comp); setIsDeleteDialogOpen(true); }}
                                isAdmin={isAdmin}
                            />
                        ))
                    ) : (
                        <p className="col-span-full h-24 flex items-center justify-center text-muted-foreground">{filtersApplied ? "No competitions found matching your filters." : "No competitions found."}</p>
                    )}
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex items-center justify-center pt-8">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                    <span className="mx-4 text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
      
      {isAdmin && <CompetitionDialog mode={dialogMode} competition={selectedCompetition ?? undefined} seasons={seasons} divisions={divisions} teams={teams} open={isCompetitionDialogOpen} onOpenChange={setIsCompetitionDialogOpen} />}
      
      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedCompetition?.name}</strong>. Any matches associated with this competition will need to be updated manually.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompetition(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Competition"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
