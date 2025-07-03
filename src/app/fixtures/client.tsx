'use client';

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Match, Team, Competition } from "@/lib/data";
import { FixtureListItem } from './fixture-list-item';

export default function FixturesClient({ fixtures, teams, competitions, isAdmin }: { fixtures: Match[], teams: Team[], competitions: Competition[], isAdmin: boolean }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const filteredFixtures = React.useMemo(() => {
    return fixtures.filter(fixture => {
        return `${fixture.teamAName} ${fixture.teamBName} ${fixture.competitionName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
    });
  }, [fixtures, searchQuery]);

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Fixtures</h1>
            <p className="text-muted-foreground">View all upcoming and live matches.</p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link href="/new-match">
                <PlusCircle className="mr-2" />
                Create New Fixture
              </Link>
            </Button>
          )}
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Upcoming Fixtures</CardTitle>
                <CardDescription>A list of all scheduled and live matches.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by team or competition..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFixtures.length > 0 ? (
                filteredFixtures.map((fixture) => (
                  <FixtureListItem key={fixture.matchId} fixture={fixture} />
                ))
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>{searchQuery ? "No fixtures found matching your search." : "There are no upcoming fixtures."}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
