
'use client';

import * as React from "react";
import { ArrowLeft, MoreHorizontal, Trash2, Wand2, Edit, PlusCircle, User, BarChart2, Heart, Shield, Dumbbell, Briefcase, Mail, Phone, Target, Building, Calendar, Star } from "lucide-react";
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
import type { Person, PlayerStats, PlayerTeamAssignment, PlayerMatchPerformance, Team, PlayerTrackerData, PersonSkills } from "@/lib/data";
import { removePersonLinkAction, generateAndSavePlayerPortraitAction } from '@/lib/actions/players';
import { addPlayerToRosterAction, updateRosterAssignmentAction, removeRosterAssignmentAction } from '@/lib/actions/teams';
import { AddLinkDialog } from "./add-link-dialog";
import { PlayerDevelopmentCard } from "./player-development-card";
import { useAuth } from "@/lib/auth-context";
import { AssignTeamDialog, EditTeamAssignmentDialog } from "./team-assignment-dialogs";
import { PlayerSkillsCard } from "./player-skills-card";
import { PlayerTrackerTab } from "./player-tracker-tab";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
    trackerData: PlayerTrackerData;
}

const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value?: string | number, href?: string }) => {
    if (!value) return null;
    const content = href ? <Link href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</Link> : <span>{value}</span>;
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-right">{content}</span>
            </div>
        </div>
    );
};

const calculateOverallScore = (skills?: PersonSkills): number => {
    if (!skills) return 0;

    const allScores: number[] = [];
    
    const extractScores = (obj: any) => {
        for (const key in obj) {
            if (typeof obj[key] === 'number') {
                allScores.push(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                extractScores(obj[key]);
            }
        }
    };
    
    extractScores(skills);

    if (allScores.length === 0) return 0;
    
    const sum = allScores.reduce((acc, score) => acc + score, 0);
    const average = sum / allScores.length;

    // Normalize from a 1-20 scale to a 1-100 scale and round it
    return Math.round((average / 20) * 100);
}

const OverallRatingCard = ({ score }: { score: number }) => {
    const getRatingColor = (s: number) => {
        if (s >= 85) return 'text-green-400';
        if (s >= 70) return 'text-lime-400';
        if (s >= 55) return 'text-yellow-400';
        if (s >= 40) return 'text-orange-400';
        return 'text-red-400';
    }
    
    return (
        <Card>
            <CardHeader className="items-center pb-2">
                <CardTitle>Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative h-28 w-28 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            className="text-muted/20"
                            strokeWidth="10"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                        />
                        {/* Progress circle */}
                        <circle
                            className={cn("transition-all duration-1000 ease-out", getRatingColor(score))}
                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 45 * (score / 100)}, ${2 * Math.PI * 45}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                        />
                    </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-3xl font-bold", getRatingColor(score))}>{score}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function PersonDetailsClient({ person, playerStats, initialGuardians, initialChildren, availablePeople, teamAssignments, matchHistory, allTeams, canManage, trackerData }: PersonDetailsClientProps) {
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
  const primaryTeam = teamAssignments[0];
  const overallScore = calculateOverallScore(person.skills);

  return (
    <>
    <div className="flex flex-col gap-8">
        <header>
            <Link href="/people" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />Back to People
            </Link>
            <Card className="bg-card/50">
                <CardContent className="p-4">
                     <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                                <AvatarImage src={person.profileImageUrl} />
                                <AvatarFallback className="text-3xl">{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            {canGeneratePortrait && (
                                <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background" onClick={handleGeneratePortrait} disabled={isGeneratingPortrait}>
                                    <Wand2 className={`h-4 w-4 ${isGeneratingPortrait ? 'animate-spin' : ''}`} />
                                    <span className="sr-only">Generate AI Portrait</span>
                                </Button>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.displayName || `${person.firstName} ${person.lastName}`}</h1>
                             <p className="text-muted-foreground font-semibold">
                                {primaryTeam ? (
                                    <>
                                        <Link href={`/teams/${primaryTeam.teamId}`} className="hover:underline">{primaryTeam.teamName}</Link>
                                        <span className="mx-2">&bull;</span>
                                        <span>{teamAssignments[0]?.role}</span>
                                    </>
                                ) : (
                                    <span>Unassigned</span>
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-3 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {person.dateOfBirth && <InfoItem icon={Calendar} label="Age" value={`${new Date().getFullYear() - new Date(person.dateOfBirth).getFullYear()}`} />}
                        <InfoItem icon={Calendar} label="Born" value={person.dateOfBirth ? format(person.dateOfBirth, 'PPP') : undefined} />
                        <InfoItem icon={Dumbbell} label="Height" value={person.physicalAttributes?.heightCm ? `${person.physicalAttributes.heightCm} cm` : undefined} />
                        <InfoItem icon={Dumbbell} label="Weight" value={person.physicalAttributes?.weightKg ? `${person.physicalAttributes.weightKg} kg` : undefined} />
                    </CardContent>
                </Card>
                 {isPlayer && <OverallRatingCard score={overallScore} />}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Team Assignments</CardTitle>
                             {canManage && <Button size="sm" variant="ghost" onClick={() => setIsAssignTeamDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Assign</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {teamAssignments.length > 0 ? (teamAssignments.map(assignment => (
                           <div key={assignment.assignmentId} className="flex items-center gap-3 text-sm">
                                <Link href={`/teams/${assignment.teamId}`} className="font-semibold hover:underline flex-1">{assignment.teamName}</Link>
                                <span className="text-muted-foreground">{assignment.role}</span>
                                 {canManage && <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => { setAssignmentToEdit(assignment); setIsEditAssignmentDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => { setAssignmentToRemove(assignment); setIsRemoveAssignmentDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>}
                           </div>
                        ))) : <p className="text-sm text-center text-muted-foreground py-4">Not assigned to any teams.</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Family Links</CardTitle>
                             {canManage && <AddLinkDialog currentPersonId={person.personId} availablePeople={availablePeople} />}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {initialGuardians.length > 0 && <div className="space-y-2"><p className="text-sm font-semibold text-muted-foreground">Guardians</p>{initialGuardians.map(g => <p key={g.personId}><Link href={`/people/${g.personId}`} className="hover:underline">{g.firstName} {g.lastName}</Link></p>)}</div>}
                        {initialChildren.length > 0 && <div className="space-y-2"><p className="text-sm font-semibold text-muted-foreground">Children</p>{initialChildren.map(c => <p key={c.personId}><Link href={`/people/${c.personId}`} className="hover:underline">{c.firstName} {c.lastName}</Link></p>)}</div>}
                        {initialGuardians.length === 0 && initialChildren.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No family links established.</p>}
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-9">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tracker" disabled={!isPlayer}>Tracker</TabsTrigger>
                        <TabsTrigger value="skills" disabled={!isPlayer}>Skills</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
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
                    <TabsContent value="tracker" className="mt-4">
                        <PlayerTrackerTab person={person} trackerData={trackerData} />
                    </TabsContent>
                    <TabsContent value="skills" className="mt-4">
                        <PlayerSkillsCard person={person} canManage={canManage} />
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
        </div>
      </div>

      {canManage && <AssignTeamDialog person={person} teams={allTeams} open={isAssignTeamDialogOpen} onOpenChange={setIsAssignTeamDialogOpen} />}
      {canManage && assignmentToEdit && <EditTeamAssignmentDialog assignment={assignmentToEdit} open={isEditAssignmentDialogOpen} onOpenChange={setIsEditAssignmentDialogOpen} />}
      
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
