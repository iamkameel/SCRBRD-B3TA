'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Person, School } from "@/lib/data";
import { assignPersonToSchoolAction } from "@/lib/actions/players";

const assignSchoolSchema = z.object({
  schoolId: z.string().optional(),
});
type AssignSchoolFormValues = z.infer<typeof assignSchoolSchema>;

export function AssignSchoolDialog({ person, schools, open, onOpenChange }: { person: Person; schools: School[]; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignSchoolFormValues>({
    resolver: zodResolver(assignSchoolSchema),
    defaultValues: {
      schoolId: person?.assignedSchools?.[0] || undefined,
    },
  });

  React.useEffect(() => {
    if (person) {
      form.reset({
        schoolId: person.assignedSchools?.[0] || undefined,
      });
    }
  }, [person, form]);

  function onSubmit(data: AssignSchoolFormValues) {
    startTransition(async () => {
      try {
        await assignPersonToSchoolAction(person.personId, data.schoolId || null);
        toast({ title: "Assignment Updated", description: `${person.firstName}'s school assignment has been saved.` });
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update assignment.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign School to {person.firstName}</DialogTitle>
          <DialogDescription>Select the school this person is primarily associated with.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                    value={field.value ?? 'none'}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- None --</SelectItem>
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
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Assignment"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
