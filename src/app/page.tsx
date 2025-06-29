
import { getPerson } from '@/lib/actions/players';
import { getOfficialAssignmentsForPerson } from '@/lib/actions/matches';
import { getAssignmentsForDriver } from '@/lib/actions/transport';
import { getMatches } from '@/lib/actions/matches';
import AdminDashboard from './dashboards/admin-dashboard';
import UmpireScorerDashboard from './dashboards/umpire-scorer-dashboard';
import DriverDashboard from './dashboards/driver-dashboard';
import MedicalDashboard from './dashboards/medical-dashboard';
import { getUserId } from '@/lib/auth';

export default async function DashboardPage() {
  const userId = await getUserId();
  if (!userId) {
    // In a real app, you might redirect to a login page.
    // For now, we'll default to the admin dashboard for guests.
    return <AdminDashboard />;
  }
  
  const user = await getPerson(userId);

  // Fallback for when user data is not yet loaded or for guests
  if (!user) {
    return <AdminDashboard />;
  }

  const medicalRoles = ['Doctor', 'Physio', 'First Aid', 'Trainer'];
  const isMedicalStaff = user.roles.some(role => medicalRoles.includes(role));

  // Role-based routing for dashboards
  if (user.roles.includes('Admin')) {
    return <AdminDashboard />;
  }

  if (user.roles.includes('Umpire') || user.roles.includes('Scorer')) {
    const assignments = await getOfficialAssignmentsForPerson(user.personId);
    return <UmpireScorerDashboard assignments={assignments} />;
  }
  
  if (user.roles.includes('Driver')) {
    const assignments = await getAssignmentsForDriver(user.personId);
    return <DriverDashboard assignments={assignments} />;
  }

  if (isMedicalStaff) {
    const upcomingMatches = await getMatches().then(matches => matches.filter(m => m.status === 'scheduled'));
    return <MedicalDashboard matches={upcomingMatches} />;
  }

  // Default to AdminDashboard for any other roles like Player, Coach etc.
  return <AdminDashboard />;
}
