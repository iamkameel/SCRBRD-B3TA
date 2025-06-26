import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMatches } from "@/lib/actions/matches";
import { getLeaderboards, getTeamStandings } from "@/lib/actions/dashboard";
import { format } from "date-fns";
import { TeamStandingsChart, TopRunScorersChart, TopWicketTakersChart } from "./dashboard-charts";

export default async function DashboardPage() {
  const [recentMatches, { topRunScorers, topWicketTakers }, teamStandings] = await Promise.all([
    getMatches().then(matches => matches.slice(0, 5)),
    getLeaderboards(),
    getTeamStandings()
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to your cricket league overview.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Team Standings</CardTitle>
                    <CardDescription>Season leaderboard based on wins and Net Run Rate.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <TeamStandingsChart data={teamStandings} />
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Pos</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead className="text-right">Played</TableHead>
                                <TableHead className="text-right">Won</TableHead>
                                <TableHead className="text-right">Lost</TableHead>
                                <TableHead className="text-right">NRR</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamStandings.length > 0 ? (
                            teamStandings.map((team, index) => (
                              <TableRow key={team.teamId}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>
                                  <Link href={`/teams/${team.teamId}`} className="font-medium hover:underline">{team.name}</Link>
                                </TableCell>
                                <TableCell className="text-right">{team.stats.matchesPlayed}</TableCell>
                                <TableCell className="text-right">{team.stats.matchesWon}</TableCell>
                                <TableCell className="text-right">{team.stats.matchesLost}</TableCell>
                                <TableCell className="text-right">{team.stats.netRunRate.toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No team stats available. Complete some matches to see standings.</TableCell></TableRow>
                          )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
          <Tabs defaultValue="batting">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription>Season leaders in key categories.</CardDescription>
                   <TabsList>
                      <TabsTrigger value="batting">Batting</TabsTrigger>
                      <TabsTrigger value="bowling">Bowling</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="batting">
                   <div className="space-y-4">
                     <TopRunScorersChart data={topRunScorers} />
                     {topRunScorers.length > 0 ? topRunScorers.map((player) => (
                       <div key={player.personId} className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={player.profileImageUrl} />
                            <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Link href={`/players/${player.personId}`} className="font-semibold hover:underline">{player.firstName} {player.lastName}</Link>
                            <p className="text-sm text-muted-foreground">Avg: {player.stats.battingAverage.toFixed(2)} | SR: {player.stats.strikeRate.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-lg">{player.stats.totalRuns}</p>
                             <p className="text-xs text-muted-foreground">Runs</p>
                          </div>
                       </div>
                     )) : <p className="text-sm text-center text-muted-foreground py-8">No batting stats yet.</p>}
                   </div>
                </TabsContent>
                 <TabsContent value="bowling">
                   <div className="space-y-4">
                     <TopWicketTakersChart data={topWicketTakers} />
                     {topWicketTakers.length > 0 ? topWicketTakers.map((player) => (
                       <div key={player.personId} className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={player.profileImageUrl} />
                            <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                             <Link href={`/players/${player.personId}`} className="font-semibold hover:underline">{player.firstName} {player.lastName}</Link>
                             <p className="text-sm text-muted-foreground">Avg: {player.stats.bowlingAverage.toFixed(2)} | Econ: {player.stats.economyRate.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-lg">{player.stats.wicketsTaken}</p>
                              <p className="text-xs text-muted-foreground">Wickets</p>
                          </div>
                       </div>
                     )) : <p className="text-sm text-center text-muted-foreground py-8">No bowling stats yet.</p>}
                   </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Recent & Upcoming Matches</CardTitle>
          <CardDescription>
            A list of your most recent and scheduled matches.
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
                    <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
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
                    No recent matches found. <Link href="/new-match" className="text-primary underline">Create one now</Link>.
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
