'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/data";
import { deleteMatchAction } from "@/lib/actions/matches";

export default function MatchesClient({ matches }: { matches: Match[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedMatch) return;
    startTransition(async () => {
      try {
        await deleteMatchAction(selectedMatch.matchId);
        toast({
          title: "Match Deleted",
          description: `The match between ${selectedMatch.teamAName} and ${selectedMatch.teamBName} has been deleted.`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedMatch(null);
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not delete match.",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setSelectedMatch(null);
      }
    });
  };
  
  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Matches</h1>
            <p className="text-muted-foreground">View all scheduled, live, and completed matches.</p>
          </div>
          <Button asChild><Link href="/new-match">Create New Match</Link></Button>
        </header>

        <Card>
          <CardHeader><CardTitle>Match List</CardTitle><CardDescription>A list of all matches in the system.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length > 0 ? (
                  matches.map((match) => (
                    <TableRow key={match.matchId}>
                      <TableCell className="font-medium">
                        <Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link>
                      </TableCell>
                      <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                      <TableCell>{match.fieldName}</TableCell>
                      <TableCell><Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedMatch(match); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No matches found. Get started by creating a new match.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete this match and all of its associated data (lineups, officials).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMatch(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Match"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
