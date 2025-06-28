

'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, UserPlus, Building } from "lucide-react";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Field, FieldAssignment, Person, School } from "@/lib/data";
import { addFieldAction, updateFieldAction, deleteFieldAction, assignGroundskeeperToFieldAction, removeGroundskeeperFromFieldAction } from '@/lib/actions/fields';
import { Label } from "@/components/ui/label";

const fieldSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  schoolId: z.string().optional(),
  surfaceType: z.string().optional(),
  facilities: z.string().optional(),
  status: z.enum(['Available', 'Maintenance', 'Closed']).default('Available'),
});

type FieldFormValues = z.infer<typeof fieldSchema>;
const FIELD_STATUSES = ['Available', 'Maintenance', 'Closed'] as const;

function FieldDialog({ mode, field, schools, open, onOpenChange }: { mode: 'add' | 'edit', field?: Field, schools: School[], open: boolean, onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: mode === 'edit' && field ? 
        { name: field.name, schoolId: field.schoolId || '', surfaceType: field.surfaceType, facilities: field.facilities, status: field.status } : 
        { name: "", schoolId: '', surfaceType: "", facilities: "", status: "Available" },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && field) {
        form.reset({ name: field.name, schoolId: field.schoolId || '', surfaceType: field.surfaceType, facilities: field.facilities, status: field.status });
      } else {
        form.reset({ name: "", schoolId: '', surfaceType: "", facilities: "", status: "Available" });
      }
    }
  }, [field, mode, open, form]);

  function onSubmit(data: FieldFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && field) {
          await updateFieldAction({ fieldId: field.fieldId, ...data });
          toast({ title: "Field Updated", description: `${data.name} has been updated.` });
        } else {
          await addFieldAction(data);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit Field' : 'Add New Field'}</DialogTitle><DialogDescription>Enter the details for the field or venue.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Field Name</FormLabel><FormControl><Input placeholder="e.g. Main Oval" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="schoolId" render={({ field }) => (<FormItem><FormLabel>Owning School (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a school (if applicable)" /></SelectTrigger></FormControl><SelectContent><SelectItem value="">-- None (Independent Field) --</SelectItem>{schools.map((s) => (<SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="Available" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{FIELD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="surfaceType" render={({ field }) => (<FormItem><FormLabel>Surface Type (Optional)</FormLabel><FormControl><Input placeholder="e.g. Grass, Turf" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="facilities" render={({ field }) => (<FormItem><FormLabel>Facilities (Optional)</FormLabel><FormControl><Textarea placeholder="e.g. Pavilion, Toilets, Nets" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Field"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ field, groundskeepers, open, onOpenChange }: { field: Field, groundskeepers: Person[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null);

  const availableKeepers = groundskeepers.filter(gk => !field.assignments?.some(a => a.personId === gk.personId));

  const handleAssign = () => {
    if (!selectedPersonId) return;
    startTransition(async () => {
      try {
        await assignGroundskeeperToFieldAction(field.fieldId, selectedPersonId);
        toast({ title: "Grounds-Keeper Assigned", description: "The person has been assigned to this field." });
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not assign person.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Assign Grounds-Keeper</DialogTitle><DialogDescription>Assign a grounds-keeper to manage {field.name}.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <Select onValueChange={setSelectedPersonId} disabled={isPending}>
            <SelectTrigger><SelectValue placeholder="Select a grounds-keeper" /></SelectTrigger>
            <SelectContent>
              {availableKeepers.length > 0 ? (
                availableKeepers.map(gk => <SelectItem key={gk.personId} value={gk.personId}>{gk.firstName} {gk.lastName}</SelectItem>)
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No available grounds-keepers found.</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isPending || !selectedPersonId}>
            {isPending ? "Assigning..." : "Assign to Field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FieldsClient({ fields, groundskeepers, schools }: { fields: Field[], groundskeepers: Person[], schools: School[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedField, setSelectedField] = React.useState<Field | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isFieldDialogOpen, setIsFieldDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);

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

  const handleRemoveAssignment = (fieldId: string, assignmentId: string) => {
    startTransition(async () => {
      try {
        await removeGroundskeeperFromFieldAction(fieldId, assignmentId);
        toast({ title: "Assignment Removed", description: "The grounds-keeper has been unassigned." });
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove assignment.", variant: "destructive" });
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Fields & Venues</h1><p className="text-muted-foreground">Manage your sporting fields and venues.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedField(null); setIsFieldDialogOpen(true); }}><PlusCircle className="mr-2"/>Add Field</Button>
        </header>

        {fields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <Card key={field.fieldId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{field.name}</CardTitle>
                      <CardDescription>
                        {field.schoolName ? (
                          <span className="flex items-center gap-1.5"><Building className="h-4 w-4"/>{field.schoolName}</span>
                        ) : (
                          <span className="text-primary">Independent Venue</span>
                        )}
                      </CardDescription>
                    </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => { setSelectedField(field); setDialogMode('edit'); setIsFieldDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSelectedField(field); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Field</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Badge variant={field.status === 'Available' ? 'secondary' : (field.status === 'Maintenance' ? 'outline' : 'destructive')}>{field.status}</Badge>
                  </div>
                   {field.facilities && (
                    <div>
                      <Label className="text-xs">Facilities</Label>
                      <p className="text-sm text-muted-foreground">{field.facilities}</p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-sm font-semibold">Assigned Grounds-Keepers</h4>
                       <Button variant="outline" size="sm" onClick={() => { setSelectedField(field); setIsAssignDialogOpen(true); }}><UserPlus className="mr-2"/>Assign</Button>
                    </div>
                    <div className="space-y-2">
                        {field.assignments && field.assignments.length > 0 ? (
                            field.assignments.map(assignment => (
                                <div key={assignment.assignmentId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8"><AvatarImage src={undefined} /><AvatarFallback>{assignment.personName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                        <span className="text-sm">{assignment.personName}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveAssignment(field.fieldId, assignment.assignmentId)} disabled={isPending}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">No one assigned.</p>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No fields found. Get started by adding a field.</p>
          </Card>
        )}
      </div>

      {isFieldDialogOpen && <FieldDialog mode={dialogMode} field={selectedField ?? undefined} schools={schools} open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen} />}
      {isAssignDialogOpen && selectedField && <AssignDialog field={selectedField} groundskeepers={groundkeepers} open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen} />}
      
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
