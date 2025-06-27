
'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, User } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle, FullTransportAssignment, Person } from "@/lib/data";
import { addVehicleAction, updateVehicleAction, deleteVehicleAction } from '@/lib/actions/transport';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const vehicleSchema = z.object({
  name: z.string().min(1, { message: "Vehicle name is required." }),
  type: z.enum(['Bus', 'Minibus', 'Van', 'Car'], { required_error: "Please select a type."}),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  registration: z.string().min(1, { message: "Registration is required." }),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;
const VEHICLE_TYPES = ['Bus', 'Minibus', 'Van', 'Car'] as const;

function VehicleDialog({ mode, vehicle, open, onOpenChange }: { mode: 'add' | 'edit', vehicle?: Vehicle, open: boolean, onOpenChange: (open: boolean) => void }) {
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

export default function TransportClient({ vehicles, assignments, drivers }: { vehicles: Vehicle[], assignments: FullTransportAssignment[], drivers: Person[] }) {
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = () => {
    if (!selectedVehicle) return;
    startTransition(async () => {
      try {
        await deleteVehicleAction(selectedVehicle.vehicleId);
        toast({ title: "Vehicle Deleted", description: `${selectedVehicle.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedVehicle(null);
      } catch (error) => {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete vehicle.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedVehicle(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transport</h1>
          <p className="text-muted-foreground">Manage your fleet of vehicles, drivers, and view assignments.</p>
        </header>
        
        <Tabs defaultValue="fleet">
            <div className="flex items-center justify-between mb-4">
                <TabsList>
                    <TabsTrigger value="fleet">Vehicle Fleet</TabsTrigger>
                    <TabsTrigger value="drivers">Drivers</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>
                <Button onClick={() => { setDialogMode('add'); setSelectedVehicle(null); setIsVehicleDialogOpen(true); }}><PlusCircle className="mr-2" />Add Vehicle</Button>
            </div>
            <TabsContent value="fleet">
                <Card>
                <CardHeader><CardTitle>Vehicle Fleet</CardTitle><CardDescription>A list of all vehicles in the system.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Capacity</TableHead><TableHead>Registration</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                            <TableRow key={vehicle.vehicleId}>
                            <TableCell className="font-medium">{vehicle.name}</TableCell>
                            <TableCell>{vehicle.type}</TableCell>
                            <TableCell>{vehicle.capacity}</TableCell>
                            <TableCell>{vehicle.registration}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setSelectedVehicle(vehicle); setDialogMode('edit'); setIsVehicleDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setSelectedVehicle(vehicle); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No vehicles found. Get started by adding a vehicle.</TableCell></TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="drivers">
                <Card>
                    <CardHeader>
                        <CardTitle>Driver Roster</CardTitle>
                        <CardDescription>A list of all personnel with the "Driver" role.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drivers.length > 0 ? (
                                    drivers.map((driver) => (
                                        <TableRow key={driver.personId}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={driver.profileImageUrl} alt={`${driver.firstName} ${driver.lastName}`} />
                                                    <AvatarFallback>{driver.firstName?.[0]}{driver.lastName?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span>{driver.firstName} {driver.lastName}</span>
                                            </TableCell>
                                            <TableCell>{driver.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/people/${driver.personId}`}>
                                                        <User className="mr-2 h-4 w-4" />
                                                        View Profile
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={3} className="h-24 text-center">No drivers found. Assign the 'Driver' role to people on the People page.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="assignments">
                <Card>
                    <CardHeader>
                        <CardTitle>All Assignments</CardTitle>
                        <CardDescription>A list of all vehicles assigned to upcoming and past matches.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead>Driver</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {assignments.length > 0 ? (
                                    assignments.map((assignment) => (
                                        <TableRow key={assignment.assignmentId}>
                                            <TableCell className="font-medium"><Link href={`/matches/${assignment.matchId}`} className="hover:underline">{assignment.matchName}</Link></TableCell>
                                            <TableCell>{isClient ? format(assignment.dateTime, "PPP p") : ' '}</TableCell>
                                            <TableCell>{assignment.vehicleName}</TableCell>
                                            <TableCell>{assignment.driverName}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No transport assignments found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

      <VehicleDialog mode={dialogMode} vehicle={selectedVehicle ?? undefined} open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedVehicle?.name}</strong>. Any match assignments for this vehicle will also be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVehicle(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Vehicle"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
