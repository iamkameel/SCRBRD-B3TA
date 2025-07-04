
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle } from "@/lib/data";
import { addVehicleAction, updateVehicleAction } from '@/lib/actions/transport';

const vehicleSchema = z.object({
  name: z.string().min(1, { message: "Vehicle name is required." }),
  type: z.enum(['Bus', 'Minibus', 'Van', 'Car'], { required_error: "Please select a type."}),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  registration: z.string().min(1, { message: "Registration is required." }),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;
const VEHICLE_TYPES = ['Bus', 'Minibus', 'Van', 'Car'] as const;

export function VehicleDialog({ mode, vehicle, open, onOpenChange }: { mode: 'add' | 'edit', vehicle?: Vehicle, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: mode === 'edit' && vehicle ? { ...vehicle } : { name: "", type: "Car", capacity: 4, registration: "" },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && vehicle) {
        form.reset({ ...vehicle });
      } else {
        form.reset({ name: "", type: "Car", capacity: 4, registration: "" });
      }
    }
  }, [vehicle, mode, open, form]);

  function onSubmit(data: VehicleFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && vehicle) {
          await updateVehicleAction({ vehicleId: vehicle.vehicleId, ...data });
          toast({ title: "Vehicle Updated", description: `${data.name} has been updated.` });
        } else {
          await addVehicleAction(data);
          toast({ title: "Vehicle Added", description: `${data.name} has been added.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} vehicle.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>Enter the details for the vehicle. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Vehicle Name</FormLabel><FormControl><Input placeholder="e.g. Minibus 1" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent>{VEHICLE_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="capacity" render={({ field }) => (<FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="registration" render={({ field }) => (<FormItem><FormLabel>Registration</FormLabel><FormControl><Input placeholder="ABC 123" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Vehicle"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
