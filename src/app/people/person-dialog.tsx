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
import type { Person, School } from "@/lib/data";
import { addPlayerAction, updatePlayerAction } from '@/lib/actions/players';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_GROUPS } from "@/lib/roles";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const personSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  profileImageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  assignedSchoolId: z.string().optional(),
  activeRole: z.string().optional(),
}).refine(data => {
    if (data.roles && data.roles.length > 0 && !data.activeRole) {
        return false;
    }
    if (data.activeRole && !data.roles.includes(data.activeRole)) {
        return false;
    }
    return true;
}, {
    message: "An active role must be selected from the assigned roles.",
    path: ["activeRole"],
});

type PersonFormValues = z.infer<typeof personSchema>;

export function PersonDialog({ mode, person, currentUser, open, onOpenChange, schools }: { mode: 'add' | 'edit', person?: Person, currentUser: Person | null, open: boolean, onOpenChange: (open: boolean) => void, schools: School[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: mode === 'edit' && person ? {
      ...person,
      phone: person.phone ?? '',
      profileImageUrl: person.profileImageUrl ?? '',
      assignedSchoolId: person.assignedSchools?.[0] || '',
    } : {
      firstName: "", lastName: "", email: "", phone: "", profileImageUrl: "", roles: ["Player"], activeRole: "Player", assignedSchoolId: "",
    },
  });
  
  const selectedRoles = form.watch('roles');

  const canAssignRoles = currentUser?.roles.includes('Admin') || currentUser?.roles.includes('Sportsmaster') || currentUser?.roles.includes('School Admin');

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && person) {
        form.reset({
          ...person,
          phone: person.phone ?? '',
          profileImageUrl: person.profileImageUrl ?? '',
          assignedSchoolId: person.assignedSchools?.[0] || '',
        });
      } else {
        form.reset({
          firstName: "", lastName: "", email: "", phone: "", profileImageUrl: "", roles: ["Player"], activeRole: "Player", assignedSchoolId: "",
        });
      }
    }
  }, [person, mode, open, form]);

  function onSubmit(data: PersonFormValues) {
    startTransition(async () => {
      try {
        const payload = { ...data, activeRole: data.activeRole || data.roles[0] };
        if (mode === 'edit' && person) {
          await updatePlayerAction({ personId: person.personId, ...payload });
          toast({ title: "Person Updated", description: `${data.firstName} ${data.lastName} has been updated.` });
        } else {
          await addPlayerAction(payload);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Separator />
            <FormField control={form.control} name="roles" render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Roles</FormLabel>
                  <FormDescription>Assign at least one role. Selecting certain roles will reveal further assignment options.</FormDescription>
                </div>
                {!canAssignRoles && <p className="text-sm text-destructive">You do not have permission to assign roles.</p>}
                <div className="space-y-4">
                  {ROLE_GROUPS.map((group) => (
                    <div key={group.group}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">{group.group}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-4 rounded-md">
                        {group.roles.map((item) => (
                          <FormField key={item.id} control={form.control} name="roles" render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                 const newRoles = checked ? [...field.value, item.id] : field.value?.filter((v) => v !== item.id);
                                 field.onChange(newRoles);
                                 if (newRoles && !newRoles.includes(form.getValues('activeRole'))) {
                                     form.setValue('activeRole', newRoles[0]);
                                 }
                              }} disabled={isPending || !canAssignRoles} /></FormControl>
                              <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

             <FormField
              control={form.control}
              name="assignedSchoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Assignment</FormLabel>
                  <FormDescription>
                    Assign this person to a primary school. This is required for most staff and player roles.
                  </FormDescription>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">-- None --</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school.schoolId} value={school.schoolId}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="activeRole"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Active Role</FormLabel>
                        <FormDescription>The primary role this user will have when they log in.</FormDescription>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isPending || !selectedRoles || selectedRoles.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an active role"/></SelectTrigger></FormControl>
                            <SelectContent>{selectedRoles?.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage/>
                    </FormItem>
                )}
            />
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
