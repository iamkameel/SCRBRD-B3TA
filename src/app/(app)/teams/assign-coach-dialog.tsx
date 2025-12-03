
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Person, Team } from "@/lib/data";
import { addPlayerToRosterAction } from '@/lib/actions/teams';

const assignCoachSchema = z.object({
  personId: z.string({ required_error: "Please select a coach." }),
});

type AssignCoachFormValues = z.infer<typeof assignCoachSchema>;

export function AssignCoachDialog({
  team,
  coaches,
  open,
  onOpenChange,
}: {
  team: Team;
  coaches: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignCoachFormValues>({
    resolver: zodResolver(assignCoachSchema),
  });

  function onSubmit(data: AssignCoachFormValues) {
    startTransition(async () => {
      try {
        await addPlayerToRosterAction(team.teamId, {
          personId: data.personId,
          role: 'Coach',
          status: 'active',
          isCaptain: false,
          isViceCaptain: false,
        });
        toast({
          title: "Coach Assigned",
          description: `A coach has been assigned to ${team.name}.`,
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error Assigning Coach",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }
  
  React.useEffect(() => {
    if(open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Coach to {team.name}</DialogTitle>
          <DialogDescription>
            Select a person with the 'Coach' role to assign to this team.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coach" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.personId} value={coach.personId}>
                          {coach.firstName} {coach.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Assigning..." : "Assign Coach"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
