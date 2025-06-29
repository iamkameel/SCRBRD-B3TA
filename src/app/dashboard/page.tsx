
import { getOfficialAssignmentsForPerson, getMatches } from '@/lib/actions/matches';
import { getAssignmentsForDriver } from '@/lib/actions/transport';
import AdminDashboard from '@/app/dashboards/admin-dashboard';
import SportsmasterDashboard from '@/app/dashboards/sportsmaster-dashboard';
import UmpireScorerDashboard from '@/app/dashboards/umpire-scorer-dashboard';
import DriverDashboard from '@/app/dashboards/driver-dashboard';
import MedicalDashboard from '@/app/dashboards/medical-dashboard';
import CoachDashboard from '@/app/dashboards/coach-dashboard';
import GuardianDashboard from '@/app/dashboards/guardian-dashboard';
import GroundskeeperDashboard from '@/app/dashboards/groundskeeper-dashboard';
import TrainerDashboard from '@/app/dashboards/trainer-dashboard';
import { getPerson, getPlayers, getGuardianDashboardData } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';
import { getCoachDashboardData, getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import { getCompetitions } from '@/lib/actions/competitions';
import { getTeams } from '@/lib/actions/teams';
import { getFields, getFieldsForGroundskeeper } from '@/lib/actions/fields';
import { getFixtureConflicts, getUnconfirmedAssignmentsCount } from '@/lib/actions/alerts';
import type { Match } from '@/lib/data';


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

  const medicalRoles = ['Doctor', 'Physio', 'First Aid'];
  const isMedicalStaff = person.roles.some(role => medicalRoles.includes(role));
  
  const coachingRoles = ['Coach', 'Assistant Coach', 'Captain'];
  const isCoach = person.roles.some(role => coachingRoles.includes(role));

  const isGroundsKeeper = person.roles.includes('Grounds-Keeper');
  const isGuardian = person.roles.includes('Guardian');
  const isTrainer = person.roles.includes('Trainer');


  // Use the activeRole to determine which dashboard to show
  if (person.activeRole === 'Admin') {
    return <AdminDashboard />;
  }

  if (person.activeRole === 'Sportsmaster') {
    const [
      allCompetitions,
      allTeams,
      allPlayers,
      allFields,
      conflicts,
      unconfirmedAssignmentsCount,
      teamStandings,
      leaderboards
    ] = await Promise.all([
      getCompetitions(),
      getTeams(),
      getPlayers(),
      getFields(),
      getFixtureConflicts(),
      getUnconfirmedAssignmentsCount(),
      getTeamStandings(),
      getLeaderboards(),
    ]);

    // In a future step, we would filter these down based on the sportsmaster's assigned schools/districts.
    return <SportsmasterDashboard 
        allCompetitions={allCompetitions}
        allTeams={allTeams}
        allPlayers={allPlayers}
        allFields={allFields}
        conflicts={conflicts}
        unconfirmedAssignmentsCount={unconfirmedAssignmentsCount}
        teamStandings={teamStandings}
        leaderboards={leaderboards}
    />;
  }
  
  if (person.activeRole === 'Umpire' || person.activeRole === 'Scorer') {
    const assignments = await getOfficialAssignmentsForPerson(person.personId);
    return <UmpireScorerDashboard assignments={assignments} />;
  }
  
  if (person.activeRole === 'Driver') {
    const assignments = await getAssignmentsForDriver(person.personId);
    return <DriverDashboard assignments={assignments} />;
  }
  
  if (isGroundsKeeper && person.activeRole === 'Grounds-Keeper') {
    const assignedFields = await getFieldsForGroundskeeper(person.personId);
    const assignedFieldIds = assignedFields.map(f => f.fieldId);

    const allMatches = await getMatches();
    const upcomingMatches = allMatches.filter(m => 
        m.status === 'scheduled' && assignedFieldIds.includes(m.fieldId)
    );
    
    const matchesByField: Record<string, Match[]> = {};
    assignedFields.forEach(field => {
        matchesByField[field.fieldId] = upcomingMatches
            .filter(match => match.fieldId === field.fieldId)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    });

    return <GroundskeeperDashboard fields={assignedFields} matchesByField={matchesByField} />;
  }

  if (isTrainer && person.activeRole === 'Trainer') {
    const players = await getPlayers().then(p => p.filter(player => player.roles.includes('Player')));
    return <TrainerDashboard players={players} />;
  }
  
  if (isCoach && ['Coach', 'Assistant Coach', 'Captain'].includes(person.activeRole)) {
    const coachData = await getCoachDashboardData(person.personId);
    return <CoachDashboard data={coachData} />;
  }
  
  if (isMedicalStaff) {
    const upcomingMatches = await getMatches().then(matches => matches.filter(m => m.status === 'scheduled'));
    return <MedicalDashboard matches={upcomingMatches} />;
  }
  
  if (isGuardian && person.activeRole === 'Guardian') {
    const guardianData = await getGuardianDashboardData(person.personId);
    return <GuardianDashboard data={guardianData} />;
  }
  
  // Default for any other role (Player, etc) is the Admin dashboard for now
  // In a future iteration, these would have their own specific dashboards.
  return <AdminDashboard />;
}
