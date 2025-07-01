
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
import { Badge } from "@/components/ui/badge";
import type { School } from "@/lib/data";

interface SchoolCardProps {
    school: School;
    onEdit: () => void;
    onDelete: () => void;
    canManage: boolean;
}

export function SchoolCard({ school, onEdit, onDelete, canManage }: SchoolCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <CardTitle className="text-lg">
                            <Link href={`/schools/${school.schoolId}`} className="hover:underline">
                                {school.name}
                            </Link>
                        </CardTitle>
                        <CardDescription>{school.abbreviation}</CardDescription>
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
                    <p>{school.location}</p>
                </div>
            </CardContent>
        </Card>
    );
}
