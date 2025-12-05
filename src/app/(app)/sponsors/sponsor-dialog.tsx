
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Sponsor } from "@/lib/data";
import { addSponsorAction, updateSponsorAction } from '@/lib/actions/sponsors';

const sponsorSchema = z.object({
  name: z.string().min(1, { message: "Sponsor name is required." }),
  logoUrl: z.string().url({ message: "A valid logo URL is required." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type SponsorFormValues = z.infer<typeof sponsorSchema>;

export function SponsorDialog({ mode, sponsor, open, onOpenChange }: { mode: 'add' | 'edit', sponsor?: Sponsor, open: boolean, onOpenChange: (open: boolean) => void }) {
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
            <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://..." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
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
