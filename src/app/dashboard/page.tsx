
'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardSkeleton from '@/app/loading';

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

export default function DashboardPage() {
  const { person, loading } = useAuth();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!person) {
    return (
        <div className="flex items-center justify-center h-full">
            <p>User profile not found. Please log in again.</p>
        </div>
    );
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
