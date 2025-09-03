

'use client';

import * as React from "react";
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, SlidersHorizontal, List, LayoutGrid, ArrowUp, ArrowDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import type { Field, School, Person } from "@/lib/data";
import { deleteFieldAction } from '@/lib/actions/fields';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FieldCard } from "./field-card";
import { FieldDialog } from "./field-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export default function FieldsClient({ fields, schools, groundkeepers }: { fields: Field[], schools: School[], groundkeepers: Person[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedField, setSelectedField] = React.useState<Field | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isFieldDialogOpen, setIsFieldDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // View, Pagination, Filtering, Sorting state
  const [view, setView] = React.useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 12;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'schoolName'; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (field.schoolName && field.schoolName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedFields = React.useMemo(() => {
    let sortableItems = [...filteredFields];
    sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [filteredFields, sortConfig]);

  const paginatedFields = sortedFields.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedFields.length / ITEMS_PER_PAGE);

  const requestSort = (key: 'name' | 'schoolName') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (column: 'name' | 'schoolName') => {
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


  const handleDelete = () => {
    if (!selectedField) return;
    startTransition(async () => {
      try {
        await deleteFieldAction(selectedField.fieldId);
        toast({ title: "Field Deleted", description: `${selectedField.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedField(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete field.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedField(null);
      }
    });
  };

  const SortableHeader = ({ column, children }: { column: 'name' | 'schoolName', children: React.ReactNode }) => (
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
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Fields & Venues</h1><p className="text-muted-foreground">Manage your sporting fields and venues.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedField(null); setIsFieldDialogOpen(true); }}><PlusCircle className="mr-2"/>Add Field</Button>
        </header>

         <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Field List</CardTitle>
                <CardDescription>A list of all fields and venues in the system.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="relative">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="sr-only">Filter Fields</span>
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
                            <div className="space-y-2"><h4 className="font-medium leading-none">Filter Fields</h4><p className="text-sm text-muted-foreground">Find fields by name or owner school.</p></div>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="search-input">Search</Label>
                                <Input id="search-input" placeholder="Name or school..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="col-span-2 h-8"/></div>
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
                    <SortableHeader column="name">Field Name</SortableHeader>
                    <SortableHeader column="schoolName">Owner</SortableHeader>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFields.length > 0 ? (
                    paginatedFields.map((field) => (
                      <TableRow key={field.fieldId}>
                        <TableCell className="font-medium"><Link href={`/fields/${field.fieldId}`} className="hover:underline">{field.name}</Link></TableCell>
                        <TableCell>{field.schoolName || <span className="text-muted-foreground">Independent</span>}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Badge variant={field.status === 'Available' ? 'secondary' : (field.status === 'Maintenance' ? 'outline' : 'destructive')} className="capitalize">{field.status}</Badge></div></TableCell>
                        <TableCell>{field.assignments?.length || 0}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => { setSelectedField(field); setDialogMode('edit'); setIsFieldDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setSelectedField(field); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Field</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">{searchQuery ? "No fields found matching your search." : "No fields found. Get started by adding a field."}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            {view === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedFields.length > 0 ? (
                        paginatedFields.map(field => (
                            <FieldCard 
                                key={field.fieldId} 
                                field={field} 
                                onEdit={() => { setSelectedField(field); setDialogMode('edit'); setIsFieldDialogOpen(true); }}
                                onDelete={() => { setSelectedField(field); setIsDeleteDialogOpen(true); }}
                            />
                        ))
                    ) : (
                        <p className="col-span-full h-24 flex items-center justify-center text-muted-foreground">{searchQuery ? "No fields found matching your search." : "No fields found."}</p>
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

      {isFieldDialogOpen && <FieldDialog mode={dialogMode} field={selectedField ?? undefined} schools={schools} groundkeepers={groundkeepers} open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen} />}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedField?.name}</strong>. Any matches scheduled at this venue will need to be updated manually.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedField(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Field"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
