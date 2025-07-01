
'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Drill } from '@/lib/data';
import { addDrillAction } from '@/lib/actions/drills';
import { Badge } from '@/components/ui/badge';

const drillSchema = z.object({
    name: z.string().min(1, { message: "Drill name is required." }),
    description: z.string().min(1, { message: "Description is required." }),
    category: z.enum(['Batting', 'Bowling', 'Fielding', 'Fitness', 'Tactical'], { required_error: "Category is required." }),
    duration: z.coerce.number().int().min(1, { message: "Duration must be at least 1 minute." }),
});
type DrillFormValues = z.infer<typeof drillSchema>;
const DRILL_CATEGORIES = ['Batting', 'Bowling', 'Fielding', 'Fitness', 'Tactical'] as const;

function AddDrillDialog() {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<DrillFormValues>({
    resolver: zodResolver(drillSchema),
    defaultValues: { name: "", description: "", category: "Fielding", duration: 15 },
  });

  const onSubmit = (data: DrillFormValues) => {
    startTransition(async () => {
      try {
        await addDrillAction(data);
        toast({ title: "Drill Created", description: "The new drill has been added to the library." });
        setOpen(false);
        form.reset();
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not create drill.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />Add Drill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Drill</DialogTitle>
          <DialogDescription>Create a new reusable drill for your session plans.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Drill Name</FormLabel><FormControl><Input placeholder="e.g., Slip Catching" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the drill, its purpose, and instructions." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{DRILL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duration (mins)</FormLabel><FormControl><Input type="number" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Drill"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DrillsClient({ initialDrills, canManage }: { initialDrills: Drill[], canManage: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Drill Library</h1>
          <p className="text-muted-foreground">Manage your collection of training drills.</p>
        </div>
        {canManage && <AddDrillDialog />}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Drills</CardTitle>
          <CardDescription>A list of all available drills for your training sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-[50%]">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialDrills.length > 0 ? (
                initialDrills.map((drill) => (
                  <TableRow key={drill.drillId}>
                    <TableCell className="font-medium">{drill.name}</TableCell>
                    <TableCell><Badge variant="outline">{drill.category}</Badge></TableCell>
                    <TableCell>{drill.duration} mins</TableCell>
                    <TableCell className="text-muted-foreground">{drill.description}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No drills found. Get started by adding one.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
