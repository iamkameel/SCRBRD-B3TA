
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, ClipboardList, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SpectatorDashboard() {
  const { person } = useAuth();
  
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Spectator Dashboard</h1>
        <p className="text-sm opacity-90">Welcome! Follow the action and see the latest results.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList /> View All Matches</CardTitle>
              <CardDescription>See the full schedule of upcoming and completed matches.</CardDescription>
          </CardHeader>
          <CardContent>
              <Link href="/matches" className="text-primary font-semibold hover:underline flex items-center">
                  Go to Matches <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy /> View Rankings</CardTitle>
              <CardDescription>Check out team standings and player leaderboards for the season.</CardDescription>
          </CardHeader>
          <CardContent>
              <Link href="/rankings" className="text-primary font-semibold hover:underline flex items-center">
                  Go to Rankings <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
