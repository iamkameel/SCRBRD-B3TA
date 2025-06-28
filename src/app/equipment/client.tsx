
'use client';

import * as React from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Undo, Redo } from "lucide-react";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { EquipmentItem, FullEquipmentAssignment, Person } from "@/lib/data";
import { addEquipmentItemAction, updateEquipmentItemAction, deleteEquipmentItemAction, assignEquipmentAction, returnEquipmentAction } from '@/lib/actions/equipment';
import { Badge } from "@/components/ui/badge";

const itemSchema = z.object({
  name: z.string().min(1, { message: "Item name is required." }),
  type: z.enum(['Bat', 'Pads', 'Gloves', 'Helmet', 'Ball', 'Other'], { required_error: "Type is required."}),
  size: z.string().optional(),
  status: z.enum(['Available', 'Maintenance']).default('Available'),
});
type ItemFormValues = z.infer<typeof itemSchema>;
const ITEM_TYPES = ['Bat', 'Pads', 'Gloves', 'Helmet', 'Ball', 'Other'] as const;
const ITEM_STATUSES = ['Available', 'Maintenance'] as const;

function ItemDialog({ mode, item, open, onOpenChange }: { mode: 'add' | 'edit', item?: EquipmentItem, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: mode === 'edit' && item ? { ...item } : { name: "", type: "Other", status: "Available" },
  });

  React.useEffect(() => {
    if (open) form.reset(mode === 'edit' && item ? { ...item, status: item.status === 'Assigned' ? 'Available' : item.status } : { name: "", type: "Other", status: "Available" });
  }, [item, mode, open, form]);

  function onSubmit(data: ItemFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && item) {
          await updateEquipmentItemAction({ itemId: item.itemId, ...data });
          toast({ title: "Item Updated" });
        } else {
          await addEquipmentItemAction(data);
          toast({ title: "Item Added" });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} item.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit Equipment Item' : 'Add New Item'}</DialogTitle><DialogDescription>Enter the details for the equipment item.</DialogDescription></DialogHeader>
        <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Item Name</FormLabel><FormControl><Input placeholder="e.g. Kookaburra Bat" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Size (Optional)</FormLabel><FormControl><Input placeholder="e.g. SH, Adult" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Item"}</Button></DialogFooter>
        </form></Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ item, players, open, onOpenChange }: { item: EquipmentItem, players: Person[], open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [selectedPersonId, setSelectedPersonId] = React.useState<string|null>(null);

    const handleAssign = () => {
        if (!selectedPersonId) return;
        startTransition(async () => {
            try {
                await assignEquipmentAction(item.itemId, selectedPersonId);
                toast({ title: "Item Assigned", description: `${item.name} has been assigned.`});
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not assign item.", variant: "destructive" });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Assign {item.name}</DialogTitle><DialogDescription>Select a player to assign this item to.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
                <Select onValueChange={setSelectedPersonId} disabled={isPending}><SelectTrigger><SelectValue placeholder="Select a player"/></SelectTrigger>
                    <SelectContent>
                        {players.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button><Button onClick={handleAssign} disabled={isPending || !selectedPersonId}>{isPending ? "Assigning..." : "Assign Item"}</Button></DialogFooter>
        </DialogContent>
    );
}

export default function EquipmentClient({ inventory, assignments, players }: { inventory: EquipmentItem[], assignments: FullEquipmentAssignment[], players: Person[] }) {
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedItem, setSelectedItem] = React.useState<EquipmentItem | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isItemDialogOpen, setIsItemDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);

  React.useEffect(() => { setIsClient(true); }, []);

  const handleDelete = () => {
    if (!selectedItem) return;
    startTransition(async () => {
      try {
        await deleteEquipmentItemAction(selectedItem.itemId);
        toast({ title: "Item Deleted"});
        setIsDeleteDialogOpen(false); setSelectedItem(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete item.", variant: "destructive" });
        setIsDeleteDialogOpen(false); setSelectedItem(null);
      }
    });
  };

  const handleReturn = () => {
    if (!selectedItem?.currentAssignmentId) return;
    startTransition(async () => {
        try {
            await returnEquipmentAction(selectedItem.currentAssignmentId);
            toast({ title: "Item Returned", description: `${selectedItem.name} has been marked as available.`});
            setIsReturnDialogOpen(false); setSelectedItem(null);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not return item.", variant: "destructive" });
            setIsReturnDialogOpen(false); setSelectedItem(null);
        }
    });
  }
  
  const getStatusBadge = (status: EquipmentItem['status']) => {
      switch(status) {
          case 'Available': return <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">{status}</Badge>;
          case 'Assigned': return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{status}</Badge>;
          case 'Maintenance': return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">{status}</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
      }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Equipment</h1><p className="text-muted-foreground">Manage your team's equipment inventory and assignments.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedItem(null); setIsItemDialogOpen(true); }}><PlusCircle className="mr-2" />Add Item</Button>
        </header>
        
        <Tabs defaultValue="inventory">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="inventory">Inventory</TabsTrigger><TabsTrigger value="assignments">Assignments</TabsTrigger></TabsList>
            <TabsContent value="inventory" className="mt-4"><Card><CardHeader><CardTitle>Inventory List</CardTitle><CardDescription>A list of all equipment items.</CardDescription></CardHeader>
                <CardContent><Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Status</TableHead><TableHead>Assigned To</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>{inventory.length > 0 ? (inventory.map((item) => (
                        <TableRow key={item.itemId}>
                            <TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.size || '-'}</TableCell><TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{item.status === 'Assigned' ? item.currentHolderName : <span className="text-muted-foreground">-</span>}</TableCell>
                            <TableCell className="text-right"><DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {item.status === 'Available' && <DropdownMenuItem onSelect={() => { setSelectedItem(item); setIsAssignDialogOpen(true); }}><Redo className="mr-2" />Assign Item</DropdownMenuItem>}
                                    {item.status === 'Assigned' && <DropdownMenuItem onSelect={() => { setSelectedItem(item); setIsReturnDialogOpen(true); }}><Undo className="mr-2" />Return Item</DropdownMenuItem>}
                                    <DropdownMenuItem onSelect={() => { setSelectedItem(item); setDialogMode('edit'); setIsItemDialogOpen(true); }}><Edit className="mr-2" />Edit Details</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setSelectedItem(item); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2" />Delete Item</DropdownMenuItem>
                                </DropdownMenuContent></DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">No equipment found. Get started by adding an item.</TableCell></TableRow>)}
                    </TableBody>
                </Table></CardContent>
            </Card></TabsContent>
            <TabsContent value="assignments" className="mt-4"><Card><CardHeader><CardTitle>Assignment History</CardTitle><CardDescription>A record of all equipment check-outs and returns.</CardDescription></CardHeader>
                <CardContent><Table>
                    <TableHeader><TableRow><TableHead>Item Name</TableHead><TableHead>Type</TableHead><TableHead>Assigned To</TableHead><TableHead>Assigned Date</TableHead><TableHead>Returned Date</TableHead></TableRow></TableHeader>
                    <TableBody>{assignments.length > 0 ? (assignments.map((a) => (
                        <TableRow key={a.assignmentId}>
                            <TableCell className="font-medium">{a.itemName}</TableCell><TableCell>{a.itemType}</TableCell><TableCell>{a.personName}</TableCell><TableCell>{isClient ? format(a.assignedDate, "PPP") : ''}</TableCell><TableCell>{a.returnedDate ? (isClient ? format(a.returnedDate, "PPP") : '') : <span className="text-muted-foreground">Still Assigned</span>}</TableCell>
                        </TableRow>
                    ))) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">No assignment history found.</TableCell></TableRow>)}
                    </TableBody>
                </Table></CardContent>
            </Card></TabsContent>
        </Tabs>
      </div>

      <ItemDialog mode={dialogMode} item={selectedItem ?? undefined} open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen} />
      {selectedItem && <AssignDialog item={selectedItem} players={players} open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen} />}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete <strong>{selectedItem?.name}</strong> and all its assignment history. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Item"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Return</AlertDialogTitle><AlertDialogDescription>Are you sure you want to return <strong>{selectedItem?.name}</strong>? This will make it available for others to be assigned to.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleReturn} disabled={isPending}>{isPending ? "Returning..." : "Confirm Return"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}
