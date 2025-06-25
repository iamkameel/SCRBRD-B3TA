
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

// Data
export const initialSchools: School[] = [
    { schoolId: "school_1", name: "Greenwood High" },
    { schoolId: "school_2", name: "Oakdale Academy" },
    { schoolId: "school_3", name: "Riverbend School" },
];

export const initialDivisions: Division[] = [
    { divisionId: "div_1", name: "U19 Varsity" },
    { divisionId: "div_2", name: "U17 Junior Varsity" },
    { divisionId: "div_3", name: "U15 Freshmen" },
];

export const initialSeasons: Season[] = [
    { seasonId: "season_1", name: "2024-2025", startDate: new Date("2024-09-01"), endDate: new Date("2025-05-31"), active: true },
    { seasonId: "season_2", name: "2023-2024", startDate: new Date("2023-09-01"), endDate: new Date("2024-05-31"), active: false },
];

export const initialFields: Field[] = [
    { fieldId: "field_1", name: "Greenwood High Main Oval", surfaceType: "Grass", facilities: "Pavilion, Toilets, Scoreboard" },
    { fieldId: "field_2", name: "Oakdale Academy Pitch 1", surfaceType: "Artificial Turf", facilities: "Electronic Scoreboard, Canteen, Nets" },
    { fieldId: "field_3", name: "Riverbend School Cricket Ground", surfaceType: "Grass", facilities: "Nets, Changing Rooms" },
];

export const initialTeams: Team[] = [
    { teamId: 'team_1', name: 'Greenwood Gators', schoolId: 'school_1', schoolName: 'Greenwood High', divisionId: 'div_1', divisionName: 'U19 Varsity', seasonId: 'season_1', seasonName: '2024-2025', teamColors: { primary: '#004d00', secondary: '#ffc400'} },
    { teamId: 'team_2', name: 'Oakdale Eagles', schoolId: 'school_2', schoolName: 'Oakdale Academy', divisionId: 'div_1', divisionName: 'U19 Varsity', seasonId: 'season_1', seasonName: '2024-2025', teamColors: { primary: '#6a0dad', secondary: '#ffd700'} },
];

export const initialPlayers: Person[] = [
    { personId: "person_1", firstName: "John", lastName: "Doe", email: "john.doe@example.com", roles: ["Player"] },
    { personId: "person_2", firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", roles: ["Player", "Guardian"] },
    { personId: "person_3", firstName: "Peter", lastName: "Jones", email: "peter.jones@example.com", roles: ["Coach", "Umpire", "Guardian"] },
    { personId: "person_4", firstName: "Mary", lastName: "Williams", email: "mary.w@example.com", roles: ["Player", "Scorer"] },
    { personId: "person_5", firstName: "Sam", lastName: "Brown", email: "sam.b@example.com", roles: ["Player"] },
    { personId: "person_6", firstName: "Emily", lastName: "Davis", email: "emily.d@example.com", roles: ["Guardian"] },
];

export const mockParentChildLinks: { parentId: string, childId: string }[] = [
    { parentId: "person_2", childId: "person_5" },
    { parentId: "person_3", childId: "person_1" },
];

export const mockFixture = {
  fixtureId: "fixture_1",
  teamA: "Greenwood Gators",
  teamB: "Oakdale Eagles",
  dateTime: new Date("2024-07-28T14:00:00"),
  status: "Completed",
  venue: "Greenwood High Main Oval",
};

export const mockScorecard = {
    resultSummary: "Greenwood Gators won by 2 wickets",
    innings1: {
      teamName: "Oakdale Eagles",
      totalRuns: 152,
      wickets: 3,
      overs: 19.4,
      battingCard: [
        { name: "Sam Brown", status: "c. John Doe b. Peter Jones", runs: 45, balls: 30, fours: 5, sixes: 2, strikeRate: 150.00 },
        { name: "Alex Ray", status: "lbw b. Peter Jones", runs: 12, balls: 15, fours: 1, sixes: 0, strikeRate: 80.00 },
        { name: "Ben Stokes", status: "b. John Doe", runs: 28, balls: 22, fours: 3, sixes: 1, strikeRate: 127.27 },
        { name: "Chris Woakes", status: "not out", runs: 15, balls: 10, fours: 1, sixes: 1, strikeRate: 150.00 },
      ],
      bowlingCard: [
          { name: "Peter Jones", overs: 4, maidens: 0, runs: 25, wickets: 2, economy: 6.25 },
          { name: "John Doe", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.5 },
          { name: "Mary Williams", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
      ],
      fallOfWickets: [
          { wicket: 1, runs: 25, batsmanName: "Alex Ray", over: 4.1 },
          { wicket: 2, runs: 78, batsmanName: "Sam Brown", over: 9.3 },
          { wicket: 3, runs: 120, batsmanName: "Ben Stokes", over: 15.2 },
      ],
      extras: { total: 10, details: "(b 1, lb 2, w 5, nb 2)" }
    },
    innings2: {
      teamName: "Greenwood Gators",
      totalRuns: 153,
      wickets: 2,
      overs: 19.1,
      battingCard: [
          { name: "John Doe", status: "not out", runs: 68, balls: 45, fours: 7, sixes: 3, strikeRate: 151.11 },
          { name: "Mary Williams", status: "run out (Sam Brown)", runs: 22, balls: 20, fours: 2, sixes: 0, strikeRate: 110.00 },
          { name: "Peter Jones", status: "c. Alex Ray b. Sam Brown", runs: 35, balls: 25, fours: 4, sixes: 0, strikeRate: 140.00 },
      ],
      bowlingCard: [
          { name: "Sam Brown", overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
          { name: "Alex Ray", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.50 },
      ],
      fallOfWickets: [
          { wicket: 1, runs: 40, batsmanName: "Mary Williams", over: 5.5 },
          { wicket: 2, runs: 100, batsmanName: "Peter Jones", over: 12.1 },
      ],
      extras: { total: 8, details: "(lb 4, w 4)" }
    }
  };

export const mockPlayerStats = {
  personId: "person_1",
  seasonId: "season_1",
  teamId: "team_1",
  matchesPlayed: 10,
  inningsBatted: 8,
  notOuts: 2,
  totalRuns: 350,
  highestScore: 102,
  fifties: 2,
  hundreds: 1,
  battingAverage: 58.33,
  strikeRate: 125.45,
  oversBowled: 25.3,
  maidens: 2,
  runsConceded: 150,
  wicketsTaken: 12,
  bowlingAverage: 12.5,
  economyRate: 5.93,
  bestBowling: "4/25",
  catches: 5,
  stumpings: 0,
};

export const mockTeamStats = {
  teamId: "team_1",
  seasonId: "season_1",
  matchesPlayed: 12,
  matchesWon: 8,
  matchesLost: 3,
  matchesDrawn: 1,
  totalRunsScored: 2450,
  totalWicketsTaken: 95,
  netRunRate: 0.75,
};
