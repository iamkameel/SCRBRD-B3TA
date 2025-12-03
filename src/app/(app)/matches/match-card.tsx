
'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Edit, Calendar, Clock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MatchCardProps {
    match: Match;
    onEdit: () => void;
    onDelete: () => void;
    onAssignScorer: () => void;
    isAdmin: boolean;
    canAssignScorer: boolean;
}

export function MatchCard({ match, onEdit, onDelete, onAssignScorer, isAdmin, canAssignScorer }: MatchCardProps) {
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize mb-2">{match.status}</Badge>
                        <CardTitle className="text-lg">
                             <Link href={`/matches/${match.matchId}`} className="hover:underline leading-tight block">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName[0]}</AvatarFallback></Avatar>
                                    <span className="truncate">{match.teamAName}</span>
                                </div>
                                <div className="text-xs text-muted-foreground font-normal pl-8 my-0.5">vs</div>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
                                    <span className="truncate">{match.teamBName}</span>
                                </div>
                             </Link>
                        </CardTitle>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canAssignScorer && <DropdownMenuItem onSelect={onAssignScorer}><User className="mr-2 h-4 w-4" /> Assign Scorer</DropdownMenuItem>}
                            {isAdmin && <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                            {isAdmin && <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{isClient ? format(match.dateTime, "PPP") : '\u00A0'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{isClient ? format(match.dateTime, "p") : '\u00A0'} at {match.fieldName}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
