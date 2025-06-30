

'use client';

import * as React from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useForm } from "react-hook-form";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Search, List, LayoutGrid, ChevronDown, ArrowUp, ArrowDown, Building, Users } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Person, School, Team } from "@/lib/data";
import { deletePlayerAction } from '@/lib/actions/players';
import { bulkAssignPeopleToTeamAction } from '@/lib/actions/teams';
import { PersonCard } from "./person-card";
import { ROLE_GROUPS } from "@/lib/roles";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AssignSchoolDialog } from "./assign-school-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";


const PersonDialog = dynamic(() => import('./person-dialog').then(mod => mod.PersonDialog), {
  ssr: false,
});

const ALL_ROLES = ROLE_GROUPS.flatMap(group => group.roles);


type SortableColumn = 'name' | 'email' | 'schoolName';

const bulkAssignTeamSchema = z.object({
  teamId: z.string({ required_error: "Please select a team." }),
});

function BulkAssignTeamDialog({ personIds, teams, open, onOpenChange, onSuccess }: { personIds: string[], teams: Team[], open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const form = useForm<z.infer<typeof bulkAssignTeamSchema>>({
        resolver: zodResolver(bulkAssignTeamSchema),
    });

    function onSubmit(data: z.infer<typeof bulkAssignTeamSchema>) {
        startTransition(async () => {
            try {
                await bulkAssignPeopleToTeamAction(data.teamId, personIds);
                toast({ title: "Assignment Successful", description: `${personIds.length} people have been added to the team.` });
                onSuccess();
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not assign people.", variant: "destructive" });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign to Team</DialogTitle>
                    <DialogDescription>Assign the selected {personIds.length} people to a team with the 'Player' role.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="teamId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Team</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl>
                                        <SelectContent>{teams.map(t => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? "Assigning..." : "Assign to Team"}</Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    );
}


export default function PeopleClient({ people, user, schools, teams }: { people: Person[], user: Person | null, schools: School[], teams: Team[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
  const [personToAssign, setPersonToAssign] = React.useState<Person | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isPersonDialogOpen, setIsPersonDialogOpen] = React.useState(false);
  const [isAssignSchoolDialogOpen, setIsAssignSchoolDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // View, Pagination, Filtering, and Sorting state
  const [view, setView] = React.useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 12;
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilters, setRoleFilters] = React.useState<string[]>([]);
  const [schoolFilter, setSchoolFilter] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableColumn; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  
  const canManage = user?.roles.some(role => ['Admin', 'Sportsmaster', 'Team Manager'].includes(role)) ?? false;
  const canEditUsers = user?.roles.includes('Admin') ?? false;

  const [selectedRowKeys, setSelectedRowKeys] = React.useState<string[]>([]);
  const [isBulkAssignTeamDialogOpen, setIsBulkAssignTeamDialogOpen] = React.useState(false);

  const filteredPeople = React.useMemo(() => {
    return people.filter(person => {
      const matchesSearch = `${person.firstName} ${person.lastName} ${person.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRole = roleFilters.length === 0 || roleFilters.some(role => person.roles.includes(role));
      const matchesSchool = schoolFilter.length === 0 || schoolFilter.some(schoolId => person.assignedSchools?.includes(schoolId));
      return matchesSearch && matchesRole && matchesSchool;
    });
  }, [people, searchQuery, roleFilters, schoolFilter]);

  const sortedPeople = React.useMemo(() => {
    let sortableItems = [...filteredPeople];
    sortableItems.sort((a, b) => {
        let aValue: string;
        let bValue: string;

        if (sortConfig.key === 'schoolName') {
            const schoolA = schools.find(s => s.schoolId === a.assignedSchools?.[0]);
            const schoolB = schools.find(s => s.schoolId === b.assignedSchools?.[0]);
            aValue = schoolA?.name?.toLowerCase() ?? '';
            bValue = schoolB?.name?.toLowerCase() ?? '';
        } else if (sortConfig.key === 'name') {
            aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
            bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        } else { // email
            aValue = a[sortConfig.key]?.toLowerCase() ?? '';
            bValue = b[sortConfig.key]?.toLowerCase() ?? '';
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [filteredPeople, sortConfig, schools]);

  const filtersApplied = searchQuery || roleFilters.length > 0 || schoolFilter.length > 0;

  // Reset page to 1 when filters or view change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedRowKeys([]);
  }, [searchQuery, roleFilters, schoolFilter, view, sortConfig]);

  // Pagination logic
  const paginatedPeople = sortedPeople.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedPeople.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleDelete = () => {
    if (!selectedPerson) return;
    startTransition(async () => {
      try {
        await deletePlayerAction(selectedPerson.personId);
        toast({ title: "Person Deleted", description: `${selectedPerson.firstName} ${selectedPerson.lastName} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedPerson(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete person.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedPerson(null);
      }
    });
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
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">People</h1><p className="text-muted-foreground">Manage your roster of players, coaches, and officials.</p></div>
          {canEditUsers && <Button onClick={() => { setDialogMode('add'); setSelectedPerson(null); setIsPersonDialogOpen(true); }}><PlusCircle className="mr-2" />Add Person</Button>}
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Person Roster</CardTitle>
                <CardDescription>A list of all people in the system.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedRowKeys.length > 0 && canManage && (
                    <Button onClick={() => setIsBulkAssignTeamDialogOpen(true)}>
                        <Users className="mr-2"/>
                        Assign to Team ({selectedRowKeys.length})
                    </Button>
                )}
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
                        <h4 className="font-medium leading-none">Filter Roster</h4>
                        <p className="text-sm text-muted-foreground">
                          Find people by name, email, or role.
                        </p>
                      </div>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="search-input">Search</Label>
                          <Input
                            id="search-input"
                            placeholder="Name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="col-span-2 h-8"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Roles</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="col-span-2 h-8 justify-between font-normal">
                                        <span className="truncate">
                                            {roleFilters.length === 0 && "Select roles..."}
                                            {roleFilters.length === 1 && ALL_ROLES.find(r => r.id === roleFilters[0])?.label}
                                            {roleFilters.length > 1 && `${roleFilters.length} roles selected`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {ALL_ROLES.map(role => (
                                    <DropdownMenuCheckboxItem
                                        key={role.id}
                                        checked={roleFilters.includes(role.id)}
                                        onSelect={(e) => e.preventDefault()}
                                        onCheckedChange={checked => {
                                            const newFilters = checked
                                                ? [...roleFilters, role.id]
                                                : roleFilters.filter(id => id !== role.id);
                                            setRoleFilters(newFilters);
                                        }}
                                    >
                                        {role.label}
                                    </DropdownMenuCheckboxItem>
                                    ))}
                                    {roleFilters.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                        onSelect={() => setRoleFilters([])}
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
                     <TableHead className="w-12">
                        <Checkbox
                           checked={paginatedPeople.length > 0 && selectedRowKeys.length === paginatedPeople.length}
                           onCheckedChange={(checked) => {
                                setSelectedRowKeys(checked ? paginatedPeople.map(p => p.personId) : []);
                           }}
                           aria-label="Select all rows on this page"
                        />
                     </TableHead>
                    <SortableHeader column="name">Name</SortableHeader>
                    <SortableHeader column="schoolName">Assigned School</SortableHeader>
                    <SortableHeader column="email">Email</SortableHeader>
                    <TableHead>Roles</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPeople.length > 0 ? (
                    paginatedPeople.map((person) => {
                      const assignedSchool = schools.find(s => s.schoolId === person.assignedSchools?.[0]);
                      return (
                      <TableRow key={person.personId}>
                        <TableCell>
                            <Checkbox
                                checked={selectedRowKeys.includes(person.personId)}
                                onCheckedChange={(checked) => {
                                    setSelectedRowKeys(
                                        checked
                                        ? [...selectedRowKeys, person.personId]
                                        : selectedRowKeys.filter(id => id !== person.personId)
                                    );
                                }}
                                aria-label={`Select row for ${person.firstName} ${person.lastName}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium flex items-center gap-3">
                          <Avatar><AvatarImage src={person.profileImageUrl} alt={`${person.firstName} ${person.lastName}`} /><AvatarFallback>{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar>
                          <Link href={`/people/${person.personId}`} className="hover:underline">{person.firstName} {person.lastName}</Link>
                        </TableCell>
                        <TableCell>
                          {assignedSchool ? (
                            <Link href={`/schools/${assignedSchool.schoolId}`} className="hover:underline">{assignedSchool.name}</Link>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="truncate">{person.email}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">{person.activeRole}</Badge>
                                {person.roles.length > 1 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                                                +{person.roles.length - 1}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <ul className="list-disc list-inside">
                                                {person.roles.filter(r => r !== person.activeRole).map(role => (
                                                <li key={role} className="capitalize">{role}</li>
                                                ))}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                )}
                            </div>
                        </TableCell>
                        {canManage && <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditUsers && <DropdownMenuItem onSelect={() => { setSelectedPerson(person); setDialogMode('edit'); setIsPersonDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit Profile</DropdownMenuItem>}
                              <DropdownMenuItem onSelect={() => { setPersonToAssign(person); setIsAssignSchoolDialogOpen(true); }}><Building className="mr-2 h-4 w-4" /> Assign to School</DropdownMenuItem>
                              {canEditUsers && <DropdownMenuSeparator />}
                              {canEditUsers && <DropdownMenuItem onSelect={() => { setSelectedPerson(person); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>}
                      </TableRow>
                    )})
                  ) : (
                    <TableRow><TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">{filtersApplied ? "No people found matching your filters." : 'No people found. Get started by adding someone.'}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
             {view === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedPeople.length > 0 ? (
                        paginatedPeople.map(person => (
                            <PersonCard 
                                key={person.personId} 
                                person={person} 
                                schools={schools}
                                onEdit={() => { setSelectedPerson(person); setDialogMode('edit'); setIsPersonDialogOpen(true); }}
                                onDelete={() => { setSelectedPerson(person); setIsDeleteDialogOpen(true); }}
                                canManage={canEditUsers}
                            />
                        ))
                    ) : (
                        <p className="col-span-full h-24 flex items-center justify-center text-muted-foreground">{filtersApplied ? "No people found matching your filters." : "No people found."}</p>
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

      {isPersonDialogOpen && <PersonDialog mode={dialogMode} person={selectedPerson ?? undefined} currentUser={user} open={isPersonDialogOpen} onOpenChange={setIsPersonDialogOpen} schools={schools} />}
      
      {canManage && personToAssign && (
        <AssignSchoolDialog 
            person={personToAssign}
            schools={schools}
            open={isAssignSchoolDialogOpen}
            onOpenChange={(open) => {
                setIsAssignSchoolDialogOpen(open);
                if (!open) setPersonToAssign(null);
            }}
        />
      )}

      {canManage && <BulkAssignTeamDialog personIds={selectedRowKeys} teams={teams} open={isBulkAssignTeamDialogOpen} onOpenChange={setIsBulkAssignTeamDialogOpen} onSuccess={() => setSelectedRowKeys([])} />}

      {canEditUsers && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{selectedPerson?.firstName} {selectedPerson?.lastName}</strong>, remove them from all team rosters, and delete their associated family links. They will not be removed from completed match scorecards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPerson(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Person"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
