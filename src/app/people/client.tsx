
'use client';

import * as React from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Search, List, LayoutGrid, ChevronDown } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Person } from "@/lib/data";
import { deletePlayerAction } from '@/lib/actions/players';
import { PersonCard } from "./person-card";

const PersonDialog = dynamic(() => import('./person-dialog').then(mod => mod.PersonDialog), {
  ssr: false,
});

const ROLES = [
  { id: "Player", label: "Player" }, { id: "Coach", label: "Coach" },
  { id: "Assistant Coach", label: "Assistant Coach" }, { id: "Team Manager", label: "Team Manager" },
  { id: "Trainer", label: "Trainer" }, { id: "Physio", label: "Physio" },
  { id: "Doctor", label: "Doctor" }, { id: "First Aid", label: "First Aid" },
  { id: "Umpire", label: "Umpire" }, { id: "Scorer", label: "Scorer" },
  { id: "Guardian", label: "Guardian" }, { id: "Sportmaster", label: "Sportmaster" },
  { id: "Grounds-Keeper", label: "Grounds-Keeper" }, { id: "Driver", label: "Driver" },
] as const;

export default function PeopleClient({ people }: { people: Person[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isPersonDialogOpen, setIsPersonDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // View and Pagination state
  const [view, setView] = React.useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 12;
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilters, setRoleFilters] = React.useState<string[]>([]);

  const filteredPeople = people.filter(person => {
    const matchesSearch = `${person.firstName} ${person.lastName} ${person.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilters.length === 0 || roleFilters.every(role => person.roles.includes(role));
    return matchesSearch && matchesRole;
  });

  const filtersApplied = searchQuery || roleFilters.length > 0;

  // Reset page to 1 when filters or view change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilters, view]);

  // Pagination logic
  const paginatedPeople = filteredPeople.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);

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

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">People</h1><p className="text-muted-foreground">Manage your roster of players, coaches, and officials.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedPerson(null); setIsPersonDialogOpen(true); }}><PlusCircle className="mr-2" />Add Person</Button>
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Person Roster</CardTitle>
                <CardDescription>A list of all people in the system.</CardDescription>
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
                                            {roleFilters.length === 1 && ROLES.find(r => r.id === roleFilters[0])?.label}
                                            {roleFilters.length > 1 && `${roleFilters.length} roles selected`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {ROLES.map(role => (
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
                                        Clear filters
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
                  <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPeople.length > 0 ? (
                    paginatedPeople.map((person) => (
                      <TableRow key={person.personId}>
                        <TableCell className="font-medium flex items-center gap-3">
                          <Avatar><AvatarImage src={person.profileImageUrl} alt={`${person.firstName} ${person.lastName}`} /><AvatarFallback>{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar>
                          <Link href={`/people/${person.personId}`} className="hover:underline">{person.firstName} {person.lastName}</Link>
                        </TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {person.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="capitalize">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => { setSelectedPerson(person); setDialogMode('edit'); setIsPersonDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setSelectedPerson(person); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">{filtersApplied ? "No people found matching your filters." : 'No people found. Get started by adding someone.'}</TableCell></TableRow>
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
                                onEdit={() => { setSelectedPerson(person); setDialogMode('edit'); setIsPersonDialogOpen(true); }}
                                onDelete={() => { setSelectedPerson(person); setIsDeleteDialogOpen(true); }}
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

      {isPersonDialogOpen && <PersonDialog mode={dialogMode} person={selectedPerson ?? undefined} open={isPersonDialogOpen} onOpenChange={setIsPersonDialogOpen} />}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
      </AlertDialog>
    </>
  );
}
