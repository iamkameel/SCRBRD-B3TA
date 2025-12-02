
'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardSkeleton from '@/app/loading';
import Link from 'next/link';

import AdminDashboard from '@/app/dashboards/admin-dashboard';
import CoachDashboard from '@/app/dashboards/coach-dashboard';
import DriverDashboard from '@/app/dashboards/driver-dashboard';
import GroundskeeperDashboard from '@/app/dashboards/groundskeeper-dashboard';
import GuardianDashboard from '@/app/dashboards/guardian-dashboard';
import MedicalDashboard from '@/app/dashboards/medical-dashboard';
import SportsmasterDashboard from '@/app/dashboards/sportsmaster-dashboard';
import TrainerDashboard from '@/app/dashboards/trainer-dashboard';
import UmpireScorerDashboard from '@/app/dashboards/umpire-scorer-dashboard';
import SpectatorDashboard from '@/app/dashboards/spectator-dashboard';
import PlayerDashboard from '@/app/dashboards/player-dashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User } from 'lucide-react';

function WelcomeCard() {
    return (
        <Card className="w-full max-w-lg mx-auto mt-16">
            <CardHeader className="text-center items-center">
                 <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <User className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Welcome to SCRBRD!</CardTitle>
                <CardDescription>Let's get your profile set up so you can get started.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                    Your profile is incomplete. Please go to your settings to add your name and confirm your role.
                </p>
                <Button asChild>
                    <Link href="/settings">
                        Go to Settings <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}


export default function DashboardPage() {
  const { person } = useAuth();

  // The loading state is now handled by the PageShell component,
  // so we can assume `person` is loaded here.

  if (!person) {
    // This case should ideally not be hit if the user is on the dashboard
    // as PageShell would have redirected them. But as a fallback:
    return <WelcomeCard />;
  }

  // Check for incomplete profile
  const isProfileIncomplete = !person.firstName || !person.lastName || person.roles.length === 0;
  if (isProfileIncomplete) {
      return <WelcomeCard />;
  }


  const role = person.activeRole || person.roles[0] || 'Spectator';

  switch (role) {
    case 'System Architect':
    case 'Admin':
      return <AdminDashboard />;
    case 'Sportsmaster':
      return <SportsmasterDashboard />;
    case 'Coach':
    case 'Team Manager':
      return <CoachDashboard />;
    case 'Player':
    case 'Assistant Coach':
    case 'Captain':
       return <PlayerDashboard />;
    case 'Umpire':
    case 'Scorer':
      return <UmpireScorerDashboard />;
    case 'Driver':
      return <DriverDashboard />;
    case 'Grounds-Keeper':
      return <GroundskeeperDashboard />;
    case 'Guardian':
      return <GuardianDashboard />;
    case 'Trainer':
      return <TrainerDashboard />;
    case 'First Aid':
    case 'Doctor':
    case 'Physiotherapist':
      return <MedicalDashboard />;
    case 'Spectator':
    case 'School Admin':
      return <SpectatorDashboard />;
    default:
      // A safe default for any other roles
      return <SpectatorDashboard />;
  }
}
