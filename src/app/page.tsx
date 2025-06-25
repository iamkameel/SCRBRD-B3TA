import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getMatches } from "@/lib/actions/matches";
import { format } from "date-fns";

export default async function DashboardPage() {
  const recentMatches = (await getMatches()).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to your cricket scoring and management dashboard.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Start a New Match</CardTitle>
            <CardDescription>
              Set up teams and get ready to score your next game.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button asChild className="w-full">
              <Link href="/new-match">
                <PlusCircle className="mr-2 h-4 w-4" /> New Match
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Teams</CardTitle>
            <CardDescription>
              Create, view, and edit your cricket teams.
            </CardDescription>
          </CardHeader>
           <CardContent className="flex-grow flex items-end">
             <Button asChild variant="secondary" className="w-full">
              <Link href="/teams">
                View Teams
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Players</CardTitle>
            <CardDescription>
              Manage your player roster and assign players to teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
             <Button asChild variant="secondary" className="w-full">
              <Link href="/players">
                View Players
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
          <CardDescription>
            A list of your recently played or ongoing matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <TableRow key={match.matchId}>
                    <TableCell className="font-medium">
                      <Link href={`/matches/${match.matchId}`} className="hover:underline">
                        {match.teamAName} vs {match.teamBName}
                      </Link>
                    </TableCell>
                    <TableCell>{format(match.dateTime, "PPP")}</TableCell>
                    <TableCell>
                      <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">
                        {match.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No recent matches found.
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
