
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

  const role = person.activeRole || person.roles[0] || 'Player';

  switch (role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Sportsmaster':
      return <SportsmasterDashboard />;
    case 'Coach':
    case 'Assistant Coach':
    case 'Captain':
    case 'Player': // Player dashboard is similar to Coach for now
      return <CoachDashboard />;
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
    default:
      // A safe default for any other roles
      return <CoachDashboard />;
  }
}
