
import { getOfficialAssignmentsForPerson, getMatches } from '@/lib/actions/matches';
import { getAssignmentsForDriver } from '@/lib/actions/transport';
import AdminDashboard from '@/app/dashboards/admin-dashboard';
import UmpireScorerDashboard from '@/app/dashboards/umpire-scorer-dashboard';
import DriverDashboard from '@/app/dashboards/driver-dashboard';
import MedicalDashboard from '@/app/dashboards/medical-dashboard';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function DashboardPage() {
  const userId = await getUserId();
  
  if (!userId) {
     return <AdminDashboard />;
  }

  const person = await getPerson(userId);
  
  if (!person) {
    // This can happen for a new user whose Firestore doc hasn't been created yet.
    // Show the admin dashboard as a safe default.
    return <AdminDashboard />;
  }

  const medicalRoles = ['Doctor', 'Physio', 'First Aid', 'Trainer'];
  const isMedicalStaff = person.roles.some(role => medicalRoles.includes(role));

  // Use the activeRole to determine which dashboard to show
  if (person.activeRole === 'Admin') {
    return <AdminDashboard />;
  }
  
  if (person.activeRole === 'Umpire' || person.activeRole === 'Scorer') {
    const assignments = await getOfficialAssignmentsForPerson(person.personId);
    return <UmpireScorerDashboard assignments={assignments} />;
  }
  
  if (person.activeRole === 'Driver') {
    const assignments = await getAssignmentsForDriver(person.personId);
    return <DriverDashboard assignments={assignments} />;
  }
  
  if (isMedicalStaff) {
    const upcomingMatches = await getMatches().then(matches => matches.filter(m => m.status === 'scheduled'));
    return <MedicalDashboard matches={upcomingMatches} />;
  }
  
  // Default for any other role (Player, Coach etc) is the Admin dashboard for now
  // In a future iteration, these would have their own specific dashboards.
  return <AdminDashboard />;
}
