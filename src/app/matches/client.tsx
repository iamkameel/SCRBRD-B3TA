'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/data";

export default function MatchesClient({ matches }: { matches: Match[] }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Matches
          </h1>
          <p className="text-muted-foreground">
            View all scheduled, live, and completed matches.
          </p>
        </div>
        <Button asChild>
          <Link href="/new-match">Create New Match</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Match List</CardTitle>
          <CardDescription>A list of all matches in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length > 0 ? (
                matches.map((match) => (
                  <TableRow key={match.matchId}>
                    <TableCell className="font-medium">
                      <Link href={`/matches/${match.matchId}`} className="hover:underline">
                        {match.teamAName} vs {match.teamBName}
                      </Link>
                    </TableCell>
                    <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                    <TableCell>{match.fieldName}</TableCell>
                    <TableCell>
                      <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">
                        {match.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No matches found. Get started by creating a new match.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
