

'use client';

import * as React from "react";
import { ArrowLeft, MoreHorizontal, Trash2, Wand2, Edit, PlusCircle, User, BarChart2, Heart, Shield, Dumbbell, Briefcase, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Person, PlayerStats, PlayerTeamAssignment, PlayerMatchPerformance, Team } from "@/lib/data";
import { removePersonLinkAction, generateAndSavePlayerPortraitAction } from '@/lib/actions/players';
import { addPlayerToRosterAction, updateRosterAssignmentAction, removeRosterAssignmentAction } from '@/lib/actions/teams';
import { AddLinkDialog } from "./add-link-dialog";
import { PlayerDevelopmentCard } from "./player-development-card";
import { useAuth } from "@/lib/auth-context";
import { AssignTeamDialog, EditTeamAssignmentDialog } from "./team-assignment-dialogs";

interface PersonDetailsClientProps {
    person: Person;
    playerStats: PlayerStats;
    initialGuardians: Person[];
    initialChildren: Person[];
    availablePeople: Person[];
    teamAssignments: PlayerTeamAssignment[];
    matchHistory: PlayerMatchPerformance[];
    allTeams: Team[];
    canManage: boolean;
}

const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value?: string | number, href?: string }) => {
    if (!value) return null;
    const content = href ? <Link href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</Link> : <span>{value}</span>;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-sm text-muted-foreground">{content}</p>
            </div>
        </div>
    );
};

export default function PersonDetailsClient({ person, playerStats, initialGuardians, initialChildren, availablePeople, teamAssignments, matchHistory, allTeams, canManage }: PersonDetailsClientProps) {
  const { person: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isGeneratingPortrait, startPortraitGeneration] = React.useTransition();
  
  const [selectedLink, setSelectedLink] = React.useState<{linkedPerson: Person, relationship: 'guardian' | 'child'} | null>(null);
  const [isDeleteLinkDialogOpen, setIsDeleteLinkDialogOpen] = React.useState(false);

  const [assignmentToEdit, setAssignmentToEdit] = React.useState<PlayerTeamAssignment | null>(null);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = React.useState(false);

  const [assignmentToRemove, setAssignmentToRemove] = React.useState<PlayerTeamAssignment | null>(null);
  const [isRemoveAssignmentDialogOpen, setIsRemoveAssignmentDialogOpen] = React.useState(false);
  
  const [isAssignTeamDialogOpen, setIsAssignTeamDialogOpen] = React.useState(false);

  const handleRemoveLink = () => {
    if (!selectedLink) return;
    startTransition(async () => {
      try {
        await removePersonLinkAction(person.personId, selectedLink.linkedPerson.personId, selectedLink.relationship);
        toast({ title: "Link Removed", description: "The family link has been removed." });
        setIsDeleteLinkDialogOpen(false);
        setSelectedLink(null);
        router.refresh();
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove link.", variant: "destructive" });
        setIsDeleteLinkDialogOpen(false);
        setSelectedLink(null);
      }
    });
  }

  const handleGeneratePortrait = () => {
    startPortraitGeneration(async () => {
        try {
            await generateAndSavePlayerPortraitAction(person.personId);
            toast({ title: "Portrait Generated", description: "The new AI portrait has been saved."});
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate portrait.", variant: "destructive" });
        }
    });
  }

  const handleRemoveTeamAssignment = () => {
    if (!assignmentToRemove) return;
    startTransition(async () => {
        try {
            await removeRosterAssignmentAction(assignmentToRemove.teamId, assignmentToRemove.assignmentId);
            toast({ title: "Assignment Removed", description: `${person.firstName} was removed from ${assignmentToRemove.teamName}.`});
            setIsRemoveAssignmentDialogOpen(false);
            setAssignmentToRemove(null);
        } catch (error) {
             toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove assignment.", variant: "destructive" });
             setIsRemoveAssignmentDialogOpen(false);
             setAssignmentToRemove(null);
        }
    });
  };
  
  const canGeneratePortrait = canManage || person.personId === currentUser?.personId;
  const isPlayer = person.roles.includes('Player');

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <Link href="/people" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to People
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                      <AvatarImage src={person.profileImageUrl} />
                      <AvatarFallback className="text-3xl">{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  {canGeneratePortrait && (
                      <Button 
                          size="icon" variant="outline"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background"
                          onClick={handleGeneratePortrait} disabled={isGeneratingPortrait}
                      >
                          <Wand2 className={`h-4 w-4 ${isGeneratingPortrait ? 'animate-spin' : ''}`} />
                          <span className="sr-only">Generate AI Portrait</span>
                      </Button>
                  )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.displayName || `${person.firstName} ${person.lastName}`}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {person.roles.map(role => <Badge key={role} variant="secondary" className="capitalize">{role}</Badge>)}
                    </div>
                </div>
            </div>
          </div>
        </header>

         <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="history">Match History</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
                 <Card>
                  <CardHeader><CardTitle>Player Statistics</CardTitle><CardDescription>Overall career statistics for all completed matches.</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                      {isPlayer ? (
                          <>
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
                          </>
                      ) : (
                          <div className="text-center text-muted-foreground py-10">
                              <BarChart2 className="mx-auto h-12 w-12" />
                              <p className="mt-4">Statistical data is only available for people with the 'Player' role.</p>
                          </div>
                      )}
                  </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="profile" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Biography & Qualifications</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {person.biography && <div className="space-y-2"><h3 className="font-semibold">Biography</h3><p className="text-muted-foreground text-sm whitespace-pre-wrap">{person.biography}</p></div>}
                        {person.qualifications && person.qualifications.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Qualifications</h3>
                                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                                    {person.qualifications.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                        )}
                        {(!person.biography && (!person.qualifications || person.qualifications.length === 0)) && (
                            <p className="text-sm text-muted-foreground text-center py-8">No biography or qualifications have been added.</p>
                        )}
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>Contact Info</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <InfoItem icon={Mail} label="Email" value={person.email} href={`mailto:${person.email}`} />
                            <InfoItem icon={Phone} label="Phone" value={person.phone} href={`tel:${person.phone}`} />
                        </CardContent>
                    </Card>
                    {person.emergencyContact?.name && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5"/>Emergency</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <InfoItem icon={User} label="Contact Name" value={person.emergencyContact.name} />
                            <InfoItem icon={Shield} label="Relation" value={person.emergencyContact.relation} />
                            <InfoItem icon={Phone} label="Contact Phone" value={person.emergencyContact.phone} href={`tel:${person.emergencyContact.phone}`} />
                        </CardContent>
                      </Card>
                    )}
                    {isPlayer && person.physicalAttributes && (
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5"/>Physical Profile</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <InfoItem icon={Dumbbell} label="Height" value={person.physicalAttributes.heightCm ? `${person.physicalAttributes.heightCm} cm` : undefined} />
                                <InfoItem icon={Dumbbell} label="Weight" value={person.physicalAttributes.weightKg ? `${person.physicalAttributes.weightKg} kg` : undefined} />
                                <InfoItem icon={Dumbbell} label="Batting Hand" value={person.physicalAttributes.battingHand} />
                                <InfoItem icon={Dumbbell} label="Bowling Hand" value={person.physicalAttributes.bowlingHand} />
                            </CardContent>
                         </Card>
                    )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Team Assignments</CardTitle>
                            <CardDescription>A list of teams {person.firstName} is assigned to.</CardDescription>
                        </div>
                        {canManage && <Button size="sm" onClick={() => setIsAssignTeamDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Assign to Team</Button>}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>{canManage && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                            <TableBody>{teamAssignments.length > 0 ? (teamAssignments.map(assignment => (
                                <TableRow key={assignment.assignmentId}>
                                    <TableCell className="font-medium"><Link href={`/teams/${assignment.teamId}`} className="hover:underline">{assignment.teamName}</Link></TableCell>
                                    <TableCell>{assignment.role}</TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{assignment.status.replace(/_/g, " ")}</Badge></TableCell>
                                    {canManage && <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => { setAssignmentToEdit(assignment); setIsEditAssignmentDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => { setAssignmentToRemove(assignment); setIsRemoveAssignmentDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>}
                                </TableRow>
                            ))) : ( <TableRow><TableCell colSpan={canManage ? 4 : 3} className="h-24 text-center text-muted-foreground">Not assigned to any teams.</TableCell></TableRow> )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
                <Card>
                    <CardHeader><CardTitle>Recent Match History</CardTitle><CardDescription>A summary of the last 5 match performances.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Opponent</TableHead><TableHead>Batting</TableHead><TableHead>Bowling</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {matchHistory.length > 0 ? (
                                    matchHistory.map(perf => (
                                        <TableRow key={perf.matchId}>
                                            <TableCell>{format(perf.date, 'dd MMM yyyy')}</TableCell>
                                            <TableCell><Link href={`/matches/${perf.matchId}`} className="hover:underline">{perf.opponent}</Link></TableCell>
                                            <TableCell>{perf.battingStatus || 'DNB'}</TableCell>
                                            <TableCell>{perf.wicketsTaken !== undefined && perf.runsConceded !== undefined ? `${perf.wicketsTaken}/${perf.runsConceded}` : 'DNB'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No completed match history found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="development" className="mt-4">
                <PlayerDevelopmentCard 
                    personId={person.personId} 
                    initialPlan={person.developmentPlan ?? null}
                    initialPlanDate={person.developmentPlanGeneratedAt}
                />
            </TabsContent>
         </Tabs>
      </div>

      {canManage && <AssignTeamDialog person={person} teams={allTeams} open={isAssignTeamDialogOpen} onOpenChange={setIsAssignTeamDialogOpen} />}
      {canManage && assignmentToEdit && <EditTeamAssignmentDialog assignment={assignmentToEdit} open={isEditAssignmentDialogOpen} onOpenChange={setIsEditAssignmentDialogOpen} />}
      
      {canManage && <AddLinkDialog currentPersonId={person.personId} availablePeople={availablePeople} />}

      <AlertDialog open={isDeleteLinkDialogOpen} onOpenChange={setIsDeleteLinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove the family link between {person.firstName} and {selectedLink?.linkedPerson.firstName}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedLink(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveLink} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Link"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isRemoveAssignmentDialogOpen} onOpenChange={setIsRemoveAssignmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove <strong>{person.firstName}</strong> from the <strong>{assignmentToRemove?.teamName}</strong> team. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssignmentToRemove(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTeamAssignment} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Assignment"}</AlertDialogAction>
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
