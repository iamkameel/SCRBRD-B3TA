
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Person } from "@/lib/data";
import { addPlayerAction, updatePlayerAction } from '@/lib/actions/players';

const personSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  profileImageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
});

type PersonFormValues = z.infer<typeof personSchema>;

const ROLES = [
  { id: "Player", label: "Player" }, { id: "Coach", label: "Coach" },
  { id: "Assistant Coach", label: "Assistant Coach" }, { id: "Team Manager", label: "Team Manager" },
  { id: "Trainer", label: "Trainer" }, { id: "Physio", label: "Physio" },
  { id: "Doctor", label: "Doctor" }, { id: "First Aid", label: "First Aid" },
  { id: "Umpire", label: "Umpire" }, { id: "Scorer", label: "Scorer" },
  { id: "Guardian", label: "Guardian" }, { id: "Sportmaster", label: "Sportmaster" },
  { id: "Grounds-Keeper", label: "Grounds-Keeper" }, { id: "Driver", label: "Driver" },
] as const;


export function PersonDialog({ mode, person, open, onOpenChange }: { mode: 'add' | 'edit', person?: Person, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: mode === 'edit' && person ? {
      firstName: person.firstName, lastName: person.lastName, email: person.email, phone: person.phone, profileImageUrl: person.profileImageUrl, roles: person.roles,
    } : {
      firstName: "", lastName: "", email: "", phone: "", profileImageUrl: "", roles: ["Player"],
    },
  });
  
  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && person) {
        form.reset({
          firstName: person.firstName, lastName: person.lastName, email: person.email, phone: person.phone, profileImageUrl: person.profileImageUrl ?? '', roles: person.roles,
        });
      } else {
        form.reset({
          firstName: "", lastName: "", email: "", phone: "", profileImageUrl: "", roles: ["Player"],
        });
      }
    }
  }, [person, mode, open, form]);

  function onSubmit(data: PersonFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && person) {
          await updatePlayerAction({ personId: person.personId, ...data });
          toast({ title: "Person Updated", description: `${data.firstName} ${data.lastName} has been updated.` });
        } else {
          await addPlayerAction(data);
          toast({ title: "Person Added", description: `${data.firstName} ${data.lastName} has been added.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} person.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Person' : 'Add New Person'}</DialogTitle>
          <DialogDescription>Enter the details for the person. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="+1 234 567 890" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
            <FormField
              control={form.control}
              name="profileImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL (Optional)</FormLabel>
                   <FormDescription>
                    Provide a URL or leave blank. You can generate an AI portrait later on the person's profile page.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="https://..." {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="roles" render={() => (
              <FormItem>
                <div className="mb-4"><FormLabel>Roles</FormLabel><FormDescription>Assign at least one role to this person.</FormDescription></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLES.map((item) => (
                    <FormField key={item.id} control={form.control} name="roles" render={({ field }) => (
                      <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => (checked ? field.onChange([...field.value, item.id]) : field.onChange(field.value?.filter((v) => v !== item.id)))} disabled={isPending} /></FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Person"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
