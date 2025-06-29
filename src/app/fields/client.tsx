

'use client';

import * as React from "react";
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, List, LayoutGrid, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { Field, School, Person } from "@/lib/data";
import { addFieldAction, updateFieldAction, deleteFieldAction } from '@/lib/actions/fields';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FieldCard } from "./field-card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const fieldSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  schoolId: z.string().optional(),
  status: z.enum(['Available', 'Maintenance', 'Closed']).default('Available'),
  pitchType: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  assignments: z.array(z.string()).optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  alias: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  coordinates: z.object({
      lat: z.coerce.number().min(-90).max(90).optional(),
      lon: z.coerce.number().min(-180).max(180).optional(),
  }).optional(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;
const FIELD_STATUSES = ['Available', 'Maintenance', 'Closed'] as const;
const PITCH_TYPES = ['Natural Turf', 'Drop-in Turf', 'Artificial Astro-Turf', 'Matting Wicket', 'Concrete Base', 'Indoor Synthetic', 'Hybrid Reinforced', 'Drop-in Artificial'] as const;
const FIELD_SIZES = ['Full Size', 'Youth', 'Training Area'] as const;
const FACILITIES = [
    { id: 'pavilion', label: 'Pavilion' },
    { id: 'toilets', label: 'Toilets' },
    { id: 'nets', label: 'Nets' },
    { id: 'scoreboard', label: 'Scoreboard' },
    { id: 'floodlights', label: 'Floodlights' },
] as const;
const AMENITIES = [
    { id: 'parking', label: 'Parking' },
    { id: 'seating', label: 'Seating' },
    { id: 'food_drink', label: 'Food & Drink' },
    { id: 'changing_rooms', label: 'Changing Rooms' },
] as const;


function FieldDialog({ mode, field, schools, groundskeepers, open, onOpenChange }: { mode: 'add' | 'edit', field?: Field, schools: School[], groundskeepers: Person[], open: boolean, onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: mode === 'edit' && field ? 
        { ...field, schoolId: field.schoolId || ' ', assignments: field.assignments?.map(a => a.personId) || [] } : 
        { name: "", schoolId: ' ', status: "Available", pitchType: 'Natural Turf', facilities: [], amenities: [], assignments: [] },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && field) {
        form.reset({ ...field, schoolId: field.schoolId || ' ', assignments: field.assignments?.map(a => a.personId) || [] });
      } else {
        form.reset({ name: "", alias: "", schoolId: ' ', status: "Available", pitchType: 'Natural Turf', facilities: [], amenities: [], assignments: [], contactPerson: "", contactPhone: "", notes: "" });
      }
    }
  }, [field, mode, open, form]);

  function onSubmit(data: FieldFormValues) {
    startTransition(async () => {
      try {
        const payload = { ...data, schoolId: data.schoolId?.trim() === '' ? undefined : data.schoolId };
        if (mode === 'edit' && field) {
          await updateFieldAction({ fieldId: field.fieldId, ...payload });
          toast({ title: "Field Updated", description: `${data.name} has been updated.` });
        } else {
          await addFieldAction(payload);
          toast({ title: "Field Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} field.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit Field' : 'Add New Field'}</DialogTitle><DialogDescription>Enter the details for the field or venue.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Field Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Field Name</FormLabel><FormControl><Input placeholder="e.g. Main Oval" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="alias" render={({ field }) => (<FormItem><FormLabel>Alias (Optional)</FormLabel><FormControl><Input placeholder="e.g. The Oval" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="schoolId" render={({ field }) => (<FormItem><FormLabel>Owning School (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a school (if applicable)" /></SelectTrigger></FormControl><SelectContent><SelectItem value=" ">-- None (Independent Field) --</SelectItem>{schools.map((s) => (<SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                
                <h3 className="text-sm font-medium text-muted-foreground pt-2">Location</h3>
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g. 123 Cricket Lane, Sportsville" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="coordinates.lat" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" placeholder="-29.318" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="coordinates.lon" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" placeholder="29.96" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="Available" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{FIELD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <Separator />
            <div className="space-y-4">
                 <h3 className="text-base font-semibold text-foreground">Specifications &amp; Facilities</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="pitchType" render={({ field }) => (<FormItem><FormLabel>Pitch Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{PITCH_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Field Size</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger></FormControl><SelectContent>{FIELD_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <FormField control={form.control} name="facilities" render={() => (
                        <FormItem><FormLabel>Facilities</FormLabel><div className="space-y-2 rounded-lg border p-4">
                        {FACILITIES.map((item) => (<FormField key={item.id} control={form.control} name="facilities" render={({ field }) => { return (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}}/>))}
                        </div><FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="amenities" render={() => (
                        <FormItem><FormLabel>Amenities</FormLabel><div className="space-y-2 rounded-lg border p-4">
                        {AMENITIES.map((item) => (<FormField key={item.id} control={form.control} name="amenities" render={({ field }) => { return (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}}/>))}
                        </div><FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </div>
            <Separator />
             <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Contact &amp; Notes</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g. John Smith" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="e.g. 555-1234" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Condition Notes</FormLabel><FormControl><Textarea placeholder="e.g. Excellent drainage, pitch plays fast." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
            <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Staffing</h3>
                 <FormField control={form.control} name="assignments" render={() => (
                    <FormItem>
                        <FormLabel>Assigned Grounds-Keepers</FormLabel>
                        <FormDescription>Select the staff responsible for this field.</FormDescription>
                        <ScrollArea className="h-40 w-full rounded-lg border p-4">
                        {groundskeepers.length > 0 ? (
                            groundskeepers.map((person) => (
                                <FormField key={person.personId} control={form.control} name="assignments" render={({ field }) => { return (<FormItem key={person.personId} className="flex flex-row items-start space-x-3 space-y-0 mb-4"><FormControl><Checkbox checked={field.value?.includes(person.personId)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], person.personId]) : field.onChange(field.value?.filter((id) => id !== person.personId))}} /></FormControl><FormLabel className="font-normal">{person.firstName} {person.lastName}</FormLabel></FormItem>)}}/>
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground pt-4">No grounds-keepers available. Add them on the People page.</p>
                        )}
                        </ScrollArea>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Field"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FieldsClient({ fields, schools, groundskeepers }: { fields: Field[], schools: School[], groundskeepers: Person[] }) {
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
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or school..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
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
                        <TableCell><Badge variant={field.status === 'Available' ? 'secondary' : (field.status === 'Maintenance' ? 'outline' : 'destructive')}>{field.status}</Badge></TableCell>
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

      {isFieldDialogOpen && <FieldDialog mode={dialogMode} field={selectedField ?? undefined} schools={schools} groundskeepers={groundkeepers} open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen} />}
      
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
