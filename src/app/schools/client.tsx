

'use client';

import * as React from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, Edit, Trash2, SlidersHorizontal, List, LayoutGrid, ArrowUp, ArrowDown } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { School } from "@/lib/data";
import { deleteSchoolAction } from '@/lib/actions/schools';
import { SchoolDialog } from "./school-dialog";
import { SchoolCard } from "./school-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

type SortableColumn = 'name' | 'abbreviation';

export default function SchoolsClient({ schools, canManage }: { schools: School[], canManage: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  
  const [selectedSchool, setSelectedSchool] = React.useState<School | null>(null);
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // View, Pagination, Filtering, Sorting state
  const [view, setView] = React.useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 12;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableColumn; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  const handleDelete = () => {
    if (!selectedSchool) return;
    startTransition(async () => {
      try {
        await deleteSchoolAction(selectedSchool.schoolId);
        toast({ title: "School Deleted", description: `${selectedSchool.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedSchool(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete school.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedSchool(null);
      }
    });
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.abbreviation && school.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedSchools = React.useMemo(() => {
    let sortableItems = [...filteredSchools];
    sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [filteredSchools, sortConfig]);

  const paginatedSchools = sortedSchools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedSchools.length / ITEMS_PER_PAGE);

  const requestSort = (key: SortableColumn) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (column: SortableColumn) => {
    if (sortConfig.key !== column) return null;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-4 w-4" />
    return <ArrowDown className="ml-2 h-4 w-4" />
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, view, sortConfig]);

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Schools</h1>
            <p className="text-muted-foreground">Manage your schools and educational institutions.</p>
          </div>
          {canManage && <Button onClick={() => { setDialogMode('add'); setSelectedSchool(null); setIsSchoolDialogOpen(true); }}><PlusCircle className="mr-2" />Add School</Button>}
        </header>
        <Card>
          <CardHeader>
             <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>School List</CardTitle>
                  <CardDescription>A list of all schools in the system.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="relative">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="sr-only">Filter Schools</span>
                                {searchQuery && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2"><h4 className="font-medium leading-none">Filter Schools</h4><p className="text-sm text-muted-foreground">Find schools by name or abbreviation.</p></div>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="search-input">Search</Label>
                                    <Input id="search-input" placeholder="Name or abbreviation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="col-span-2 h-8"/></div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <TooltipProvider>
                        <div className="flex items-center rounded-md bg-muted p-1">
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List /></Button></TooltipTrigger>
                                <TooltipContent><p>List View</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant={view === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('card')} className="h-8 w-8"><LayoutGrid /></Button></TooltipTrigger>
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
                    <SortableHeader column="abbreviation">Abbreviation</SortableHeader>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSchools.length > 0 ? (
                    paginatedSchools.map((school) => (
                      <TableRow key={school.schoolId}>
                        <TableCell className="font-medium"><Link href={`/schools/${school.schoolId}`} className="hover:underline">{school.name}</Link></TableCell>
                        <TableCell>{school.abbreviation}</TableCell>
                        {canManage && <TableCell className="text-right"><DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => { setSelectedSchool(school); setDialogMode('edit'); setIsSchoolDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setSelectedSchool(school); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>}
                      </TableRow>
                    ))
                  ) : ( <TableRow><TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center">{searchQuery ? "No schools found matching your search." : "No schools found."}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            )}
             {view === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedSchools.length > 0 ? (
                        paginatedSchools.map(school => (
                            <SchoolCard 
                                key={school.schoolId} 
                                school={school} 
                                onEdit={() => { setSelectedSchool(school); setDialogMode('edit'); setIsSchoolDialogOpen(true); }}
                                onDelete={() => { setSelectedSchool(school); setIsDeleteDialogOpen(true); }}
                                canManage={canManage}
                            />
                        ))
                    ) : (
                        <p className="col-span-full h-24 flex items-center justify-center text-muted-foreground">{searchQuery ? "No schools found matching your search." : "No schools found."}</p>
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

      {canManage && (
        <SchoolDialog
          mode={dialogMode}
          school={selectedSchool ?? undefined}
          open={isSchoolDialogOpen}
          onOpenChange={setIsSchoolDialogOpen}
        />
      )}
      
      {canManage && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedSchool?.name}</strong>. Any teams associated with this school will not be deleted and will need to be updated manually.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSchool(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete School"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
