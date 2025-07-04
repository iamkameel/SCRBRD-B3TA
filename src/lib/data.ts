import type { PlayerDevelopmentPlanOutput } from '@/ai/schemas';
import type { PlayerStats } from './data';

// Interfaces

export interface PersonSkills {
  batting?: {
    power?: number;
    timing?: number;
    running?: number;
  };
  bowling?: {
    pace?: number;
    spin?: number;
    accuracy?: number;
  };
  fielding?: {
    catching?: number;
    throwing?: number;
    agility?: number;
  };
}


export interface Person {
  personId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  profileImageUrl?: string;
  roles: string[];
  activeRole: string;
  assignedSchools?: string[];
  physicalAttributes?: {
    heightCm?: number;
    weightKg?: number;
    battingHand?: "Left"|"Right";
    bowlingHand?: "Left"|"Right";
    bowlingStyles?: string[];
  };
  biography?: string;
  qualifications?: string[];
  notificationPreferences?: {
    email: boolean;
    push: boolean;
  };
  userId?: string;
  developmentPlan?: PlayerDevelopmentPlanOutput;
  developmentPlanGeneratedAt?: Date;
  fcmTokens?: string[];
  skills?: PersonSkills;
}

export interface School {
  schoolId: string;
  name: string;
  abbreviation?: string;
  motto?: string;
  establishmentYear?: number;
  principal?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  logoUrl?: string;
  website?: string;
  phone?: string;
  location?: string;
  brandColors?: {
    primary: string;
    secondary: string;
  };
  staff?: Person[]; // No longer directly stored, but added for client components
}

export interface Division {
  divisionId: string;
  name: string;
}

export interface Season {
  seasonId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

export interface FieldAssignment {
  assignmentId: string;
  personId: string;
  personName: string;
}

export interface SurfaceCondition {
  rating: number; // 1-5
  details?: Record<string, string | number>;
}

export interface Field {
  fieldId: string;
  name: string;
  schoolId?: string;
  schoolName?: string;
  pitchType?: string;
  facilities?: string[];
  status: 'Available' | 'Maintenance' | 'Closed';
  assignments?: FieldAssignment[];
  location?: string;
  size?: string;
  amenities?: string[];
  alias?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  surfaceCondition?: SurfaceCondition;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface Team {
  teamId: string;
  name: string;
  alias?: string;
  schoolId: string;
  schoolName: string;
  divisionId: string;
  divisionName: string;
  seasonId: string;
  seasonName: string;
  teamClass?: string;
  logoUrl?: string;
  teamColors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface RosterMember {
  assignmentId: string;
  personId: string;
  personName: string;
  role: string;
  status: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface RosterMemberWithStats extends RosterMember {
    stats: PlayerStats;
    profileImageUrl?: string;
}


export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled' | 'abandoned';
export type AvailabilityStatus = 'attending' | 'unavailable' | 'tentative';

export interface PlayerOfTheMatch {
  name: string;
  teamName: string;
  justification: string;
}

export interface ShotData {
  runs: number;
  angle: number; // in degrees
  distance: number; // as a ratio of radius (0 to 1)
}

export interface LiveScore {
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    currentOver: string[];
    onStrikeBatsmanId?: string;
    nonStrikerBatsmanId?: string;
    bowlerId?: string;
    batsmenOut?: string[];
    liveInnings?: 1 | 2;
    shots?: ShotData[];
}

export interface Match {
  matchId: string;
  teamAId: string;
  teamAName: string;
  teamALogoUrl?: string;
  teamBId: string;
  teamBName: string;
  teamBLogoUrl?: string;
  competitionId?: string;
  competitionName?: string;
  seasonId?: string;
  seasonName?: string;
  divisionId?: string;
  divisionName?: string;
  fieldId: string;
  fieldName: string;
  dateTime: Date;
  status: MatchStatus;
  statusReason?: string;
  round?: number;
  report?: string;
  preview?: string;
  teamAColor?: string;
  teamBColor?: string;
  playerOfTheMatch?: PlayerOfTheMatch;
  winnerTeamId?: string;
  result?: string;
  audioCommentaryUrl?: string;
  analysisReports?: { [teamId: string]: string; };
  firstInningsTotal?: number;
  liveScore?: LiveScore;
  previousLiveScore?: LiveScore;
  userId?: string;
  availability?: { [personId: string]: { status: AvailabilityStatus; note?: string; } };
  lineupConfirmedByCaptainA?: boolean;
  lineupConfirmedByCaptainB?: boolean;
}

export interface Official {
  assignmentId: string;
  personId: string;
  personName: string;
  role: string;
  confirmed: boolean;
}

// Scorecard related types
export interface BatsmanStats {
  name: string;
  status: string; // e.g., "b. Bowler", "not out"
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
}

export interface BowlerStats {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface FallOfWicket {
    runs: number;
    wicket: number;
    batsmanName: string;
    over: number;
}

export interface Innings {
  teamName: string;
  totalRuns: number;
  wickets: number;
  overs: number;
  battingCard: BatsmanStats[];
  bowlingCard: BowlerStats[];
  fallOfWickets: FallOfWicket[];
  extras: { total: number; details: string };
}

// Stats related types
export interface PlayerStats {
    matchesPlayed: number;
    inningsBatted: number;
    notOuts: number;
    totalRuns: number;
    highestScore: number;
    highestScoreNotOut: boolean;
    ballsFaced: number;
    battingAverage: number;
    strikeRate: number;
    hundreds: number;
    fifties: number;
    fours: number;
    sixes: number;
    oversBowled: number;
    runsConceded: number;
    maidens: number;
    wicketsTaken: number;
    bowlingAverage: number;
    economyRate: number;
    bestBowling: string;
    bestBowlingWickets: number;
    bestBowlingRuns: number;
    catches: number;
    stumpings: number;
}

export interface TeamStats {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    matchesDrawn: number;
    totalRunsScored: number;
    totalWicketsTaken: number;
    netRunRate: number;
}

export interface PlayerTeamAssignment {
  assignmentId: string;
  teamId: string;
  teamName: string;
  role: string;
  status: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface Vehicle {
  vehicleId: string;
  name: string;
  type: 'Bus' | 'Minibus' | 'Van' | 'Car';
  capacity: number;
  registration: string;
}

export interface TransportAssignment {
  assignmentId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleType: Vehicle['type'];
  driverId: string;
  driverName: string;
}

export interface FullTransportAssignment extends TransportAssignment {
  matchId: string;
  matchName: string;
  dateTime: Date;
}

export interface MatchForecast {
    summary: string;
    details: {
        temperature: number;
        condition: string;
        precipitationChance: number;
        windSpeed: number;
    }
}

export interface LeaderboardPlayer extends Person {
    stats: PlayerStats;
}

export interface StandingTeam extends Team {
    stats: TeamStats;
}

export interface Competition {
  competitionId: string;
  name: string;
  type: 'League' | 'Cup' | 'Tournament' | 'Festival' | 'Friendlies';
  competitionClass?: string;
  seasonId: string;
  seasonName: string;
  divisionId: string;
  divisionName: string;
  status: 'Draft' | 'In Progress' | 'Completed';
  winnerTeamId?: string;
  winnerTeamName?: string;
  teamIds?: string[];
}

export interface PlayerMatchPerformance {
  opponent: string;
  date: Date;
  matchId: string;
  runsScored?: number;
  ballsFaced?: number;
  battingStatus?: string;
  oversBowled?: number;
  runsConceded?: number;
  wicketsTaken?: number;
}

export interface Sponsor {
  sponsorId: string;
  name: string;
  logoUrl: string;
  website?: string;
}

export interface Transaction {
  transactionId: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: 'Registration Fee' | 'Sponsorship' | 'Venue Hire' | 'Equipment' | 'Umpire Fees' | 'Other';
  date: Date;
}

export interface EquipmentItem {
  itemId: string;
  name: string;
  type: 'Bat' | 'Pads' | 'Gloves' | 'Helmet' | 'Ball' | 'Other';
  size?: string;
  status: 'Available' | 'Assigned' | 'Maintenance';
  currentAssignmentId?: string;
  currentHolderId?: string;
  currentHolderName?: string;
}

export interface FullEquipmentAssignment {
  assignmentId: string;
  itemId: string;
  itemName: string;
  itemType: EquipmentItem['type'];
  personId: string;
  personName: string;
  assignedDate: Date;
  returnedDate?: Date;
}

export interface Drill {
  drillId: string;
  name: string;
  description: string;
  category: 'Batting' | 'Bowling' | 'Fielding' | 'Fitness' | 'Tactical';
  duration: number; // in minutes
  userId?: string;
}

export interface TrainingSession {
  sessionId: string;
  title: string;
  date: Date;
  teamId: string;
  teamName: string;
  focus: string[];
  drills: {
    drillId: string;
    name: string;
    duration: number;
  }[];
  attendance: { personId: string; attended: boolean }[];
  notes?: string;
  userId?: string;
}

export interface AssignmentRequest {
  requestId: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  targetType: 'School' | 'Team';
  role: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: Date;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  userId: string;
}

export interface PlayerPerformanceForecast {
  predictedPerformance: string;
  justification: string;
}

export interface HighlightReelOutput {
    highlights: {
        over: string;
        description: string;
        imageUrl: string;
    }[];
}


// From Player Tracker Spec
export interface PerformanceEntry {
  entryId: string;
  date: Date;
  matchId: string;
  runs: number;
  ballsFaced: number;
  wickets: number;
  oversBowled: number;
  wagonWheel: { angle: number; runs: number }[];
  strikeRate: number;
  economyRate: number;
}

export interface SkillRating {
  ratingId: string;
  date: Date;
  batting: number;
  bowling: number;
  fielding: number;
  fitness: number;
  coachNotes?: string;
}

export interface TrainingLog {
  logId: string;
  date: Date;
  drillType: string;
  durationMins: number;
  coachNotes?: string;
}

export interface InjuryRecord {
  recordId: string;
  injuryType: string;
  startDate: Date;
  endDate?: Date;
  severity: 'Minor' | 'Moderate' | 'Severe';
  rehabNotes?: string;
  status: 'Active' | 'Recovered';
}

export interface Availability {
  availId: string;
  startDate: Date;
  endDate: Date;
  reason: string; // e.g., 'Injury', 'Personal', 'School Exam'
  status: 'Unavailable';
}

export interface Milestone {
  milestoneId: string;
  name: string; // e.g., '50th Match', '1000 Career Runs'
  achievedDate: Date;
}

export interface PlayerTrackerData {
  performanceEntries: PerformanceEntry[];
  skillRatings: SkillRating[];
  trainingLogs: TrainingLog[];
  injuryRecords: InjuryRecord[];
  availability: Availability[];
  milestones: Milestone[];
}
