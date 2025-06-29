

// Interfaces
export interface Person {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  roles: string[];
  activeRole?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
  };
}

export interface School {
  schoolId: string;
  name: string;
  abbreviation?: string;
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

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface PlayerOfTheMatch {
  name: string;
  teamName: string;
  justification: string;
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
}

export interface Match {
  matchId: string;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
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
  teamId: string;
  teamName: string;
  role: string;
  status: string;
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
