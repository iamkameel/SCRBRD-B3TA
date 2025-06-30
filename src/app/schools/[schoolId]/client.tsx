
'use client';

import * as React from "react";
import Link from 'next/link';
import { ArrowLeft, Building, Globe, Phone, Users, User, Palette, Calendar, Facebook, Twitter, Instagram, Youtube, ClipboardList } from 'lucide-react';
import type { School, Team, Person } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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


export default function SchoolDetailsClient({ school, teams, staff, players }: { school: School, teams: Team[], staff: Person[], players: Person[] }) {
    
    const socialLinks = school.socialMedia ? Object.entries(school.socialMedia).filter(([, link]) => link) : [];

    return (
        <div className="flex flex-col gap-8">
            <header>
                <Link href="/schools" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Schools
                </Link>
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={school.logoUrl} alt={school.name} />
                        <AvatarFallback className="text-3xl">{school.abbreviation || school.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{school.name}</h1>
                        {school.abbreviation && <p className="text-lg text-muted-foreground">{school.abbreviation}</p>}
                        {school.motto && <p className="text-md italic text-muted-foreground mt-1">"{school.motto}"</p>}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Total Teams" value={teams.length} icon={Users} />
                        <StatCard title="Active Players" value={players.length} icon={User} />
                        <StatCard title="Total Staff" value={staff.length} icon={User} />
                        <StatCard title="Fixtures This Season" value={0} icon={ClipboardList} />
                     </div>

                     <Tabs defaultValue="teams" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="teams">Teams</TabsTrigger>
                            <TabsTrigger value="staff">Staff</TabsTrigger>
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
                                <CardHeader><CardTitle>Assigned Staff</CardTitle><CardDescription>All staff members assigned to {school.name}.</CardDescription></CardHeader>
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
                        <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
                        <CardContent className="flex items-center gap-4">
                           {school.brandColors?.primary && <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full border" style={{ backgroundColor: school.brandColors.primary }}></div><span className="font-mono text-sm">{school.brandColors.primary}</span></div>}
                           {school.brandColors?.secondary && <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full border" style={{ backgroundColor: school.brandColors.secondary }}></div><span className="font-mono text-sm">{school.brandColors.secondary}</span></div>}
                           {!school.brandColors?.primary && !school.brandColors?.secondary && <p className="text-sm text-muted-foreground">No brand colors set.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
