
'use client';

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Person } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PersonCardProps {
    person: Person;
    onEdit: () => void;
    onDelete: () => void;
    isAdmin: boolean;
}

export function PersonCard({ person, onEdit, onDelete, isAdmin }: PersonCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={person.profileImageUrl} alt={`${person.firstName} ${person.lastName}`} />
                            <AvatarFallback className="text-xl">{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg">
                                <Link href={`/people/${person.personId}`} className="hover:underline">
                                    {person.firstName} {person.lastName}
                                </Link>
                            </CardTitle>
                            <CardDescription className="truncate">{person.email}</CardDescription>
                        </div>
                    </div>
                     {isAdmin && <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 -mr-2 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{person.activeRole}</Badge>
                    {person.roles.length > 1 && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                                    +{person.roles.length - 1} more
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <ul className="list-disc list-inside">
                                    {person.roles.filter(r => r !== person.activeRole).map(role => (
                                    <li key={role} className="capitalize">{role}</li>
                                    ))}
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
