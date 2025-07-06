

'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';
import { format } from "date-fns";
import { PlusCircle, MoreHorizontal, Edit, Trash2, List, LayoutGrid, ArrowUp, ArrowDown, ChevronDown, SlidersHorizontal, Trophy, Wand2, Loader2, CalendarIcon } from "lucide-react";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Competition, Season, Division, Team } from "@/lib/data";
import { deleteCompetitionAction, autoScheduleFixturesAction } from '@/lib/actions/competitions';
import { CompetitionCard } from "./competition-card";
import { CompetitionDialog } from './competition-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const scheduleSchema = z.object({
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface AutoScheduleDialogProps {
  competition: Competition;
  season: Season;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AutoScheduleDialog({ competition, season, open, onOpenChange }: AutoScheduleDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      startDate: season.startDate > new Date() ? season.startDate : new Date(),
      endDate: season.endDate,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        startDate: season.startDate > new Date() ? season.startDate : new Date(),
        endDate: season.endDate,
      });
    }
  }, [open, form, season]);

  function onSubmit(data: ScheduleFormValues) {
    startTransition(async () => {
      try {
        await autoScheduleFixturesAction(competition.competitionId, data.startDate, data.endDate);
        toast({ title: "Fixtures Scheduled", description: "The match schedule has been generated and saved." });
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error Scheduling", description: error instanceof Error ? error.message : "Could not schedule fixtures.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auto-Schedule Fixtures for {competition.name}</DialogTitle>
          <DialogDescription>
            Select a start and end date for the fixture generation. Matches will be scheduled weekly on Saturdays within this range. The date range must be within the season dates ({format(season.startDate, 'PPP')} - {format(season.endDate, 'PPP')}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < season.startDate || date > season.endDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (form.getValues('startDate') || season.startDate) || date > season.endDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isPending ? "Scheduling..." : "Generate Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


const COMPETITION_TYPES = ['League', 'Cup', 'Tournament', 'Festival', 'Friendlies'] as const;
const COMPETITION_STATUSES = ['Draft', 'In Progress', 'Completed'] as const;
type SortableColumn = 'name' | 'type' | 'seasonName' | 'divisionName' | 'status';

export default function CompetitionsClient({ competitions, seasons, divisions, teams, isAdmin }: { competitions: Competition[], seasons: Season[], divisions: Division[], teams: Team[], isAdmin: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedCompetition, setSelectedCompetition] = React.useState<Competition | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isCompetitionDialogOpen, setIsCompetitionDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [competitionToSchedule, setCompetitionToSchedule] = React.useState<Competition | null>(null);


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

  const SortableHeader = ({ column, children, className }: { column: SortableColumn, children: React.ReactNode, className?: string }) => (
    <TableHead className={className}>
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
                                    <SlidersHorizontal className="h-4 w-4" />
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
                        <TooltipProvider>
                            <div className="flex items-center rounded-md bg-muted p-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>List View</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant={view === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('card')} className="h-8 w-8"><LayoutGrid /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Card View</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
             {view === 'list' && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHeader column="name">Name</SortableHeader>
                            <SortableHeader column="type" className="hidden md:table-cell">Type</SortableHeader>
                            <TableHead className="hidden md:table-cell">Class</TableHead>
                            <SortableHeader column="seasonName" className="hidden md:table-cell">Season</SortableHeader>
                            <SortableHeader column="divisionName" className="hidden md:table-cell">Division</SortableHeader>
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
                            <TableCell className="hidden md:table-cell">{comp.type}</TableCell>
                            <TableCell className="hidden md:table-cell">{comp.competitionClass || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">{comp.seasonName}</TableCell>
                            <TableCell className="hidden md:table-cell">{comp.divisionName}</TableCell>
                            <TableCell><Badge variant={comp.status === 'Completed' ? 'secondary' : (comp.status === 'In Progress' ? 'default' : 'outline')}>{comp.status}</Badge></TableCell>
                            {isAdmin && <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setSelectedCompetition(comp); setDialogMode('edit'); setIsCompetitionDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                {comp.type === 'League' && <DropdownMenuItem onSelect={() => setCompetitionToSchedule(comp)}><Wand2 className="mr-2 h-4 w-4" /> Auto-Schedule</DropdownMenuItem>}
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
                                onAutoSchedule={() => setCompetitionToSchedule(comp)}
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
      
      {competitionToSchedule && (
        <AutoScheduleDialog
          competition={competitionToSchedule}
          season={seasons.find(s => s.seasonId === competitionToSchedule.seasonId)!}
          open={!!competitionToSchedule}
          onOpenChange={() => setCompetitionToSchedule(null)}
        />
      )}

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
