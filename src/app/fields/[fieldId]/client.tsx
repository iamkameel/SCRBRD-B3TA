
'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Building, MapPin, Map, Maximize, Wind, Check } from 'lucide-react';
import type { Field, Match } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export default function FieldDetailsClient({ field, matches }: { field: Field, matches: Match[] }) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true) }, []);

    const upcomingMatches = matches.filter(m => m.status === 'scheduled');
    const pastMatches = matches.filter(m => m.status === 'completed');

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
        <div>
            <p className="font-semibold flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</p>
            <p className="text-muted-foreground ml-6">{value || 'N/A'}</p>
        </div>
    );
    
    const ListItem = ({ children }: { children: React.ReactNode }) => (
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {children}</li>
    );

    return (
        <div className="flex flex-col gap-8">
             <header>
                <Link href="/fields" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Fields
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{field.name}</h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                           {field.schoolName ? (
                                <span className="flex items-center gap-1.5"><Building className="h-4 w-4"/>{field.schoolName}</span>
                            ) : (
                                <span className="text-primary flex items-center gap-1.5"><MapPin className="h-4 w-4"/>Independent Venue</span>
                            )}
                        </p>
                    </div>
                     <Badge variant={field.status === 'Available' ? 'default' : (field.status === 'Maintenance' ? 'outline' : 'destructive')} className="capitalize h-fit">{field.status}</Badge>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Field Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={Map} label="Location" value={field.location} />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Wind className="h-4 w-4 text-muted-foreground" /> Facilities</h4>
                                    {field.facilities && field.facilities.length > 0 ? (
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                                            {field.facilities.map(f => <ListItem key={f}>{f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</ListItem>)}
                                        </ul>
                                    ) : (<p className="text-sm text-muted-foreground ml-6">No facilities listed.</p>)}
                                </div>
                                <div>
                                     <h4 className="font-semibold flex items-center gap-2 mb-2"><Check className="h-4 w-4 text-muted-foreground" /> Amenities</h4>
                                    {field.amenities && field.amenities.length > 0 ? (
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                                            {field.amenities.map(a => <ListItem key={a}>{a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</ListItem>)}
                                        </ul>
                                    ) : (<p className="text-sm text-muted-foreground ml-6">No amenities listed.</p>)}
                                </div>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem icon={Wind} label="Surface Type" value={field.surfaceType} />
                                <DetailItem icon={Maximize} label="Field Size" value={field.size} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Matches</CardTitle>
                            <CardDescription>Matches scheduled to be played at this venue.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Match</TableHead>
                                        <TableHead>Competition</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {upcomingMatches.length > 0 ? (
                                        upcomingMatches.map(match => (
                                            <TableRow key={match.matchId}>
                                                <TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell>
                                                <TableCell>{match.competitionName}</TableCell>
                                                <TableCell className="text-right">{isClient ? format(match.dateTime, 'PPP') : ''}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">No upcoming matches at this venue.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Past Matches</CardTitle>
                            <CardDescription>Recently completed matches played at this venue.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Match</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {pastMatches.length > 0 ? (
                                        pastMatches.map(match => (
                                            <TableRow key={match.matchId}>
                                                <TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell>
                                                <TableCell>{match.result || 'Result N/A'}</TableCell>
                                                <TableCell className="text-right">{isClient ? format(match.dateTime, 'PPP') : ''}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">No past matches found for this venue.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Grounds-Keepers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {field.assignments && field.assignments.length > 0 ? (
                                <ul className="space-y-3">
                                    {field.assignments.map(a => (
                                        <li key={a.assignmentId} className="flex items-center gap-3">
                                             <Avatar className="h-9 w-9">
                                                <AvatarFallback>{a.personName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{a.personName}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No grounds-keepers assigned.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
