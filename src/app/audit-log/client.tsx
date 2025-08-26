
'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatAction(action: string) {
    return action.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function AuditLogClient({ initialLogs }: { initialLogs: AuditLog[] }) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredLogs = React.useMemo(() => {
        if (!searchTerm) return initialLogs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return initialLogs.filter(log =>
            log.actorName.toLowerCase().includes(lowercasedFilter) ||
            log.action.toLowerCase().includes(lowercasedFilter) ||
            log.target.name?.toLowerCase().includes(lowercasedFilter)
        );
    }, [initialLogs, searchTerm]);

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
                <p className="text-muted-foreground">A chronological record of key administrative actions in the system.</p>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Event History</CardTitle>
                            <CardDescription>Showing the most recent events first.</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user, action, or target..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[70vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>When</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => (
                                        <TableRow key={log.logId}>
                                            <TableCell className="font-medium">{log.actorName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{formatAction(log.action)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-semibold">{log.target.name || log.target.id}</p>
                                                <p className="text-xs text-muted-foreground">{log.target.type}</p>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {searchTerm ? 'No logs match your search.' : 'No audit logs found.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
