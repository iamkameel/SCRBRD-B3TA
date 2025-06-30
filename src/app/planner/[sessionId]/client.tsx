
'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrainingSession, Drill } from "@/lib/data";
import { AddDrillDialog } from "./add-drill-dialog";
import { removeDrillFromSessionAction, updateSessionDrillsOrderAction } from "@/lib/actions/sessions";
import { useToast } from "@/hooks/use-toast";

interface SessionDetailsClientProps {
  session: TrainingSession;
  drillLibrary: Drill[];
}

function SortableDrillItem({ id, drill, category, onRemove, isDeleting }: { id: string; drill: TrainingSession['drills'][0]; category?: string; onRemove: (drillId: string) => void; isDeleting: boolean; }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center bg-card p-3 border rounded-lg shadow-sm">
            <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-2 touch-none">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="flex-1">
                <p className="font-semibold">{drill.name}</p>
                <p className="text-sm text-muted-foreground">{drill.duration} mins</p>
            </div>
            {category && <Badge variant="outline" className="mr-4">{category}</Badge>}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(drill.drillId)}
                disabled={isDeleting}
            >
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
}

export default function SessionDetailsClient({ session, drillLibrary }: SessionDetailsClientProps) {
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const [drills, setDrills] = React.useState(session.drills);

  React.useEffect(() => {
    setDrills(session.drills);
  }, [session.drills]);

  const totalDuration = drills.reduce((sum, drill) => sum + drill.duration, 0);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setDrills((items) => {
            const oldIndex = items.findIndex((item) => item.drillId === active.id);
            const newIndex = items.findIndex((item) => item.drillId === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);

            // Optimistically update UI, then fire and forget server action
            updateSessionDrillsOrderAction({ sessionId: session.sessionId, drills: newOrder })
                .catch(() => {
                    toast({ title: "Error", description: "Failed to save new drill order.", variant: "destructive" });
                    setDrills(items); // Revert on failure
                });
            
            return newOrder;
        });
    }
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
            <CardDescription>Drag and drop the drills to reorder the session plan.</CardDescription>
          </div>
          <AddDrillDialog sessionId={session.sessionId} drillLibrary={drillLibrary} sessionDrills={session.drills} />
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={drills.map(d => d.drillId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {drills.length > 0 ? (
                  drills.map((drill) => (
                    <SortableDrillItem
                      key={drill.drillId}
                      id={drill.drillId}
                      drill={drill}
                      category={drillLibrary.find(d => d.drillId === drill.drillId)?.category}
                      onRemove={handleRemoveDrill}
                      isDeleting={isDeleting}
                    />
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No drills added yet. Click "Add Drill" to build your session plan.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
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
