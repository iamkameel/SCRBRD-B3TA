// Interfaces
export interface Person {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  roles: string[];
}

export interface School {
  schoolId: string;
  name: string;
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

export interface Field {
  fieldId: string;
  name: string;
  surfaceType?: string;
  facilities?: string;
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

export interface Match {
  matchId: string;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  seasonId: string;
  seasonName: string;
  fieldId: string;
  fieldName: string;
  dateTime: Date;
  status: MatchStatus;
  summary?: string;
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
