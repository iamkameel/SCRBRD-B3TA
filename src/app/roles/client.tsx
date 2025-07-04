
'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_GROUPS } from '@/lib/roles';
import { Users } from 'lucide-react';

export default function RolesClient() {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">User Roles & Responsibilities</h1>
                <p className="text-muted-foreground">
                    An overview of each role available in the system and their key responsibilities.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Role Directory</CardTitle>
                    <CardDescription>
                        Click on a role group to see the specific roles and what they can do.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full" defaultValue={ROLE_GROUPS.map(g => g.group)}>
                        {ROLE_GROUPS.map(group => (
                             <AccordionItem value={group.group} key={group.group}>
                                <AccordionTrigger>{group.group}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4">
                                        {group.roles.map(role => (
                                            <div key={role.id} className="p-4 border rounded-md bg-muted/50">
                                                <h4 className="font-semibold">{role.label}</h4>
                                                <p className="text-sm text-muted-foreground">{role.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
