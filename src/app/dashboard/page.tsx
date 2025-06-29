
'use client';
import * as React from 'react';

import { useAuth } from '@/lib/auth-context';
import { getOfficialAssignmentsForPerson, getMatches } from '@/lib/actions/matches';
import { getAssignmentsForDriver } from '@/lib/actions/transport';
import AdminDashboard from '@/app/dashboards/admin-dashboard';
import UmpireScorerDashboard from '@/app/dashboards/umpire-scorer-dashboard';
import DriverDashboard from '@/app/dashboards/driver-dashboard';
import MedicalDashboard from '@/app/dashboards/medical-dashboard';
import DashboardSkeleton from '../loading';
import type { Match, Official, FullTransportAssignment } from '@/lib/data';

export default function DashboardPage() {
  const { person } = useAuth();
  const [userDashboard, setUserDashboard] = React.useState<React.ReactNode>(<DashboardSkeleton />);

  React.useEffect(() => {
    const determineDashboard = async () => {
      if (!person) {
        // Default to AdminDashboard for guests or if person data isn't loaded yet.
        // In a real app, this might be a different public-facing dashboard.
        setUserDashboard(<AdminDashboard />);
        return;
      }
      
      const medicalRoles = ['Doctor', 'Physio', 'First Aid', 'Trainer'];
      const isMedicalStaff = person.roles.some(role => medicalRoles.includes(role));

      if (person.activeRole === 'Admin') {
        setUserDashboard(<AdminDashboard />);
      } else if (person.activeRole === 'Umpire' || person.activeRole === 'Scorer') {
        const assignments = await getOfficialAssignmentsForPerson(person.personId);
        setUserDashboard(<UmpireScorerDashboard assignments={assignments} />);
      } else if (person.activeRole === 'Driver') {
        const assignments = await getAssignmentsForDriver(person.personId);
        setUserDashboard(<DriverDashboard assignments={assignments} />);
      } else if (isMedicalStaff) {
        const upcomingMatches = await getMatches().then(matches => matches.filter(m => m.status === 'scheduled'));
        setUserDashboard(<MedicalDashboard matches={upcomingMatches} />);
      } else {
        // Default for any other role (Player, Coach etc)
        setUserDashboard(<AdminDashboard />);
      }
    };
    
    determineDashboard();
  }, [person]);

  return <>{userDashboard}</>;
}
