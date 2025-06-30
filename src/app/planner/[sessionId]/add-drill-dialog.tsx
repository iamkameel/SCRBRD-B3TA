
'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Drill, TrainingSession } from "@/lib/data";
import { PlusCircle, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDrillToSessionAction } from "@/lib/actions/sessions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AddDrillDialogProps {
  sessionId: string;
  drillLibrary: Drill[];
  sessionDrills: TrainingSession['drills'];
}

export function AddDrillDialog({ sessionId, drillLibrary, sessionDrills }: AddDrillDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [addingDrillId, setAddingDrillId] = React.useState<string | null>(null);

  const handleAddDrill = (drillId: string) => {
    setAddingDrillId(drillId);
    startTransition(async () => {
      try {
        await addDrillToSessionAction({ sessionId, drillId });
        toast({ title: "Drill Added", description: "The drill has been added to your session plan." });
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not add drill.", variant: "destructive" });
      } finally {
        setAddingDrillId(null);
        // Closing the dialog on successful add can be a good UX
        // setOpen(false); 
      }
    });
  };

  const sessionDrillIds = new Set(sessionDrills.map(d => d.drillId));

  const filteredLibrary = drillLibrary.filter(drill =>
    drill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Drill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Drill to Session</DialogTitle>
          <DialogDescription>Select drills from the library to add to this training session.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drill library..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLibrary.length > 0 ? (
                filteredLibrary.map((drill) => (
                  <TableRow key={drill.drillId}>
                    <TableCell className="font-medium">{drill.name}</TableCell>
                    <TableCell><Badge variant="outline">{drill.category}</Badge></TableCell>
                    <TableCell>{drill.duration} mins</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAddDrill(drill.drillId)}
                        disabled={isPending || sessionDrillIds.has(drill.drillId)}
                      >
                        {addingDrillId === drill.drillId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {sessionDrillIds.has(drill.drillId) ? 'Added' : 'Add'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No drills found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
