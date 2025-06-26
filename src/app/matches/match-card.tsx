
'use client';

import Link from "next/link";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Edit, Calendar, Clock } from "lucide-react";

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

interface MatchCardProps {
    match: Match;
    onEdit: () => void;
    onDelete: () => void;
}

export function MatchCard({ match, onEdit, onDelete }: MatchCardProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize mb-2">{match.status}</Badge>
                        <CardTitle className="text-lg">
                             <Link href={`/matches/${match.matchId}`} className="hover:underline leading-tight">{match.teamAName} vs {match.teamBName}</Link>
                        </CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{format(match.dateTime, "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{format(match.dateTime, "p")} at {match.fieldName}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
