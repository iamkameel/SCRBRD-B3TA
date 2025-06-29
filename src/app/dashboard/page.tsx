
import AdminDashboard from '@/app/dashboards/admin-dashboard';
import CoachDashboard from '@/app/dashboards/coach-dashboard';
import DriverDashboard from '@/app/dashboards/driver-dashboard';
import GroundskeeperDashboard from '@/app/dashboards/groundskeeper-dashboard';
import GuardianDashboard from '@/app/dashboards/guardian-dashboard';
import MedicalDashboard from '@/app/dashboards/medical-dashboard';
import SportsmasterDashboard from '@/app/dashboards/sportsmaster-dashboard';
import TrainerDashboard from '@/app/dashboards/trainer-dashboard';
import UmpireScorerDashboard from '@/app/dashboards/umpire-scorer-dashboard';
import { getFixtureConflicts, getUnconfirmedAssignmentsCount } from '@/lib/actions/alerts';
import { getCompetitions } from '@/lib/actions/competitions';
import { getCoachDashboardData, getLeaderboards, getTeamStandings } from '@/lib/actions/dashboard';
import { getEquipment } from '@/lib/actions/equipment';
import { getFields, getFieldsForGroundskeeper } from '@/lib/actions/fields';
import { getTransactions } from '@/lib/actions/financials';
import { getMatches, getOfficialAssignmentsForPerson } from '@/lib/actions/matches';
import { getPerson, getGuardianDashboardData, getPlayers } from '@/lib/actions/players';
import { getSponsors } from '@/lib/actions/sponsors';
import { getTeams } from '@/lib/actions/teams';
import { getAllTransportAssignments, getAssignmentsForDriver, getVehicles } from '@/lib/actions/transport';
import { getUserId } from '@/lib/auth';
import type { Match } from '@/lib/data';

type DashboardComponent = React.ComponentType<any>;

// Mapping roles to their corresponding dashboard components and data fetching functions
const dashboardConfig: Record<string, { component: DashboardComponent, fetchData?: (id: string) => Promise<any> }> = {
  Admin: { component: AdminDashboard },
  Sportsmaster: { component: SportsmasterDashboard },
  Coach: { component: CoachDashboard, fetchData: getCoachDashboardData },
  'Assistant Coach': { component: CoachDashboard, fetchData: getCoachDashboardData },
  Captain: { component: CoachDashboard, fetchData: getCoachDashboardData },
  Umpire: { component: UmpireScorerDashboard, fetchData: getOfficialAssignmentsForPerson },
  Scorer: { component: UmpireScorerDashboard, fetchData: getOfficialAssignmentsForPerson },
  Driver: { component: DriverDashboard, fetchData: getAssignmentsForDriver },
  'Grounds-Keeper': { component: GroundskeeperDashboard }, // Has custom data fetching logic
  Guardian: { component: GuardianDashboard, fetchData: getGuardianDashboardData },
  Trainer: { component: TrainerDashboard }, // Has custom data fetching logic
  'First Aid': { component: MedicalDashboard },
  Doctor: { component: MedicalDashboard },
  Physiotherapist: { component: MedicalDashboard },
  // Default to a safe, non-admin dashboard for any other roles
  Player: { component: CoachDashboard, fetchData: getCoachDashboardData },
};

async function getAdminData() {
  const [
    allMatches, 
    { topRunScorers, topWicketTakers }, 
    teamStandings, 
    allTeams, 
    allPlayers, 
    allFields,
    allTransactions,
    allSponsors,
    allVehicles,
    allEquipment,
    allCompetitions,
    conflicts,
    allTransportAssignments,
    unconfirmedAssignmentsCount,
  ] = await Promise.all([
    getMatches(), getLeaderboards(), getTeamStandings(), getTeams(),
    getPlayers(), getFields(), getTransactions(), getSponsors(),
    getVehicles(), getEquipment(), getCompetitions(), getFixtureConflicts(),
    getAllTransportAssignments(), getUnconfirmedAssignmentsCount(),
  ]);
  return {
    allMatches, topRunScorers, topWicketTakers, teamStandings, allTeams, allPlayers,
    allFields, allTransactions, allSponsors, allVehicles, allEquipment, allCompetitions,
    conflicts, allTransportAssignments, unconfirmedAssignmentsCount
  };
}

async function getSportsmasterData() {
  const [
      allCompetitions, allTeams, allPlayers, allFields,
      conflicts, unconfirmedAssignmentsCount, teamStandings, leaderboards
  ] = await Promise.all([
    getCompetitions(), getTeams(), getPlayers(), getFields(),
    getFixtureConflicts(), getUnconfirmedAssignmentsCount(),
    getTeamStandings(), getLeaderboards(),
  ]);
  return {
    allCompetitions, allTeams, allPlayers, allFields,
    conflicts, unconfirmedAssignmentsCount, teamStandings, leaderboards
  };
}

async function getGroundskeeperData(personId: string) {
    const assignedFields = await getFieldsForGroundskeeper(personId);
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
    return { fields: assignedFields, matchesByField };
}

async function getTrainerData() {
    const players = await getPlayers().then(p => p.filter(player => player.roles.includes('Player')));
    return { players };
}

async function getMedicalData() {
    const upcomingMatches = await getMatches().then(matches => matches.filter(m => m.status === 'scheduled'));
    return { matches: upcomingMatches };
}


export default async function DashboardPage() {
  const userId = await getUserId();
  
  if (!userId) {
     return <AdminDashboard {...await getAdminData()} />;
  }

  const person = await getPerson(userId);
  
  if (!person) {
    // Default to admin dashboard if no person profile found
    return <AdminDashboard {...await getAdminData()} />;
  }

  const role = person.activeRole || person.roles[0] || 'Player';
  const config = dashboardConfig[role] || dashboardConfig.Player;
  const DashboardComponent = config.component;
  let props: any = {};
  
  // Fetch data based on the role
  if (role === 'Admin') {
    props = await getAdminData();
  } else if (role === 'Sportsmaster') {
    props = await getSportsmasterData();
  } else if (config.fetchData) {
    // Pass the correct prop name for different data fetchers
    const data = await config.fetchData(userId);
    const propName = role === 'Coach' || role === 'Assistant Coach' || role === 'Captain' || role === 'Player' ? 'data' : 'assignments';
    props[propName] = data;
  } else if (role === 'Grounds-Keeper') {
    props = await getGroundskeeperData(userId);
  } else if (role === 'Trainer') {
    props = await getTrainerData();
  } else if (['First Aid', 'Doctor', 'Physiotherapist'].includes(role)) {
    props = await getMedicalData();
  }

  return <DashboardComponent {...props} />;
}
