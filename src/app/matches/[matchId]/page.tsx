
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scorecard } from "./scorecard";

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
  status: "Completed",
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

const mockScorecard = {
    resultSummary: "Greenwood Gators won by 2 wickets",
    innings1: {
      teamName: "Oakdale Eagles",
      totalRuns: 152,
      wickets: 3,
      overs: 19.4,
      battingCard: [
        { name: "Sam Brown", status: "c. John Doe b. Peter Jones", runs: 45, balls: 30, fours: 5, sixes: 2, strikeRate: 150.00 },
        { name: "Alex Ray", status: "lbw b. Peter Jones", runs: 12, balls: 15, fours: 1, sixes: 0, strikeRate: 80.00 },
        { name: "Ben Stokes", status: "b. John Doe", runs: 28, balls: 22, fours: 3, sixes: 1, strikeRate: 127.27 },
        { name: "Chris Woakes", status: "not out", runs: 15, balls: 10, fours: 1, sixes: 1, strikeRate: 150.00 },
      ],
      bowlingCard: [
          { name: "Peter Jones", overs: 4, maidens: 0, runs: 25, wickets: 2, economy: 6.25 },
          { name: "John Doe", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.5 },
          { name: "Mary Williams", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
      ],
      fallOfWickets: [
          { wicket: 1, runs: 25, batsmanName: "Alex Ray", over: 4.1 },
          { wicket: 2, runs: 78, batsmanName: "Sam Brown", over: 9.3 },
          { wicket: 3, runs: 120, batsmanName: "Ben Stokes", over: 15.2 },
      ],
      extras: { total: 10, details: "(b 1, lb 2, w 5, nb 2)" }
    },
    innings2: {
      teamName: "Greenwood Gators",
      totalRuns: 153,
      wickets: 2,
      overs: 19.1,
      battingCard: [
          { name: "John Doe", status: "not out", runs: 68, balls: 45, fours: 7, sixes: 3, strikeRate: 151.11 },
          { name: "Mary Williams", status: "run out (Sam Brown)", runs: 22, balls: 20, fours: 2, sixes: 0, strikeRate: 110.00 },
          { name: "Peter Jones", status: "c. Alex Ray b. Sam Brown", runs: 35, balls: 25, fours: 4, sixes: 0, strikeRate: 140.00 },
      ],
      bowlingCard: [
          { name: "Sam Brown", overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
          { name: "Alex Ray", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.50 },
      ],
      fallOfWickets: [
          { wicket: 1, runs: 40, batsmanName: "Mary Williams", over: 5.5 },
          { wicket: 2, runs: 100, batsmanName: "Peter Jones", over: 12.1 },
      ],
      extras: { total: 8, details: "(lb 4, w 4)" }
    }
  };

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
            <Badge variant={mockFixture.status === 'Completed' ? 'secondary' : 'default'}>{mockFixture.status}</Badge>
            {mockFixture.status === 'Completed' && (
                <p className="mt-2 font-semibold text-lg">{mockScorecard.resultSummary}</p>
            )}
        </CardContent>
      </Card>
      
       <Tabs defaultValue="innings1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="innings1">{mockScorecard.innings1.teamName}</TabsTrigger>
            <TabsTrigger value="innings2">{mockScorecard.innings2.teamName}</TabsTrigger>
        </TabsList>
        <TabsContent value="innings1">
            <Card>
                <CardHeader>
                    <CardTitle>Innings 1 Scorecard</CardTitle>
                    <CardDescription>Detailed scorecard for the first innings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Scorecard innings={mockScorecard.innings1} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="innings2">
             <Card>
                <CardHeader>
                    <CardTitle>Innings 2 Scorecard</CardTitle>
                    <CardDescription>Detailed scorecard for the second innings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Scorecard innings={mockScorecard.innings2} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

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
