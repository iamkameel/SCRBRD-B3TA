"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// From schema: match_role_assignments
const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

// Mock Data
const mockFixture = {
  fixtureId: "fixture_1",
  teamA: "Greenwood Gators",
  teamB: "Oakdale Eagles",
  dateTime: new Date("2024-07-28T14:00:00"),
  status: "Scheduled",
  venue: "Greenwood High Main Oval",
};

// From schema: persons
const mockPeople = [
    { personId: "person_1", firstName: "John", lastName: "Doe", email: "john.doe@example.com", roles: ["Player"] },
    { personId: "person_2", firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", roles: ["Player", "Guardian"] },
    { personId: "person_3", firstName: "Peter", lastName: "Jones", email: "peter.jones@example.com", roles: ["Coach", "Umpire"] },
    { personId: "person_4", firstName: "Mary", lastName: "Williams", email: "mary.w@example.com", roles: ["Player", "Scorer"] },
    { personId: "person_5", firstName: "Sam", lastName: "Brown", email: "sam.b@example.com", roles: ["Umpire"] },
];

interface Official {
  assignmentId: string;
  personId: string;
  personName: string;
  role: string;
  confirmed: boolean;
}

const ROLES = ["Umpire", "Scorer"];

function AssignOfficialDialog({ onOfficialAssigned }: { onOfficialAssigned: (assignment: Official) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { role: "Umpire" },
  });

  function onSubmit(data: AssignmentFormValues) {
    const person = mockPeople.find(p => p.personId === data.personId);
    if (!person) return;

    const newAssignment: Official = {
      assignmentId: `assign_${Math.random().toString(36).substring(2, 9)}`,
      personId: data.personId,
      personName: `${person.firstName} ${person.lastName}`,
      role: data.role,
      confirmed: false,
    };
    onOfficialAssigned(newAssignment);
    toast({
      title: "Official Assigned",
      description: `${newAssignment.personName} has been assigned as ${newAssignment.role}.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Assign Official
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Official to Match</DialogTitle>
          <DialogDescription>Select a person and their role for this match.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {mockPeople.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="Umpire">
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Assign to Match</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const [officials, setOfficials] = React.useState<Official[]>([]);

  const handleOfficialAssigned = (assignment: Official) => {
    setOfficials(prev => [...prev, assignment]);
  };
  
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{mockFixture.teamA} vs {mockFixture.teamB}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
             <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(mockFixture.dateTime, "PPPP")}</span>
             <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {format(mockFixture.dateTime, "p")}</span>
             <span>{mockFixture.venue}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Badge variant="default">{mockFixture.status}</Badge>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Match Officials</CardTitle>
            <CardDescription>Manage the umpires and scorers assigned to this match.</CardDescription>
          </div>
          <AssignOfficialDialog onOfficialAssigned={handleOfficialAssigned} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officials.length > 0 ? (
                officials.map(official => (
                  <TableRow key={official.assignmentId}>
                    <TableCell className="font-medium">{official.personName}</TableCell>
                    <TableCell>{official.role}</TableCell>
                    <TableCell>
                      <Badge variant={official.confirmed ? 'secondary' : 'outline'}>
                        {official.confirmed ? 'Confirmed' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No officials assigned to this match yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
