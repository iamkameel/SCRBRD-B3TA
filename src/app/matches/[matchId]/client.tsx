
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
import { Scorecard } from "./scorecard";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { assignOfficialToMatchAction } from '@/lib/actions/matches';
import { initialPlayers as mockPeople, mockScorecard } from "@/lib/data";
import type { Match, Person, Official } from "@/lib/data";

// From schema: match_role_assignments
const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

// From schema: scoring_actions (simplified)
const scoringActionSchema = z.object({
  batsmanId: z.string({ required_error: "Please select the batsman." }),
  bowlerId: z.string({ required_error: "Please select the bowler." }),
  runsOffBat: z.coerce.number().int().min(0).max(6).default(0),
  isWicket: z.boolean().default(false),
}).refine(data => data.batsmanId !== data.bowlerId, {
    message: "Batsman and bowler cannot be the same person.",
    path: ["bowlerId"],
});


type ScoringActionFormValues = z.infer<typeof scoringActionSchema>;

// From schema: ball_events
const ballEventSchema = z.object({
  eventType: z.string({ required_error: "Please select an event type." }),
  details: z.string().min(1, { message: "Details are required." }),
});

type BallEventFormValues = z.infer<typeof ballEventSchema>;

const commentarySchema = z.object({
  text: z.string().min(1, { message: "Comment cannot be empty." }),
});
type CommentaryFormValues = z.infer<typeof commentarySchema>;

interface BallEvent {
  eventId: string;
  eventType: string;
  details: string;
}

interface Commentary {
  commentId: string;
  authorName: string;
  text: string;
  timestamp: Date;
}

const EVENT_TYPES = ["Fielding Change", "Weather Delay", "Injury Break", "Pitch Report", "Other"];

const ROLES = ["Umpire", "Scorer"];

function AddScoringActionEventDialog({ onActionAdded }: { onActionAdded: (action: ScoringActionFormValues) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<ScoringActionFormValues>({
    resolver: zodResolver(scoringActionSchema),
    defaultValues: {
      runsOffBat: 0,
      isWicket: false,
    },
  });

  const players = mockPeople.filter(p => p.roles.includes("Player"));

  function onSubmit(data: ScoringActionFormValues) {
    onActionAdded(data);
    toast({
      title: "Scoring Action Recorded",
      description: `A new event has been logged for this match.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Scoring Action
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Scoring Event</DialogTitle>
          <DialogDescription>Log a ball-by-ball event. This will be used to build the live scorecard.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="batsmanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>On-strike Batsman</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a batsman" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {players.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bowlerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bowler</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a bowler" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {players.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="runsOffBat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Runs off Bat</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isWicket"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Is it a wicket?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Record Action</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


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

function AddBallEventDialog({ onEventAdded }: { onEventAdded: (event: BallEvent) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<BallEventFormValues>({
    resolver: zodResolver(ballEventSchema),
  });

  function onSubmit(data: BallEventFormValues) {
    const newEvent: BallEvent = {
        eventId: `event_${new Date().getTime()}`,
        ...data
    };
    onEventAdded(newEvent);
    toast({
      title: "Match Event Logged",
      description: `A new '${data.eventType}' event has been logged.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Log Match Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a Match Event</DialogTitle>
          <DialogDescription>
            Record a non-scoring event like a fielding change or a delay.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an event type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EVENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mid-on moves to deep square leg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Log Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function MatchDetailsClient({ match, initialOfficials, people }: { match: Match; initialOfficials: Official[]; people: Person[] }) {
  const [scoringActions, setScoringActions] = React.useState<ScoringActionFormValues[]>([]);
  const [ballEvents, setBallEvents] = React.useState<BallEvent[]>([]);
  const [commentary, setCommentary] = React.useState<Commentary[]>([]);
  const { toast } = useToast();
  
  const commentaryForm = useForm<CommentaryFormValues>({
    resolver: zodResolver(commentarySchema),
    defaultValues: {
      text: "",
    },
  });

  const handleActionAdded = (action: ScoringActionFormValues) => {
    setScoringActions(prev => [...prev, action]);
    console.log("New Scoring Action: ", action);
  };

  const handleBallEventAdded = (event: BallEvent) => {
    setBallEvents(prev => [...prev, event]);
  };
  
  const handleCommentaryAdded = (data: CommentaryFormValues) => {
    const newComment: Commentary = {
        commentId: `comment_${new Date().getTime()}`,
        authorName: "System Scorer", // Placeholder author
        text: data.text,
        timestamp: new Date(),
    };
    setCommentary(prev => [newComment, ...prev]);
    commentaryForm.reset();
    toast({
      title: "Comment Added",
      description: "Your commentary has been logged.",
    });
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
            {match.status === 'completed' && (
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
        <CardHeader>
          <CardTitle>Live Scoring</CardTitle>
          <CardDescription>Record ball-by-ball events for this match.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddScoringActionEventDialog onActionAdded={handleActionAdded} />
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Recent Events</h4>
            {scoringActions.length > 0 ? (
                <div className="max-h-60 overflow-y-auto rounded-md border bg-muted p-4">
                    <pre className="text-xs">{JSON.stringify(scoringActions, null, 2)}</pre>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground p-4 text-center">No scoring events recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match Events Log</CardTitle>
          <CardDescription>Log and view non-scoring events like fielding changes or delays.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddBallEventDialog onEventAdded={handleBallEventAdded} />
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Logged Events</h4>
            {ballEvents.length > 0 ? (
                <div className="max-h-60 overflow-y-auto rounded-md border bg-muted p-4">
                    <pre className="text-xs">{JSON.stringify(ballEvents, null, 2)}</pre>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground p-4 text-center">No match events logged yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

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
      
      <Card>
        <CardHeader>
            <CardTitle>Match Commentary</CardTitle>
            <CardDescription>Provide live updates and insights on the match.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...commentaryForm}>
                <form onSubmit={commentaryForm.handleSubmit(handleCommentaryAdded)} className="flex items-start gap-4">
                    <FormField
                        control={commentaryForm.control}
                        name="text"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                            <FormControl>
                                <Textarea placeholder="e.g. What a catch at slip!" {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Add Comment</Button>
                </form>
            </Form>
            <div className="mt-6 space-y-4">
                <h4 className="font-medium">Live Feed</h4>
                {commentary.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-4">
                    {commentary.map((comment) => (
                    <div key={comment.commentId} className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-sm font-medium text-muted-foreground pt-0.5">
                            {format(comment.timestamp, "HH:mm")}
                        </div>
                        <div className="flex-grow border-l-2 border-border pl-4">
                            <p className="text-sm font-semibold">{comment.authorName}</p>
                            <p className="text-sm text-foreground/90">{comment.text}</p>
                        </div>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-sm text-muted-foreground p-4 text-center border rounded-md">No commentary yet.</p>
                )}
            </div>
        </CardContent>
      </Card>

    </div>
  )
}
