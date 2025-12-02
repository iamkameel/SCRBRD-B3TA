'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FixtureCentreCard } from '@/components/fixture-centre-card';
import DashboardSkeleton from '@/app/loading';
import { getMatches } from '@/lib/actions/matches';
import type { Match } from '@/lib/data';

export default function SpectatorDashboard() {
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getMatches().then(fetchedMatches => {
      setMatches(fetchedMatches);
      setLoading(false);
    }).catch(error => {
      console.error("Failed to load matches for spectator:", error);
      setLoading(false);
    });
  }, []);
  
  if (loading) {
      return <DashboardSkeleton />;
  }
  
  const now = new Date();
  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingFixtures = matches.filter(m => m.status === 'scheduled' && m.dateTime > now).slice(0, 5);
  const recentResults = matches.filter(m => m.status === 'completed').slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Spectator Dashboard</h1>
        <p className="text-sm opacity-90">Welcome! Follow the action and see the latest results.</p>
      </header>
      <FixtureCentreCard 
        liveMatches={liveMatches}
        upcomingFixtures={upcomingFixtures}
        recentResults={recentResults}
      />
    </div>
  );
}
