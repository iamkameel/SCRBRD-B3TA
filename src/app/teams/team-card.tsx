
'use client';

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Team } from "@/lib/data";

interface TeamCardProps {
    team: Team;
    onEdit: () => void;
    onDelete: () => void;
    canManage: boolean;
}

export function TeamCard({ team, onEdit, onDelete, canManage }: TeamCardProps) {
    return (
        <Card className="flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div style={{ backgroundColor: team.teamColors?.primary || 'hsl(var(--muted))' }} className="flex-1"></div>
                <div style={{ backgroundColor: team.teamColors?.secondary || 'hsl(var(--muted))' }} className="flex-1"></div>
            </div>
            <CardHeader className="pt-4">
                 <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                         <CardTitle className="text-lg">
                            <Link href={`/teams/${team.teamId}`} className="hover:underline">
                                {team.name}
                            </Link>
                         </CardTitle>
                         <CardDescription>
                            {team.alias && <span className="font-medium text-foreground">{team.alias} &bull; </span>}
                            {team.schoolName}
                        </CardDescription>
                    </div>
                     {canManage && <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Division:</strong> {team.divisionName}</p>
                    <p><strong>Season:</strong> {team.seasonName}</p>
                    {team.teamClass && <p><strong>Class:</strong> {team.teamClass}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
