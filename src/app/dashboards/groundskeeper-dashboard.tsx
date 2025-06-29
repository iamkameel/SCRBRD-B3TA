'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wrench, MapPin } from 'lucide-react';
import type { Field, Match } from "@/lib/data";
import { updateFieldStatusAction } from '@/lib/actions/fields';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getGroundskeeperDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';

interface GroundskeeperDashboardProps {
  fields: Field[];
  matchesByField: Record<string, Match[]>;
}

function FieldStatusSelector({ fieldId, currentStatus }: { fieldId: string, currentStatus: Field['status'] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [status, setStatus] = React.useState(currentStatus);

    const handleStatusChange = (newStatus: Field['status']) => {
        startTransition(async () => {
            try {
                await updateFieldStatusAction(fieldId, newStatus);
                setStatus(newStatus);
                toast({ title: "Status Updated", description: "The field status has been updated." });
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update status.", variant: "destructive" });
            }
        });
    }

    return (
        <Select onValueChange={handleStatusChange} defaultValue={status} disabled={isPending}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
        </Select>
    );
}

function GroundskeeperDashboardInternal({ fields, matchesByField }: GroundskeeperDashboardProps) {

  const getStatusBadge = (status: Field['status']) => {
      switch(status) {
          case 'Available': return <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">{status}</Badge>;
          case 'Maintenance': return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">{status}</Badge>;
          case 'Closed': return <Badge variant="destructive">{status}</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
      }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Grounds-Keeper Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your assigned fields and view upcoming schedules.
        </p>
      </header>
      
      {fields.length > 0 ? (
        <div className="space-y-8">
            {fields.map(field => (
                <Card key={field.fieldId}>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <Link href={`/fields/${field.fieldId}`} className="hover:underline">
                                  <CardTitle className="flex items-center gap-2"><MapPin /> {field.name}</CardTitle>
                                </Link>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    Current Status: {getStatusBadge(field.status)}
                                </CardDescription>
                            </div>
                            <FieldStatusSelector fieldId={field.fieldId} currentStatus={field.status} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h4 className="font-semibold mb-2">Upcoming Matches</h4>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Match</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Competition</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matchesByField[field.fieldId] && matchesByField[field.fieldId].length > 0 ? (
                                    matchesByField[field.fieldId].map(match => (
                                        <TableRow key={match.matchId}>
                                            <TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell>
                                            <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                                            <TableCell>{match.competitionName}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No upcoming matches scheduled for this field.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="h-48 flex flex-col items-center justify-center text-center">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-semibold">No Fields Assigned</p>
            <p className="text-sm text-muted-foreground">You are not currently assigned to manage any fields.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function GroundskeeperDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<{ fields: Field[], matchesByField: Record<string, Match[]> } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person?.personId) {
      getGroundskeeperDashboardData(person.personId).then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      }).catch(error => {
        console.error("Failed to load groundskeeper dashboard data:", error);
        setLoading(false);
      });
    } else if (person === null) {
      // If there's no person, we can stop loading
      setLoading(false);
    }
  }, [person]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Handle case where data might still be null after loading (e.g., no personId)
  if (!data) {
     return (
        <Card>
          <CardContent className="h-48 flex flex-col items-center justify-center text-center">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-semibold">No Fields Assigned</p>
            <p className="text-sm text-muted-foreground">You are not currently assigned to manage any fields.</p>
          </CardContent>
        </Card>
      )
  }

  return <GroundskeeperDashboardInternal fields={data.fields} matchesByField={data.matchesByField} />;
}
