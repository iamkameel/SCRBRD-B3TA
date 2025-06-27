

// Interfaces
export interface Person {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  roles: string[];
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

export interface Field {
  fieldId: string;
  name: string;
  surfaceType?: string;
  facilities?: string;
  status: 'Available' | 'Maintenance' | 'Closed';
  assignments?: FieldAssignment[];
}

export interface Team {
  teamId: string;
  name: string;
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

export interface Match {
  matchId: string;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  competitionId: string;
  competitionName: string;
  seasonId: string;
  seasonName: string;
  divisionId: string;
  divisionName: string;
  fieldId: string;
  fieldName: string;
  dateTime: Date;
  status: MatchStatus;
  summary?: string;
  preview?: string;
  teamAColor?: string;
  teamBColor?: string;
  playerOfTheMatch?: PlayerOfTheMatch;
  audioCommentaryUrl?: string;
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
  type: 'League' | 'Knockout' | 'Series';
  seasonId: string;
  seasonName: string;
  divisionId: string;
  divisionName: string;
  status: 'Draft' | 'In Progress' | 'Completed';
  winnerTeamId?: string;
  winnerTeamName?: string;
}

export interface PlayerMatchPerformance {
  opponent: string;
  runs: number;
  date: Date;
  matchId: string;
}
