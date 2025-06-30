
'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TrainingSession, Drill } from "@/lib/data";
import { AddDrillDialog } from "./add-drill-dialog";
import { removeDrillFromSessionAction } from "@/lib/actions/sessions";
import { useToast } from "@/hooks/use-toast";

interface SessionDetailsClientProps {
  session: TrainingSession;
  drillLibrary: Drill[];
}

export default function SessionDetailsClient({ session, drillLibrary }: SessionDetailsClientProps) {
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = React.useTransition();

  const totalDuration = session.drills.reduce((sum, drill) => sum + drill.duration, 0);

  const handleRemoveDrill = (drillIdToRemove: string) => {
    startDeleteTransition(async () => {
      try {
        await removeDrillFromSessionAction(session.sessionId, drillIdToRemove);
        toast({ title: "Drill Removed", description: "The drill has been removed from the session plan." });
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove drill.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/planner" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Planner
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{session.title}</h1>
            <p className="text-muted-foreground mt-1">
              {format(session.date, 'PPP, p')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Focus:</p>
              {session.focus.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
            </div>
            <p className="font-semibold text-sm">Total Duration: {totalDuration} mins</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Session Plan</CardTitle>
            <CardDescription>The sequence of drills for this training session.</CardDescription>
          </div>
          <AddDrillDialog sessionId={session.sessionId} drillLibrary={drillLibrary} sessionDrills={session.drills} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drill Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {session.drills.length > 0 ? (
                session.drills.map((drill) => (
                  <TableRow key={drill.drillId}>
                    <TableCell className="font-medium">{drill.name}</TableCell>
                    <TableCell><Badge variant="outline">{drillLibrary.find(d => d.drillId === drill.drillId)?.category}</Badge></TableCell>
                    <TableCell>{drill.duration} mins</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDrill(drill.drillId)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No drills added yet. Click "Add Drill" to build your session plan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {session.notes && (
        <Card>
            <CardHeader><CardTitle>Session Notes</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
