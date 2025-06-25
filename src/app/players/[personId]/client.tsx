'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Person } from "@/lib/data";
import { addPersonLinkAction } from "@/lib/actions/players";

const linkSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  relationship: z.enum(["guardian", "child"], { required_error: "Please select a relationship." }),
});

type LinkSchemaValues = z.infer<typeof linkSchema>;

function AddLinkDialog({ currentPersonId, availablePeople }: { currentPersonId: string, availablePeople: Person[] }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<LinkSchemaValues>({
    resolver: zodResolver(linkSchema),
  });

  function onSubmit(data: LinkSchemaValues) {
    startTransition(async () => {
      try {
        await addPersonLinkAction(currentPersonId, data.personId, data.relationship);
        toast({
          title: "Link Created",
          description: "The link has been successfully created.",
        });
        setOpen(false);
        form.reset();
        // The page will be refreshed by the server action's revalidatePath
        // but we can also trigger a manual refresh if needed.
        router.refresh();
      } catch (error) {
        toast({
          title: "Error Creating Link",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={isPending}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Person</DialogTitle>
          <DialogDescription>Create a guardian or child link.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person to Link</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {availablePeople.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a relationship" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="guardian">Is a Guardian of...</SelectItem>
                      <SelectItem value="child">Is a Child of...</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Linking..." : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface PlayerDetailsClientProps {
    person: Person;
    initialGuardians: Person[];
    initialChildren: Person[];
    availablePeople: Person[];
}

export default function PlayerDetailsClient({ person, initialGuardians, initialChildren, availablePeople }: PlayerDetailsClientProps) {
  
  // Placeholder for real stats in the future
  const placeholderStats = {
    matchesPlayed: 0,
    inningsBatted: 0,
    totalRuns: 0,
    highestScore: 0,
    battingAverage: 0,
    strikeRate: 0,
    hundreds: 0,
    fifties: 0,
    oversBowled: 0,
    wicketsTaken: 0,
    bowlingAverage: 0,
    economyRate: 0,
    maidens: 0,
    bestBowling: "0/0",
    runsConceded: 0,
    catches: 0,
    stumpings: 0,
  };
  
  const playerStats = placeholderStats;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/players" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Link>
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={person.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                    {person.firstName?.[0]}{person.lastName?.[0]}
                </AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.firstName} {person.lastName}</h1>
                <p className="text-muted-foreground">{person.email}</p>
                <div className="flex gap-2 mt-2">
                    {person.roles.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                </div>
            </div>
        </div>
      </header>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Family Links</CardTitle>
                <CardDescription>Guardians and children linked to {person.firstName}.</CardDescription>
            </div>
            <AddLinkDialog currentPersonId={person.personId} availablePeople={availablePeople} />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
                <h3 className="text-lg font-medium mb-2">Guardians</h3>
                <Table>
                    <TableBody>
                        {initialGuardians.length > 0 ? initialGuardians.map(g => (
                            <TableRow key={g.personId}>
                                <TableCell>
                                    <Link href={`/players/${g.personId}`} className="hover:underline">{g.firstName} {g.lastName}</Link>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell className="text-center text-muted-foreground">No guardians linked.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div>
                <h3 className="text-lg font-medium mb-2">Children</h3>
                <Table>
                    <TableBody>
                        {initialChildren.length > 0 ? initialChildren.map(c => (
                            <TableRow key={c.personId}>
                                <TableCell>
                                    <Link href={`/players/${c.personId}`} className="hover:underline">{c.firstName} {c.lastName}</Link>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell className="text-center text-muted-foreground">No children linked.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {person.roles.includes("Player") && (
        <Card>
            <CardHeader>
                <CardTitle>Player Statistics</CardTitle>
                <CardDescription>Overall career statistics for the current season.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-4 text-primary">Batting</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                        <StatItem label="Matches" value={playerStats.matchesPlayed} />
                        <StatItem label="Innings" value={playerStats.inningsBatted} />
                        <StatItem label="Runs" value={playerStats.totalRuns} />
                        <StatItem label="Highest" value={playerStats.highestScore} />
                        <StatItem label="Average" value={playerStats.battingAverage.toFixed(2)} />
                        <StatItem label="Strike Rate" value={playerStats.strikeRate.toFixed(2)} />
                        <StatItem label="100s" value={playerStats.hundreds} />
                        <StatItem label="50s" value={playerStats.fifties} />
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-4 text-primary">Bowling</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                        <StatItem label="Overs" value={playerStats.oversBowled} />
                        <StatItem label="Wickets" value={playerStats.wicketsTaken} />
                        <StatItem label="Average" value={playerStats.bowlingAverage.toFixed(2)} />
                        <StatItem label="Economy" value={playerStats.economyRate.toFixed(2)} />
                        <StatItem label="Maidens" value={playerStats.maidens} />
                        <StatItem label="Best" value={playerStats.bestBowling} />
                        <StatItem label="Runs Conceded" value={playerStats.runsConceded} />
                    </div>
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-4 text-primary">Fielding</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                        <StatItem label="Catches" value={playerStats.catches} />
                        <StatItem label="Stumpings" value={playerStats.stumpings} />
                    </div>
                </div>

            </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: string | number }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
        </div>
    )
}
