

'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle, FullTransportAssignment, Person } from "@/lib/data";
import { deleteVehicleAction } from '@/lib/actions/transport';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VehicleDialog } from "./vehicle-dialog";

export default function TransportClient({ vehicles, assignments, drivers, isAdmin }: { vehicles: Vehicle[], assignments: FullTransportAssignment[], drivers: Person[], isAdmin: boolean }) {
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
      } catch (error) {
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
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="fleet">Vehicle Fleet</TabsTrigger>
                    <TabsTrigger value="drivers">Drivers</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>
                {isAdmin && <Button onClick={() => { setDialogMode('add'); setSelectedVehicle(null); setIsVehicleDialogOpen(true); }}><PlusCircle className="mr-2" />Add Vehicle</Button>}
            </div>
            <TabsContent value="fleet">
                <Card>
                <CardHeader><CardTitle>Vehicle Fleet</CardTitle><CardDescription>A list of all vehicles in the system.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Capacity</TableHead><TableHead>Registration</TableHead>{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                    <TableBody>
                        {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                            <TableRow key={vehicle.vehicleId}>
                            <TableCell className="font-medium">{vehicle.name}</TableCell>
                            <TableCell>{vehicle.type}</TableCell>
                            <TableCell>{vehicle.capacity}</TableCell>
                            <TableCell>{vehicle.registration}</TableCell>
                            {isAdmin && <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setSelectedVehicle(vehicle); setDialogMode('edit'); setIsVehicleDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setSelectedVehicle(vehicle); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>}
                            </TableRow>
                        ))
                        ) : (
                        <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">No vehicles found. Get started by adding a vehicle.</TableCell></TableRow>
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

      {isAdmin && <VehicleDialog mode={dialogMode} vehicle={selectedVehicle ?? undefined} open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen} />}

      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedVehicle?.name}</strong>. Any match assignments for this vehicle will also be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVehicle(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Vehicle"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
