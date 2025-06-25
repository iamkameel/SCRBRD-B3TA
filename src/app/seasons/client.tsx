'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { PlusCircle, MoreHorizontal, CalendarIcon, Edit, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import type { Season } from "@/lib/data";
import { addSeasonAction, updateSeasonAction, deleteSeasonAction } from '@/lib/actions/seasons';

const seasonSchema = z.object({
  name: z.string().min(1, { message: "Season name is required." }),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  active: z.boolean().default(false),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

type SeasonFormValues = z.infer<typeof seasonSchema>;

function SeasonDialog({ mode, season, open, onOpenChange }: { mode: 'add' | 'edit', season?: Season, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: mode === 'edit' && season ? {
      name: season.name, startDate: season.startDate, endDate: season.endDate, active: season.active
    } : {
      name: "", active: false,
    },
  });

  React.useEffect(() => {
    if (mode === 'edit' && season) {
      form.reset({ name: season.name, startDate: season.startDate, endDate: season.endDate, active: season.active });
    } else {
      form.reset({ name: "", active: false, startDate: undefined, endDate: undefined });
    }
  }, [season, mode, open, form]);

  function onSubmit(data: SeasonFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && season) {
          await updateSeasonAction({ seasonId: season.seasonId, ...data });
          toast({ title: "Season Updated", description: `${data.name} has been updated.` });
        } else {
          await addSeasonAction(data);
          toast({ title: "Season Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} season.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Season' : 'Add New Season'}</DialogTitle>
          <DialogDescription>Enter the details for the season.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Season Name</FormLabel><FormControl><Input placeholder="e.g. 2025-2026" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="active" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Active Season</FormLabel><FormMessage /></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl></FormItem>)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Season"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SeasonsClient({ seasons }: { seasons: Season[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedSeason, setSelectedSeason] = React.useState<Season | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isSeasonDialogOpen, setIsSeasonDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const handleDelete = () => {
    if (!selectedSeason) return;
    startTransition(async () => {
      try {
        await deleteSeasonAction(selectedSeason.seasonId);
        toast({ title: "Season Deleted", description: `${selectedSeason.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedSeason(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete season.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedSeason(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Seasons</h1><p className="text-muted-foreground">Manage your competition seasons.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedSeason(null); setIsSeasonDialogOpen(true); }}><PlusCircle className="mr-2" />Add Season</Button>
        </header>
        <Card>
          <CardHeader><CardTitle>Season List</CardTitle><CardDescription>A list of all seasons in the system.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {seasons.length > 0 ? (
                  seasons.map((season) => (
                    <TableRow key={season.seasonId}>
                      <TableCell className="font-medium">{season.name}</TableCell>
                      <TableCell>{format(season.startDate, "PPP")}</TableCell>
                      <TableCell>{format(season.endDate, "PPP")}</TableCell>
                      <TableCell><Badge variant={season.active ? "default" : "secondary"}>{season.active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedSeason(season); setDialogMode('edit'); setIsSeasonDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedSeason(season); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No seasons found. Get started by adding a season.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SeasonDialog mode={dialogMode} season={selectedSeason ?? undefined} open={isSeasonDialogOpen} onOpenChange={setIsSeasonDialogOpen} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedSeason?.name}</strong>.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSeason(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Season"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
