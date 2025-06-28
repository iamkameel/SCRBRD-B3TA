
'use client';

import * as React from "react";
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Link as LinkIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Sponsor } from "@/lib/data";
import { addSponsorAction, updateSponsorAction, deleteSponsorAction } from '@/lib/actions/sponsors';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const sponsorSchema = z.object({
  name: z.string().min(1, { message: "Sponsor name is required." }),
  logoUrl: z.string().url({ message: "A valid logo URL is required." }).or(z.literal('')),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type SponsorFormValues = z.infer<typeof sponsorSchema>;

function SponsorDialog({ mode, sponsor, open, onOpenChange }: { mode: 'add' | 'edit', sponsor?: Sponsor, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: mode === 'edit' && sponsor ? 
        { name: sponsor.name, logoUrl: sponsor.logoUrl, website: sponsor.website } : 
        { name: "", logoUrl: "", website: "" },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && sponsor) {
        form.reset({ name: sponsor.name, logoUrl: sponsor.logoUrl, website: sponsor.website });
      } else {
        form.reset({ name: "", logoUrl: "", website: "" });
      }
    }
  }, [sponsor, mode, open, form]);

  function onSubmit(data: SponsorFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && sponsor) {
          await updateSponsorAction({ sponsorId: sponsor.sponsorId, ...data });
          toast({ title: "Sponsor Updated", description: `${data.name} has been updated.` });
        } else {
          await addSponsorAction(data);
          toast({ title: "Sponsor Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} sponsor.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Sponsor' : 'Add New Sponsor'}</DialogTitle>
          <DialogDescription>Enter the details for the sponsor.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Sponsor Name</FormLabel><FormControl><Input placeholder="e.g. Awesome Inc." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://example.com/logo.png" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Sponsor"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function SponsorsClient({ sponsors }: { sponsors: Sponsor[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  
  const [selectedSponsor, setSelectedSponsor] = React.useState<Sponsor | null>(null);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedSponsor) return;
    startTransition(async () => {
      try {
        await deleteSponsorAction(selectedSponsor.sponsorId);
        toast({ title: "Sponsor Deleted", description: `${selectedSponsor.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedSponsor(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete sponsor.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedSponsor(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Sponsors</h1>
            <p className="text-muted-foreground">Manage your league and team sponsors.</p>
          </div>
          <Button onClick={() => { setDialogMode('add'); setSelectedSponsor(null); setIsSponsorDialogOpen(true); }}>
              <PlusCircle className="mr-2" />Add Sponsor
          </Button>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Sponsor List</CardTitle>
            <CardDescription>A list of all sponsors in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.length > 0 ? (
                  sponsors.map((sponsor) => (
                    <TableRow key={sponsor.sponsorId}>
                      <TableCell>
                          <Avatar>
                              <AvatarImage src={sponsor.logoUrl} alt={sponsor.name} className="object-contain" />
                              <AvatarFallback>{sponsor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{sponsor.name}</TableCell>
                      <TableCell>
                        {sponsor.website ? (
                            <Link href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                Visit
                            </Link>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedSponsor(sponsor); setDialogMode('edit'); setIsSponsorDialogOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedSponsor(sponsor); setIsDeleteDialogOpen(true); }} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No sponsors found. Get started by adding a sponsor.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SponsorDialog
        mode={dialogMode}
        sponsor={selectedSponsor ?? undefined}
        open={isSponsorDialogOpen}
        onOpenChange={setIsSponsorDialogOpen}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{selectedSponsor?.name}</strong>. Any active sponsorships will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSponsor(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Sponsor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
