

'use client';

import * as React from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { format } from "date-fns";
import { ArrowLeft, Building, MapPin, Check, User, Phone, FileText, Wind, Maximize, Star, Edit, Map } from 'lucide-react';
import type { Field, Match, School, Person } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button";
import { FieldDialog } from "../field-dialog";
import { useAuth } from "@/lib/auth-context";

const FieldMap = dynamic(() => import('./map'), { ssr: false });


export default function FieldDetailsClient({ field, matches, schools, groundkeepers }: { field: Field, matches: Match[], schools: School[], groundkeepers: Person[] }) {
    const { person: currentUser } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const upcomingMatches = matches.filter(m => m.status === 'scheduled');
    const pastMatches = matches.filter(m => m.status === 'completed');

    const canManage = currentUser?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
        <div>
            <p className="font-semibold flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</p>
            <p className="text-muted-foreground ml-6">{value || 'N/A'}</p>
        </div>
    );
    
    const ListItem = ({ children, itemKey }: { children: React.ReactNode; itemKey: string; }) => (
        <li key={itemKey} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {children}</li>
    );
    
    const InfoBlock = ({ label, value, icon: Icon, href }: { label: string, value?: string | number, icon: React.ElementType, href?: string }) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">
                        {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</a> : value}
                    </p>
                </div>
            </div>
        );
    };

    const hasCoordinates = field.coordinates && field.coordinates.lat && field.coordinates.lon;
    
    return (
        <>
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
                    <div className="flex items-center gap-2">
                        <Badge variant={field.status === 'Available' ? 'default' : (field.status === 'Maintenance' ? 'outline' : 'destructive')} className="capitalize h-fit">{field.status}</Badge>
                        {canManage && (
                            <Button onClick={() => setIsEditDialogOpen(true)}>
                                <Edit className="mr-2 h-4 w-4"/>
                                Edit Field
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader><CardTitle>Venue Gallery</CardTitle></CardHeader>
                        <CardContent>
                            {field.imageUrls && field.imageUrls.length > 0 ? (
                                <Carousel className="w-full">
                                    <CarouselContent>
                                        {field.imageUrls.map((url, index) => (
                                            <CarouselItem key={index}>
                                                <div className="aspect-video relative">
                                                    <Image src={url} alt={`Venue image ${index + 1}`} fill className="rounded-lg object-cover" />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            ) : (
                                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                                    <p>No images have been uploaded for this venue yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Field Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={MapPin} label="Location" value={field.location} />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Check className="h-4 w-4 text-muted-foreground" /> Facilities</h4>
                                    {field.facilities && field.facilities.length > 0 ? (
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                                            {field.facilities.map((f, i) => <ListItem key={`${f}-${i}`} itemKey={`${f}-${i}`}>{f.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</ListItem>)}
                                        </ul>
                                    ) : (<p className="text-sm text-muted-foreground ml-6">No facilities listed.</p>)}
                                </div>
                                <div>
                                     <h4 className="font-semibold flex items-center gap-2 mb-2"><Check className="h-4 w-4 text-muted-foreground" /> Amenities</h4>
                                    {field.amenities && field.amenities.length > 0 ? (
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                                            {field.amenities.map((a, i) => <ListItem key={`${a}-${i}`} itemKey={`${a}-${i}`}>{a.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</ListItem>)}
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
                        <CardHeader><CardTitle>Upcoming Matches</CardTitle><CardDescription>Matches scheduled to be played at this venue.</CardDescription></CardHeader>
                        <CardContent><Table><TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Competition</TableHead><TableHead className="text-right">Date</TableHead></TableRow></TableHeader><TableBody>{upcomingMatches.length > 0 ? (upcomingMatches.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{match.competitionName}</TableCell><TableCell className="text-right">{format(match.dateTime, 'PPP')}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No upcoming matches at this venue.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Past Matches</CardTitle><CardDescription>Recently completed matches played at this venue.</CardDescription></CardHeader>
                        <CardContent><Table><TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Date</TableHead></TableRow></TableHeader><TableBody>{pastMatches.length > 0 ? (pastMatches.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{match.result || 'Result N/A'}</TableCell><TableCell className="text-right">{format(match.dateTime, 'PPP')}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No past matches found for this venue.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {hasCoordinates ? (
                                <div className="h-64 w-full rounded-lg overflow-hidden border">
                                    <FieldMap center={[field.coordinates!.lat, field.coordinates!.lon]} popupText={field.name} />
                                </div>
                            ) : (
                                <div className="h-64 w-full rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-center p-4">
                                <p>No coordinates have been set for this venue.</p>
                                </div>
                            )}
                             <Button asChild className="w-full" disabled={!hasCoordinates}>
                                <a href={`https://www.google.com/maps?q=${field.coordinates?.lat},${field.coordinates?.lon}`} target="_blank" rel="noopener noreferrer">
                                    <Map className="mr-2"/>
                                    View on Google Maps
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Venue Operations</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                           <InfoBlock label="Contact Person" value={field.contactPerson} icon={User} />
                           <InfoBlock label="Contact Phone" value={field.contactPhone} icon={Phone} href={`tel:${field.contactPhone}`} />
                           
                             {!(field.contactPerson || field.contactPhone) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No contact information available.</p>
                             )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Assigned Grounds-Keepers</CardTitle></CardHeader>
                        <CardContent>{field.assignments && field.assignments.length > 0 ? (<ul className="space-y-3">{field.assignments.map(a => (<li key={a.assignmentId} className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback>{a.personName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><span className="font-medium">{a.personName}</span></li>))}</ul>) : (<p className="text-sm text-muted-foreground text-center py-4">No grounds-keepers assigned.</p>)}</CardContent>
                    </Card>
                </div>
            </div>
        </div>
        {canManage && <FieldDialog mode="edit" field={field} schools={schools} groundkeepers={groundkeepers} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />}
        </>
    )
}
