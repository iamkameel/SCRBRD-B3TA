
'use client';

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Edit, Building, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Field } from "@/lib/data";

interface FieldCardProps {
    field: Field;
    onEdit: () => void;
    onDelete: () => void;
}

export function FieldCard({ field, onEdit, onDelete }: FieldCardProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <CardTitle className="text-lg">
                             <Link href={`/fields/${field.fieldId}`} className="hover:underline">
                                {field.name}
                            </Link>
                        </CardTitle>
                        <CardDescription>
                            {field.schoolName ? (
                                <span className="flex items-center gap-1.5 text-xs"><Building className="h-3 w-3"/>{field.schoolName}</span>
                            ) : (
                                <span className="text-primary text-xs flex items-center gap-1.5"><MapPin className="h-3 w-3"/>Independent</span>
                            )}
                        </CardDescription>
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
            <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
                 <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Status:</strong> <Badge variant={field.status === 'Available' ? 'secondary' : (field.status === 'Maintenance' ? 'outline' : 'destructive')} className="capitalize text-xs">{field.status}</Badge></p>
                    <p><strong>Staff:</strong> {field.assignments?.length || 0} assigned</p>
                </div>
            </CardContent>
        </Card>
    );
}
