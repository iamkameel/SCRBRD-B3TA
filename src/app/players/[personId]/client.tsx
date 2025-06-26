'use client';

import * as React from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Person, PlayerStats, PlayerTeamAssignment } from "@/lib/data";
import { removePersonLinkAction } from "@/lib/actions/players";
import { AddLinkDialog } from "./add-link-dialog";


interface PlayerDetailsClientProps {
    person: Person;
    playerStats: PlayerStats;
    initialGuardians: Person[];
    initialChildren: Person[];
    availablePeople: Person[];
    teamAssignments: PlayerTeamAssignment[];
}

export default function PlayerDetailsClient({ person, playerStats, initialGuardians, initialChildren, availablePeople, teamAssignments }: PlayerDetailsClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [selectedLink, setSelectedLink] = React.useState<{linkedPerson: Person, relationship: 'guardian' | 'child'} | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const handleRemoveLink = () => {
    if (!selectedLink) return;
    startTransition(async () => {
      try {
        await removePersonLinkAction(person.personId, selectedLink.linkedPerson.personId, selectedLink.relationship);
        toast({ title: "Link Removed", description: "The family link has been removed." });
        setIsDeleteDialogOpen(false);
        setSelectedLink(null);
        router.refresh();
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove link.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedLink(null);
      }
    });
  }
  
  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <Link href="/players" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to People
          </Link>
          <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20"><AvatarImage src={person.profileImageUrl} /><AvatarFallback className="text-3xl">{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar>
              <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.firstName} {person.lastName}</h1>
                  <p className="text-muted-foreground">{person.email}</p>
                  <div className="flex gap-2 mt-2">{person.roles.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}</div>
              </div>
          </div>
        </header>

        <Card>
            <CardHeader>
                <CardTitle>Team Assignments</CardTitle>
                <CardDescription>A list of teams {person.firstName} is assigned to.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamAssignments.length > 0 ? (
                            teamAssignments.map(assignment => (
                                <TableRow key={assignment.teamId}>
                                    <TableCell className="font-medium">
                                        <Link href={`/teams/${assignment.teamId}`} className="hover:underline">
                                            {assignment.teamName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{assignment.role}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize">
                                            {assignment.status.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    Not assigned to any teams.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Family Links</CardTitle><CardDescription>Guardians and children linked to {person.firstName}.</CardDescription></div>
              <AddLinkDialog currentPersonId={person.personId} availablePeople={availablePeople} />
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                  <h3 className="text-lg font-medium mb-2">Guardians</h3>
                  <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {initialGuardians.length > 0 ? initialGuardians.map(g => (
                              <TableRow key={g.personId}>
                                  <TableCell><Link href={`/players/${g.personId}`} className="hover:underline">{g.firstName} {g.lastName}</Link></TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent><DropdownMenuItem onSelect={() => { setSelectedLink({linkedPerson: g, relationship: 'guardian'}); setIsDeleteDialogOpen(true);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove Link</DropdownMenuItem></DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          )) : (<TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">No guardians linked.</TableCell></TableRow>)}
                      </TableBody>
                  </Table>
              </div>
              <div>
                  <h3 className="text-lg font-medium mb-2">Children</h3>
                  <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {initialChildren.length > 0 ? initialChildren.map(c => (
                              <TableRow key={c.personId}>
                                  <TableCell><Link href={`/players/${c.personId}`} className="hover:underline">{c.firstName} {c.lastName}</Link></TableCell>
                                  <TableCell className="text-right">
                                     <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent><DropdownMenuItem onSelect={() => { setSelectedLink({linkedPerson: c, relationship: 'child'}); setIsDeleteDialogOpen(true);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove Link</DropdownMenuItem></DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          )) : (<TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">No children linked.</TableCell></TableRow>)}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
        </Card>

        {person.roles.includes("Player") && (
          <Card>
              <CardHeader><CardTitle>Player Statistics</CardTitle><CardDescription>Overall career statistics for all completed matches.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                  <div>
                      <h3 className="text-lg font-medium mb-4 text-primary">Batting</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                          <StatItem label="Matches" value={playerStats.matchesPlayed} /><StatItem label="Innings" value={playerStats.inningsBatted} /><StatItem label="Runs" value={playerStats.totalRuns} /><StatItem label="Highest" value={`${playerStats.highestScore}${playerStats.highestScoreNotOut ? '*' : ''}`} /><StatItem label="Average" value={playerStats.battingAverage.toFixed(2)} /><StatItem label="Strike Rate" value={playerStats.strikeRate.toFixed(2)} /><StatItem label="100s" value={playerStats.hundreds} /><StatItem label="50s" value={playerStats.fifties} />
                      </div>
                  </div>
                  <Separator />
                  <div>
                      <h3 className="text-lg font-medium mb-4 text-primary">Bowling</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                          <StatItem label="Overs" value={playerStats.oversBowled} /><StatItem label="Wickets" value={playerStats.wicketsTaken} /><StatItem label="Average" value={playerStats.bowlingAverage.toFixed(2)} /><StatItem label="Economy" value={playerStats.economyRate.toFixed(2)} /><StatItem label="Maidens" value={playerStats.maidens} /><StatItem label="Best" value={playerStats.bestBowling} /><StatItem label="Runs Conceded" value={playerStats.runsConceded} />
                      </div>
                  </div>
                  <Separator />
                  <div>
                      <h3 className="text-lg font-medium mb-4 text-primary">Fielding</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                          <StatItem label="Catches" value={playerStats.catches} /><StatItem label="Stumpings" value={playerStats.stumpings} />
                      </div>
                  </div>
              </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove the family link between {person.firstName} and {selectedLink?.linkedPerson.firstName}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedLink(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveLink} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Link"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
