'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Person, School } from "@/lib/data";
import { assignPersonToSchoolsAction } from "@/lib/actions/players";

const assignSchoolSchema = z.object({
  schoolIds: z.array(z.string()).optional(),
});
type AssignSchoolFormValues = z.infer<typeof assignSchoolSchema>;

export function AssignSchoolDialog({ person, schools, open, onOpenChange }: { person: Person; schools: School[]; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignSchoolFormValues>({
    resolver: zodResolver(assignSchoolSchema),
    defaultValues: {
      schoolIds: person?.assignedSchools || [],
    },
  });

  React.useEffect(() => {
    if (person) {
      form.reset({
        schoolIds: person.assignedSchools || [],
      });
    }
  }, [person, form]);

  function onSubmit(data: AssignSchoolFormValues) {
    startTransition(async () => {
      try {
        await assignPersonToSchoolsAction(person.personId, data.schoolIds || []);
        toast({ title: "Assignments Updated", description: `${person.firstName}'s school assignments have been saved.` });
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update assignments.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Schools to {person.firstName}</DialogTitle>
          <DialogDescription>Select the schools this person is associated with or manages.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="schoolIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-64 rounded-md border p-4">
                    {schools.map((school) => (
                      <FormField
                        key={school.schoolId}
                        control={form.control}
                        name="schoolIds"
                        render={({ field }) => (
                          <FormItem key={school.schoolId} className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(school.schoolId)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), school.schoolId])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== school.schoolId
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{school.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    {schools.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground">No schools available to assign.</p>
                    )}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Assignments"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
