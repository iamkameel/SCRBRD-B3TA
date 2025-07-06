
'use client';

import * as React from "react";
import Link from 'next/link';
import { MoreHorizontal, Trash2, Edit, Trophy, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Competition } from "@/lib/data";

interface CompetitionCardProps {
    competition: Competition;
    onEdit: () => void;
    onDelete: () => void;
    onAutoSchedule: () => void;
    isAdmin: boolean;
}

export function CompetitionCard({ competition, onEdit, onDelete, onAutoSchedule, isAdmin }: CompetitionCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <CardTitle className="text-lg">
                            <Link href={`/competitions/${competition.competitionId}`} className="hover:underline">
                                {competition.name}
                            </Link>
                        </CardTitle>
                        <CardDescription>{competition.type}{competition.competitionClass ? ` - ${competition.competitionClass}` : ''}</CardDescription>
                    </div>
                    {isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 -mr-2 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={onAutoSchedule} disabled={competition.status === 'Completed'}><Wand2 className="mr-2 h-4 w-4" /> Auto-Schedule</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Season:</strong> {competition.seasonName}</p>
                    <p><strong>Division:</strong> {competition.divisionName}</p>
                </div>
                <div className="flex items-center justify-between">
                     <Badge variant={competition.status === 'Completed' ? 'secondary' : (competition.status === 'In Progress' ? 'default' : 'outline')}>{competition.status}</Badge>
                     {competition.winnerTeamName && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Trophy className="h-3 w-3 text-accent" />
                            <span>{competition.winnerTeamName}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

    
