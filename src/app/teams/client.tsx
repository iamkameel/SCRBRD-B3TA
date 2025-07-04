

'use client';

import * as React from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, List, LayoutGrid, ArrowUp, ArrowDown, ChevronDown, User } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Team, School, Division, Season, Person } from "@/lib/data";
import { deleteTeamAction } from '@/lib/actions/teams';
import { TeamCard } from './team-card';
import { AssignCoachDialog } from "./assign-coach-dialog";
import { TeamDialog } from "./team-dialog";

type SortableColumn = 'name' | 'alias' | 'schoolName' | 'divisionName' | 'seasonName' | 'teamClass';

export default function TeamsClient({ teams, schools, divisions, seasons, canManage, coaches }: { teams: Team[]; schools: School[]; divisions: Division[]; seasons: Season[], canManage: boolean; coaches: Person[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
  const [teamToAssignCoach, setTeamToAssignCoach] = React.useState<Team | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isTeamDialogOpen, setIsTeamDialogOpen] = React.useState(false);
  const [isAssignCoachDialogOpen, setIsAssignCoachDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  // View and Pagination state
  const [view, setView] = React.useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 12;
  
  // Filtering and Sorting state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [schoolFilter, setSchoolFilter] = React.useState<string[]>([]);
  const [divisionFilter, setDivisionFilter] = React.useState<string[]>([]);
  const [seasonFilter, setSeasonFilter] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableColumn; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

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

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = schoolFilter.length === 0 || schoolFilter.includes(team.schoolId);
    const matchesDivision = divisionFilter.length === 0 || divisionFilter.includes(team.divisionId);
    const matchesSeason = seasonFilter.length === 0 || seasonFilter.includes(team.seasonId);
    return matchesSearch && matchesSchool && matchesDivision && matchesSeason;
  });

  const sortedTeams = React.useMemo(() => {
    let sortableItems = [...filteredTeams];
    sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [filteredTeams, sortConfig]);

  const filtersApplied = searchQuery || schoolFilter.length > 0 || divisionFilter.length > 0 || seasonFilter.length > 0;

  // Reset page to 1 when filters or view change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, schoolFilter, divisionFilter, seasonFilter, view, sortConfig]);

  // Pagination logic
  const paginatedTeams = sortedTeams.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedTeams.length / ITEMS_PER_PAGE);

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
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Teams</h1><p className="text-muted-foreground">Manage your cricket teams.</p></div>
          {canManage && <Button onClick={() => { setDialogMode('add'); setSelectedTeam(null); setIsTeamDialogOpen(true); }}><PlusCircle className="mr-2" />Add Team</Button>}
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Team List</CardTitle>
                  <CardDescription>A list of all teams in the system.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="relative">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search</span>
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
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filter Teams</h4>
                            <p className="text-sm text-muted-foreground">Filter the list of teams by name, division, or season.</p>
                        </div>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="search-input">Name</Label>
                            <Input
                                id="search-input"
                                placeholder="Team name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="col-span-2 h-8"
                            />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label>School</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="col-span-2 h-8 justify-between font-normal">
                                            <span className="truncate">
                                                {schoolFilter.length === 0 && "Select schools..."}
                                                {schoolFilter.length === 1 && schools.find(s => s.schoolId === schoolFilter[0])?.name}
                                                {schoolFilter.length > 1 && `${schoolFilter.length} schools selected`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuLabel>Filter by School</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {schools.map(school => (
                                        <DropdownMenuCheckboxItem
                                            key={school.schoolId}
                                            checked={schoolFilter.includes(school.schoolId)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={checked => {
                                                const newFilters = checked
                                                    ? [...schoolFilter, school.schoolId]
                                                    : schoolFilter.filter(id => id !== school.schoolId);
                                                setSchoolFilter(newFilters);
                                            }}
                                        >
                                            {school.name}
                                        </DropdownMenuCheckboxItem>
                                        ))}
                                        {schoolFilter.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                            onSelect={() => setSchoolFilter([])}
                                            className="justify-center text-sm"
                                            >
                                            Clear filter
                                            </DropdownMenuItem>
                                        </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label>Division</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="col-span-2 h-8 justify-between font-normal">
                                            <span className="truncate">
                                                {divisionFilter.length === 0 && "Select divisions..."}
                                                {divisionFilter.length === 1 && divisions.find(d => d.divisionId === divisionFilter[0])?.name}
                                                {divisionFilter.length > 1 && `${divisionFilter.length} divisions selected`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuLabel>Filter by Division</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {divisions.map(division => (
                                        <DropdownMenuCheckboxItem
                                            key={division.divisionId}
                                            checked={divisionFilter.includes(division.divisionId)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={checked => {
                                                const newFilters = checked
                                                    ? [...divisionFilter, division.divisionId]
                                                    : divisionFilter.filter(id => id !== division.divisionId);
                                                setDivisionFilter(newFilters);
                                            }}
                                        >
                                            {division.name}
                                        </DropdownMenuCheckboxItem>
                                        ))}
                                        {divisionFilter.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                            onSelect={() => setDivisionFilter([])}
                                            className="justify-center text-sm"
                                            >
                                            Clear filter
                                            </DropdownMenuItem>
                                        </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label>Season</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="col-span-2 h-8 justify-between font-normal">
                                            <span className="truncate">
                                                {seasonFilter.length === 0 && "Select seasons..."}
                                                {seasonFilter.length === 1 && seasons.find(s => s.seasonId === seasonFilter[0])?.name}
                                                {seasonFilter.length > 1 && `${seasonFilter.length} seasons selected`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuLabel>Filter by Season</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {seasons.map(season => (
                                        <DropdownMenuCheckboxItem
                                            key={season.seasonId}
                                            checked={seasonFilter.includes(season.seasonId)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={checked => {
                                                const newFilters = checked
                                                    ? [...seasonFilter, season.seasonId]
                                                    : seasonFilter.filter(id => id !== season.seasonId);
                                                setSeasonFilter(newFilters);
                                            }}
                                        >
                                            {season.name}
                                        </DropdownMenuCheckboxItem>
                                        ))}
                                        {seasonFilter.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                            onSelect={() => setSeasonFilter([])}
                                            className="justify-center text-sm"
                                            >
                                            Clear filter
                                            </DropdownMenuItem>
                                        </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
                        <SortableHeader column="name">Team Name</SortableHeader>
                        <SortableHeader column="alias" className="hidden md:table-cell">Alias</SortableHeader>
                        <SortableHeader column="schoolName" className="hidden lg:table-cell">School</SortableHeader>
                        <SortableHeader column="divisionName" className="hidden md:table-cell">Division</SortableHeader>
                        <SortableHeader column="seasonName" className="hidden lg:table-cell">Season</SortableHeader>
                        <SortableHeader column="teamClass" className="hidden md:table-cell">Class</SortableHeader>
                        {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedTeams.length > 0 ? (
                    paginatedTeams.map((team) => (
                        <TableRow key={team.teamId}>
                        <TableCell className="font-medium"><Link href={`/teams/${team.teamId}`} className="hover:underline">{team.name}</Link></TableCell>
                        <TableCell className="hidden md:table-cell">{team.alias || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{team.schoolName}</TableCell>
                        <TableCell className="hidden md:table-cell">{team.divisionName}</TableCell>
                        <TableCell className="hidden lg:table-cell">{team.seasonName}</TableCell>
                        <TableCell className="hidden md:table-cell">{team.teamClass}</TableCell>
                        {canManage && <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setSelectedTeam(team); setDialogMode('edit'); setIsTeamDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setTeamToAssignCoach(team); setIsAssignCoachDialogOpen(true); }}><User className="mr-2 h-4 w-4" /> Assign Coach</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => { setSelectedTeam(team); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>}
                        </TableRow>
                    ))
                    ) : (
                    <TableRow><TableCell colSpan={canManage ? 7 : 6} className="h-24 text-center">{filtersApplied ? "No teams found matching your filters." : "No teams found. Get started by adding a team."}</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            )}
            {view === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedTeams.length > 0 ? (
                        paginatedTeams.map(team => (
                            <TeamCard 
                                key={team.teamId} 
                                team={team} 
                                onEdit={() => { setSelectedTeam(team); setDialogMode('edit'); setIsTeamDialogOpen(true); }}
                                onDelete={() => { setSelectedTeam(team); setIsDeleteDialogOpen(true); }}
                                onAssignCoach={() => { setTeamToAssignCoach(team); setIsAssignCoachDialogOpen(true); }}
                                canManage={canManage}
                            />
                        ))
                    ) : (
                        <p className="col-span-full h-24 flex items-center justify-center text-muted-foreground">{filtersApplied ? "No teams found matching your filters." : "No teams found."}</p>
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

      {canManage && <TeamDialog mode={dialogMode} team={selectedTeam ?? undefined} schools={schools} divisions={divisions} seasons={seasons} open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen} />}

      {canManage && teamToAssignCoach && (
        <AssignCoachDialog
            team={teamToAssignCoach}
            coaches={coaches}
            open={isAssignCoachDialogOpen}
            onOpenChange={(open) => {
                setIsAssignCoachDialogOpen(open);
                if (!open) setTeamToAssignCoach(null);
            }}
        />
       )}

      {canManage && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedTeam?.name}</strong>, its roster, and all of its associated matches.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTeam(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Team"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
