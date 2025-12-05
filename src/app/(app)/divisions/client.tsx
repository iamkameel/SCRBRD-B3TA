
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";

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
import type { Division } from "@/lib/data";
import { addDivisionAction, updateDivisionAction, deleteDivisionAction } from '@/lib/actions/divisions';

const divisionSchema = z.object({
  name: z.string().min(1, { message: "Division name is required." }),
});

type DivisionFormValues = z.infer<typeof divisionSchema>;

function AddDivisionDialog() {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(data: DivisionFormValues) {
    startTransition(async () => {
      try {
        await addDivisionAction(data);
        toast({
          title: "Division Added",
          description: `${data.name} has been successfully created.`,
        });
        setOpen(false);
        form.reset();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not add division.",
          variant: "destructive",
        })
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Division
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Division</DialogTitle>
          <DialogDescription>Enter the details for the new division.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. U19 Varsity" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Division"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditDivisionDialog({ division, open, onOpenChange }: { division: Division; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: { name: division.name },
  });
  
  React.useEffect(() => {
      form.reset({ name: division.name });
  }, [division, form]);

  function onSubmit(data: DivisionFormValues) {
    startTransition(async () => {
      try {
        await updateDivisionAction({ divisionId: division.divisionId, ...data });
        toast({
          title: "Division Updated",
          description: `${data.name} has been successfully updated.`,
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not update division.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Division</DialogTitle>
          <DialogDescription>Update the division name. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. U19 Varsity" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DivisionsClient({ divisions, isAdmin }: { divisions: Division[], isAdmin: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedDivision, setSelectedDivision] = React.useState<Division | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedDivision) return;
    startTransition(async () => {
      try {
        await deleteDivisionAction(selectedDivision.divisionId);
        toast({
          title: "Division Deleted",
          description: `${selectedDivision.name} has been deleted.`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedDivision(null);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not delete division.",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setSelectedDivision(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Divisions</h1>
            <p className="text-muted-foreground">Manage your competition divisions.</p>
          </div>
          {isAdmin && <AddDivisionDialog />}
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Division List</CardTitle>
            <CardDescription>A list of all divisions in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {divisions.length > 0 ? (
                  divisions.map((division) => (
                    <TableRow key={division.divisionId}>
                      <TableCell className="font-medium">{division.name}</TableCell>
                      {isAdmin && <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => {
                                setSelectedDivision(division);
                                setIsEditDialogOpen(true);
                              }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                                setSelectedDivision(division);
                                setIsDeleteDialogOpen(true);
                              }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 2 : 1} className="h-24 text-center">No divisions found. Get started by adding a division.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {isAdmin && selectedDivision && (
        <EditDivisionDialog
          division={selectedDivision}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setSelectedDivision(null);
          }}
        />
      )}

      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{selectedDivision?.name}</strong>.
              Any teams in this division will need to be updated manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDivision(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Division"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
