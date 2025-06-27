'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Person } from "@/lib/data";
import { addPersonLinkAction } from "@/lib/actions/players";

const linkSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  relationship: z.enum(["guardian", "child"], { required_error: "Please select a relationship." }),
});

type LinkSchemaValues = z.infer<typeof linkSchema>;

export function AddLinkDialog({ currentPersonId, availablePeople }: { currentPersonId: string, availablePeople: Person[] }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<LinkSchemaValues>({
    resolver: zodResolver(linkSchema),
  });

  function onSubmit(data: LinkSchemaValues) {
    startTransition(async () => {
      try {
        await addPersonLinkAction(currentPersonId, data.personId, data.relationship);
        toast({ title: "Link Created", description: "The link has been successfully created." });
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (error) {
        toast({ title: "Error Creating Link", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={isPending}><PlusCircle className="mr-2 h-4 w-4" />Add Link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Link Person</DialogTitle><DialogDescription>Create a guardian or child link.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="personId" render={({ field }) => (<FormItem><FormLabel>Person to Link</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl><SelectContent>{availablePeople.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="relationship" render={({ field }) => (<FormItem><FormLabel>Relationship</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a relationship" /></SelectTrigger></FormControl><SelectContent><SelectItem value="guardian">Is a Guardian of...</SelectItem><SelectItem value="child">Is a Child of...</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Linking..." : "Create Link"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
