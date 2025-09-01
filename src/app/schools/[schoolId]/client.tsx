
'use client';

import * as React from "react";
import Link from 'next/link';
import { ArrowLeft, Building, Globe, Phone, Users, User, Palette, Calendar, Facebook, Twitter, Instagram, Youtube, ClipboardList, PlusCircle, Search, Trophy, BarChartHorizontal, Edit } from 'lucide-react';
import type { School, Team, Person, Match } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SchoolDialog } from "../school-dialog";
import { useAuth } from "@/lib/auth-context";

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value?: string | number, href?: string }) => {
    if (!value) return null;
    const content = href ? <Link href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</Link> : <span>{value}</span>;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{content}</p>
            </div>
        </div>
    );
};

const HighlightCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-muted/50 p-4 rounded-lg">
    <p className="font-bold text-primary">{title}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function SchoolDetailsClient({ school, teams, staff, players, allStaff, matches }: { school: School; teams: Team[]; staff: Person[]; players: Person[]; allStaff: Person[]; matches: Match[] }) {
    const { person: currentUser } = useAuth();
    const [isAssignStaffDialogOpen, setIsAssignStaffDialogOpen] = React.useState(false);
    const [isSchoolDialogOpen, setIsSchoolDialogOpen] = React.useState(false);
    
    const canManage = currentUser?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;
    
    const socialLinks = school.socialMedia ? Object.entries(school.socialMedia).filter(([, link]) => link) : [];
    
    const schoolWithStaff = { ...school, staff };
    
    const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'live').sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());

    return (
        <>
        <div className="flex flex-col gap-8">
            <header>
                <Link href="/schools" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Schools
                </Link>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border">
                            <AvatarImage src={school.logoUrl} alt={school.name} />
                            <AvatarFallback className="text-3xl">{school.abbreviation || school.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{school.name}</h1>
                            {school.abbreviation && <p className="text-lg text-muted-foreground">{school.abbreviation}</p>}
                        </div>
                    </div>
                    {canManage && (
                        <Button onClick={() => setIsSchoolDialogOpen(true)}>
                            <Edit className="mr-2" />
                            Edit School
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Total Teams" value={teams.length} icon={Users} />
                        <StatCard title="Active Players" value={players.length} icon={User} />
                        <StatCard title="Fixtures" value={matches.length} icon={ClipboardList} />
                        <StatCard title="Total Staff" value={staff.length} icon={User} />
                     </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>About the School</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {school.motto && <p className="text-lg italic text-muted-foreground">"{school.motto}"</p>}
                           <p>Our motto "{school.motto}" embodies the spirit of determination and perseverance that defines every Westville boy. We offer a comprehensive education that prepares our students for success in all aspects of life.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                               <HighlightCard title="Academic Excellence" description="Consistently achieving top matric results in KZN." />
                               <HighlightCard title="Sports Champions" description="Multiple provincial and national titles." />
                               <HighlightCard title="Leadership Development" description="Strong prefect system and community service." />
                               <HighlightCard title="Modern Facilities" description="State-of-the-art classrooms and sports facilities." />
                            </div>
                        </CardContent>
                    </Card>

                     <Tabs defaultValue="teams" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="teams">Teams</TabsTrigger>
                            <TabsTrigger value="staff">Staff</TabsTrigger>
                            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
                        </TabsList>
                        <TabsContent value="teams" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle>Teams</CardTitle><CardDescription>All teams associated with {school.name}.</CardDescription></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Team Name</TableHead><TableHead>Division</TableHead><TableHead>Season</TableHead></TableRow></TableHeader>
                                        <TableBody>{teams.length > 0 ? (
                                            teams.map(team => (
                                                <TableRow key={team.teamId}>
                                                    <TableCell className="font-medium"><Link href={`/teams/${team.teamId}`} className="hover:underline">{team.name}</Link></TableCell>
                                                    <TableCell>{team.divisionName}</TableCell>
                                                    <TableCell>{team.seasonName}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No teams found for this school.</TableCell></TableRow>)}</TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="staff" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assigned Staff</CardTitle>
                                    <CardDescription>All staff members assigned to {school.name}.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Active Role</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                                        <TableBody>{staff.length > 0 ? (
                                            staff.map(person => (
                                                <TableRow key={person.personId}>
                                                    <TableCell className="font-medium"><Link href={`/people/${person.personId}`} className="hover:underline">{person.firstName} {person.lastName}</Link></TableCell>
                                                    <TableCell><Badge variant="secondary">{person.activeRole}</Badge></TableCell>
                                                    <TableCell>{person.email}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No staff assigned to this school.</TableCell></TableRow>)}</TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="fixtures" className="mt-4">
                             <Card>
                                <CardHeader><CardTitle>Upcoming Fixtures</CardTitle></CardHeader>
                                <CardContent>
                                    {upcomingMatches.length > 0 ? (
                                        <ul className="space-y-4">
                                            {upcomingMatches.map(match => {
                                                const schoolTeamsIds = new Set(teams.map(t => t.teamId));
                                                const isTeamATheSchool = schoolTeamsIds.has(match.teamAId);
                                                const opponentName = isTeamATheSchool ? match.teamBName : match.teamAName;
                                                const opponentLogo = isTeamATheSchool ? match.teamBLogoUrl : match.teamALogoUrl;
                                                
                                                return (
                                                    <li key={match.matchId}>
                                                        <Link href={`/matches/${match.matchId}`} className="block p-3 rounded-lg hover:bg-muted -mx-3">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar className="h-10 w-10 border"><AvatarImage src={opponentLogo} /><AvatarFallback>{opponentName?.[0]}</AvatarFallback></Avatar>
                                                                <div>
                                                                    <p className="font-semibold">vs {opponentName}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {format(match.dateTime, 'eeee, MMMM d, yyyy - p')} at {match.fieldName}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                                            <p>No upcoming fixtures scheduled for {school.name}.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                     </Tabs>
                </div>

                 <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader><CardTitle>School Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                           <InfoItem icon={User} label="Principal" value={school.principal} />
                           <InfoItem icon={Calendar} label="Founded" value={school.establishmentYear} />
                           <InfoItem icon={Globe} label="Website" value={school.website} href={school.website} />
                           <InfoItem icon={Phone} label="Phone" value={school.phone} href={`tel:${school.phone}`} />
                           <InfoItem icon={Building} label="Location" value={school.location} />
                           {socialLinks.length > 0 && (
                             <div className="flex items-center gap-2 pt-2">
                               {school.socialMedia?.facebook && <Link href={school.socialMedia.facebook} target="_blank" className="text-muted-foreground hover:text-foreground"><Facebook/></Link>}
                               {school.socialMedia?.twitter && <Link href={school.socialMedia.twitter} target="_blank" className="text-muted-foreground hover:text-foreground"><Twitter/></Link>}
                               {school.socialMedia?.instagram && <Link href={school.socialMedia.instagram} target="_blank" className="text-muted-foreground hover:text-foreground"><Instagram/></Link>}
                               {school.socialMedia?.youtube && <Link href={school.socialMedia.youtube} target="_blank" className="text-muted-foreground hover:text-foreground"><Youtube/></Link>}
                             </div>
                           )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent News</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-xs text-primary font-semibold">June 28, 2025</p>
                                <h4 className="font-bold">Outstanding Matric Results 2024</h4>
                                <p className="text-sm text-muted-foreground">Westville Boys' achieves 98% pass rate with 85% Bachelor passes, ranking among the top schools in KwaZulu-Natal.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-primary font-semibold">June 25, 2025</p>
                                <h4 className="font-bold">Rugby Team Advances to Provincial Finals</h4>
                                <p className="text-sm text-muted-foreground">Our 1st XV rugby team secures their place in the KZN Schools Rugby Championships after defeating Hilton College 24-18.</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
                        <CardContent className="flex items-center gap-4">
                           {school.brandColors?.primary && <div className="flex flex-col items-center gap-2"><div className="h-10 w-10 rounded-full border" style={{ backgroundColor: school.brandColors.primary }}></div><span className="font-mono text-xs">{school.brandColors.primary}</span></div>}
                           {school.brandColors?.secondary && <div className="flex flex-col items-center gap-2"><div className="h-10 w-10 rounded-full border" style={{ backgroundColor: school.brandColors.secondary }}></div><span className="font-mono text-xs">{school.brandColors.secondary}</span></div>}
                           {!school.brandColors?.primary && !school.brandColors?.secondary && <p className="text-sm text-muted-foreground">No brand colors set.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        {canManage && <SchoolDialog mode="edit" school={school} open={isSchoolDialogOpen} onOpenChange={setIsSchoolDialogOpen} />}
        </>
    );
}
