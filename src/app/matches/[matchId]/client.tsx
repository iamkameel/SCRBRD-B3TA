
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assignOfficialToMatchAction } from '@/lib/actions/matches';
import type { Match, Person, Official, Innings } from "@/lib/data";
import { Scorecard } from "./scorecard";

// From schema: match_role_assignments
const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

const ROLES = ["Umpire", "Scorer"];

function AssignOfficialDialog({ matchId, people }: { matchId: string, people: Person[]}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { role: "Umpire" },
  });

  function onSubmit(data: AssignmentFormValues) {
    startTransition(async () => {
      try {
        await assignOfficialToMatchAction(matchId, data);
        toast({
          title: "Official Assigned",
          description: `The person has been assigned to the match.`,
        });
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not assign official.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isPending}>
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
                  <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {people.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
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
                  <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="Umpire" disabled={isPending}>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Assigning..." : "Assign to Match"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function MatchDetailsClient({ match, initialOfficials, people }: { match: Match; initialOfficials: Official[]; people: Person[] }) {
  
  const placeholderInnings1: Innings = {
    teamName: match.teamAName,
    totalRuns: 150,
    wickets: 5,
    overs: 20.0,
    battingCard: [
      { name: "Player A1", status: "c & b Bowler B1", runs: 30, balls: 25, fours: 4, sixes: 1, strikeRate: 120.00 },
      { name: "Player A2", status: "run out", runs: 15, balls: 20, fours: 1, sixes: 0, strikeRate: 75.00 },
      { name: "Player A3", status: "not out", runs: 50, balls: 40, fours: 5, sixes: 2, strikeRate: 125.00 },
      { name: "Player A4", status: "b Bowler B2", runs: 5, balls: 10, fours: 0, sixes: 0, strikeRate: 50.00 },
    ],
    bowlingCard: [
      { name: "Bowler B1", overs: 4, maidens: 0, runs: 30, wickets: 2, economy: 7.50 },
      { name: "Bowler B2", overs: 4, maidens: 0, runs: 25, wickets: 1, economy: 6.25 },
    ],
    fallOfWickets: [
      { wicket: 1, runs: 25, batsmanName: "Player A2", over: 5.2 },
      { wicket: 2, runs: 80, batsmanName: "Player A1", over: 12.1 },
    ],
    extras: { total: 10, details: "(w 5, nb 1, b 2, lb 2)" },
  };
  
  const placeholderInnings2: Innings = {
      teamName: match.teamBName,
      totalRuns: 148,
      wickets: 8,
      overs: 20.0,
      battingCard: [
        { name: "Player B1", status: "c Player A1 b Bowler A1", runs: 40, balls: 30, fours: 6, sixes: 0, strikeRate: 133.33 },
        { name: "Player B2", status: "st Player A2 b Bowler A2", runs: 20, balls: 22, fours: 2, sixes: 0, strikeRate: 90.91 },
      ],
      bowlingCard: [
         { name: "Bowler A1", overs: 4, maidens: 0, runs: 28, wickets: 3, economy: 7.00 },
         { name: "Bowler A2", overs: 4, maidens: 0, runs: 35, wickets: 2, economy: 8.75 },
      ],
      fallOfWickets: [
         { wicket: 1, runs: 50, batsmanName: "Player B1", over: 8.1 },
         { wicket: 2, runs: 90, batsmanName: "Player B2", over: 14.5 },
      ],
      extras: { total: 8, details: "(w 4, nb 0, b 4, lb 0)" },
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{match.teamAName} vs {match.teamBName}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
             <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(match.dateTime, "PPPP")}</span>
             <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {format(match.dateTime, "p")}</span>
             <span>{match.fieldName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="team-a-innings">
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Scorecard</CardTitle>
                        <CardDescription>Detailed match scorecard for both innings.</CardDescription>
                    </div>
                    <TabsList className="mt-4 md:mt-0">
                        <TabsTrigger value="team-a-innings">{match.teamAName}</TabsTrigger>
                        <TabsTrigger value="team-b-innings">{match.teamBName}</TabsTrigger>
                    </TabsList>
                </div>
            </CardHeader>
            <CardContent>
                <TabsContent value="team-a-innings">
                    <Scorecard innings={placeholderInnings1} />
                </TabsContent>
                <TabsContent value="team-b-innings">
                    <Scorecard innings={placeholderInnings2} />
                </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Match Officials</CardTitle>
            <CardDescription>Manage the umpires and scorers assigned to this match.</CardDescription>
          </div>
          <AssignOfficialDialog matchId={match.matchId} people={people} />
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
              {initialOfficials.length > 0 ? (
                initialOfficials.map(official => (
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
