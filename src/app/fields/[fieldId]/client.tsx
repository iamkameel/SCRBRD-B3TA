
'use client';

import * as React from "react";
import dynamic from "next/dynamic";
import Link from 'next/link';
import { ArrowLeft, Building, MapPin, Check, User, Phone, FileText, Wind, Maximize, Star } from 'lucide-react';
import type { Field, Match } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FieldMap = React.useMemo(() => dynamic(() => import('./field-map'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-md" />
}), []);


export default function FieldDetailsClient({ field, matches }: { field: Field, matches: Match[] }) {
    const upcomingMatches = matches.filter(m => m.status === 'scheduled');
    const pastMatches = matches.filter(m => m.status === 'completed');

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
        <div>
            <p className="font-semibold flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</p>
            <p className="text-muted-foreground ml-6">{value || 'N/A'}</p>
        </div>
    );
    
    const ListItem = ({ children, itemKey }: { children: React.ReactNode; itemKey: string; }) => (
        <li key={itemKey} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {children}</li>
    );
    
    const InfoBlock = ({ label, value, icon: Icon }: { label: string, value?: string | number, icon: React.ElementType }) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8">
             <header>
                <Link href="/fields" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Fields
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{field.name}</h1>
                         {field.alias && <p className="text-lg text-muted-foreground -mt-1">{field.alias}</p>}
                        <p className="text-muted-foreground mt-2 flex items-center gap-2">
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
                            <DetailItem icon={MapPin} label="Location" value={field.location} />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Check className="h-4 w-4 text-muted-foreground" /> Facilities</h4>
                                    {field.facilities && field.facilities.length > 0 ? (
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                                            {field.facilities.map((f, i) => <ListItem key={`${f}-${i}`} itemKey={`${f}-${i}`}>{f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</ListItem>)}
                                        </ul>
                                    ) : (<p className="text-sm text-muted-foreground ml-6">No facilities listed.</p>)}
                                </div>
                                <div>
                                     <h4 className="font-semibold flex items-center gap-2 mb-2"><Check className="h-4 w-4 text-muted-foreground" /> Amenities</h4>
                                    {field.amenities && field.amenities.length > 0 ? (
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                                            {field.amenities.map((a, i) => <ListItem key={`${a}-${i}`} itemKey={`${a}-${i}`}>{a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</ListItem>)}
                                        </ul>
                                    ) : (<p className="text-sm text-muted-foreground ml-6">No amenities listed.</p>)}
                                </div>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem icon={Wind} label="Pitch Type" value={field.pitchType} />
                                <DetailItem icon={Maximize} label="Field Size" value={field.size} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Surface Condition</CardTitle></CardHeader>
                        <CardContent>
                            {field.surfaceCondition ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">Overall Rating:</p>
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={cn("h-5 w-5", i < field.surfaceCondition!.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                                            ))}
                                        </div>
                                        <span className="font-bold">{field.surfaceCondition.rating}/5</span>
                                    </div>
                                    {field.surfaceCondition.details && Object.keys(field.surfaceCondition.details).length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mt-4 mb-2">Details:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                {Object.entries(field.surfaceCondition.details).map(([key, value]) => (
                                                    <li key={key}>
                                                        <span className="font-medium text-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {field.notes && <InfoBlock label="Groundskeeper Notes" value={field.notes} icon={FileText} />}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No surface condition data available.</p>
                            )}
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
                                                <TableCell className="text-right">{format(match.dateTime, 'PPP')}</TableCell>
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
                                                <TableCell className="text-right">{format(match.dateTime, 'PPP')}</TableCell>
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
                     {field.coordinates?.lat && field.coordinates?.lon && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Map Location</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80 w-full p-0 relative">
                                <FieldMap coords={field.coordinates} fieldName={field.name} />
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle>Venue Operations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <InfoBlock label="Contact Person" value={field.contactPerson} icon={User} />
                           <InfoBlock label="Contact Phone" value={field.contactPhone} icon={Phone} />
                           
                             {!(field.contactPerson || field.contactPhone) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No contact information available.</p>
                             )}
                        </CardContent>
                    </Card>
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
