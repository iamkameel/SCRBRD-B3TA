

// This file contains a set of sample data to populate the Firestore database.
// Temporary IDs are used here and will be replaced by real Firestore IDs during the migration process.

const futureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

const pastDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

export const sampleData = {
    schools: [
        { schoolId: 'temp_school_1', name: 'Greenwood High', abbreviation: 'GHS' },
        { schoolId: 'temp_school_2', name: 'Oakridge Academy', abbreviation: 'OAKS' },
    ],
    divisions: [
        { divisionId: 'temp_div_1', name: 'U19 Varsity' },
        { divisionId: 'temp_div_2', name: 'U16 Junior Varsity' },
    ],
    seasons: [
        { seasonId: 'temp_season_1', name: '2024-2025 Season', startDate: pastDate(30), endDate: futureDate(30), active: true },
    ],
    fields: [
        { fieldId: 'temp_field_1', name: 'Main Oval', surfaceType: 'Grass', facilities: 'Pavilion, Toilets, Nets', status: 'Available' },
        { fieldId: 'temp_field_2', name: 'North Field', surfaceType: 'Turf', facilities: 'Nets, Canteen', status: 'Maintenance' },
    ],
    vehicles: [
        { vehicleId: 'temp_vehicle_1', name: 'Minibus 1', type: 'Minibus', capacity: 16, registration: 'GHS-01' },
        { vehicleId: 'temp_vehicle_2', name: 'Van', type: 'Van', capacity: 8, registration: 'OAKS-01' },
        { vehicleId: 'temp_vehicle_3', name: 'Main Bus', type: 'Bus', capacity: 40, registration: 'GHS-02' }
    ],
    people: [
        // Greenwood Gators (12 people)
        { personId: 'p_1', firstName: 'Liam', lastName: 'Smith', email: 'liam.smith@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_2', firstName: 'Noah', lastName: 'Jones', email: 'noah.jones@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_3', firstName: 'Oliver', lastName: 'Williams', email: 'oliver.w@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_4', firstName: 'Elijah', lastName: 'Brown', email: 'elijah.brown@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_5', firstName: 'James', lastName: 'Davis', email: 'james.davis@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_6', firstName: 'Benjamin', lastName: 'Miller', email: 'benjamin.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_7', firstName: 'Lucas', lastName: 'Wilson', email: 'lucas.wilson@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_8', firstName: 'Henry', lastName: 'Moore', email: 'henry.moore@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_9', firstName: 'Alexander', lastName: 'Taylor', email: 'alex.t@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_10', firstName: 'Mason', lastName: 'Anderson', email: 'mason.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_11', firstName: 'Michael', lastName: 'Thomas', email: 'michael.t@example.com', roles: ['Player', 'Driver'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_12', firstName: 'David', lastName: 'Robinson', email: 'david.r@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },
        
        // Oakridge Oaks (12 people)
        { personId: 'p_13', firstName: 'Charlotte', lastName: 'Harris', email: 'charlotte.h@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_14', firstName: 'Amelia', lastName: 'Clark', email: 'amelia.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_15', firstName: 'Evelyn', lastName: 'Lewis', email: 'evelyn.l@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_16', firstName: 'Abigail', lastName: 'Walker', email: 'abigail.w@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_17', firstName: 'Harper', lastName: 'Hall', email: 'harper.h@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_18', firstName: 'Sophia', lastName: 'Allen', email: 'sophia.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_19', firstName: 'Isabella', lastName: 'Young', email: 'isabella.y@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_20', firstName: 'Mia', lastName: 'King', email: 'mia.king@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_21', firstName: 'Ava', lastName: 'Wright', email: 'ava.w@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_22', firstName: 'Olivia', lastName: 'Scott', email: 'olivia.s@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_23', firstName: 'Emma', lastName: 'Green', email: 'emma.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_24', firstName: 'Susan', lastName: 'Hill', email: 'susan.h@example.com', roles: ['Coach', 'Driver'], notificationPreferences: { email: true, push: false } },

        // Officials & Staff
        { personId: 'p_25', firstName: 'Robert', lastName: 'Baker', email: 'robert.b@example.com', roles: ['Umpire', 'Grounds-Keeper'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_26', firstName: 'Patricia', lastName: 'Adams', email: 'patricia.a@example.com', roles: ['Umpire', 'Scorer'], notificationPreferences: { email: true, push: false } },
        // Admin User for settings page
        { personId: 'p_admin', firstName: 'Admin', lastName: 'User', email: 'admin@scrbrd.app', roles: ['Admin'], notificationPreferences: { email: true, push: false } },
    ],
    competitions: [
        { competitionId: 'temp_comp_1', name: 'U19 Varsity League', type: 'League', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'In Progress' },
        { competitionId: 'temp_comp_2', name: 'Pre-Season Knockout', type: 'Knockout', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'Completed', winnerTeamId: 'temp_team_1' }
    ],
    teams: [
        { 
            teamId: 'temp_team_1', name: 'Greenwood Gators 1st XI', schoolId: 'temp_school_1', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#0A7A42', secondary: '#FFC72C' },
            roster: [
                { personId: 'p_1', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false },
                { personId: 'p_2', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_3', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true },
                { personId: 'p_4', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_5', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_6', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_7', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_8', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_9', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_10', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_11', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_12', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_2', name: 'Oakridge Oaks 1st XI', schoolId: 'temp_school_2', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#5D3A00', secondary: '#E0E0E0' },
            roster: [
                { personId: 'p_13', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false },
                { personId: 'p_14', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_15', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true },
                { personId: 'p_16', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_17', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_18', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_19', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_20', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_21', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_22', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_23', role: 'Player', status: 'injured', isCaptain: false, isViceCaptain: false },
                { personId: 'p_24', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
    ],
    matches: [
        { 
            matchId: 'temp_match_1', 
            teamAId: 'temp_team_1', 
            teamBId: 'temp_team_2', 
            competitionId: 'temp_comp_1',
            fieldId: 'temp_field_1', 
            dateTime: futureDate(7), 
            status: 'scheduled' 
        },
         { 
            matchId: 'temp_match_2', 
            teamAId: 'temp_team_2', 
            teamBId: 'temp_team_1', 
            competitionId: 'temp_comp_2',
            fieldId: 'temp_field_2', 
            dateTime: pastDate(14), 
            status: 'completed' 
        },
    ],
};

export const sampleScorecardData = {
    "temp_match_2": {
        playerOfTheMatch: {
            name: "Evelyn Lewis",
            teamName: "Oakridge Oaks",
            justification: "For a match-winning, unbeaten 75 runs off just 50 balls, anchoring the innings and leading the Oakridge Oaks to a defendable total with a blistering strike rate.",
        },
        innings1: {
            teamName: "Oakridge Oaks",
            totalRuns: 164, wickets: 5, overs: 20,
            battingCard: [
                { name: "Charlotte Harris", status: "c. Smith b. Jones", runs: 25, balls: 15, fours: 4, sixes: 1, strikeRate: 166.67 },
                { name: "Amelia Clark", status: "b. Anderson", runs: 10, balls: 8, fours: 2, sixes: 0, strikeRate: 125.00 },
                { name: "Evelyn Lewis", status: "not out", runs: 75, balls: 50, fours: 6, sixes: 3, strikeRate: 150.00 },
                { name: "Abigail Walker", status: "run out (Wilson)", runs: 12, balls: 15, fours: 1, sixes: 0, strikeRate: 80.00 },
                { name: "Harper Hall", status: "lbw b. Taylor", runs: 5, balls: 7, fours: 0, sixes: 0, strikeRate: 71.43 },
                { name: "Sophia Allen", status: "c. Davis b. Jones", runs: 18, balls: 13, fours: 2, sixes: 1, strikeRate: 138.46 },
                { name: "Isabella Young", status: "not out", runs: 8, balls: 12, fours: 1, sixes: 0, strikeRate: 66.67 },
                { name: "Mia King", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Ava Wright", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Olivia Scott", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Emma Green", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Noah Jones", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 },
                { name: "Mason Anderson", overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
                { name: "Benjamin Miller", overs: 4, maidens: 0, runs: 30, wickets: 0, economy: 7.50 },
                { name: "Alexander Taylor", overs: 4, maidens: 0, runs: 25, wickets: 1, economy: 6.25 },
                { name: "Michael Thomas", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
            ],
            fallOfWickets: [
                { runs: 28, wicket: 1, batsmanName: "Amelia Clark", over: 3.2 },
                { runs: 55, wicket: 2, batsmanName: "Charlotte Harris", over: 6.1 },
                { runs: 80, wicket: 3, batsmanName: "Abigail Walker", over: 10.5 },
                { runs: 95, wicket: 4, batsmanName: "Harper Hall", over: 13.2 },
                { runs: 120, wicket: 5, batsmanName: "Sophia Allen", over: 16.4 },
            ],
            extras: { total: 11, details: "(w 5, nb 1, b 4, lb 1)" },
        },
        innings2: {
            teamName: "Greenwood Gators",
            totalRuns: 152, wickets: 7, overs: 20,
            battingCard: [
                { name: "Liam Smith", status: "c. Clark b. Scott", runs: 45, balls: 30, fours: 5, sixes: 2, strikeRate: 150.00 },
                { name: "Noah Jones", status: "b. Green", runs: 2, balls: 5, fours: 0, sixes: 0, strikeRate: 40.00 },
                { name: "Oliver Williams", status: "b. Wright", runs: 33, balls: 28, fours: 3, sixes: 1, strikeRate: 117.86 },
                { name: "Elijah Brown", status: "st King b. Scott", runs: 15, balls: 15, fours: 1, sixes: 0, strikeRate: 100.00 },
                { name: "James Davis", status: "run out (Harris)", runs: 8, balls: 10, fours: 0, sixes: 0, strikeRate: 80.00 },
                { name: "Benjamin Miller", status: "c & b Wright", runs: 22, balls: 18, fours: 2, sixes: 0, strikeRate: 122.22 },
                { name: "Lucas Wilson", status: "not out", runs: 10, balls: 9, fours: 1, sixes: 0, strikeRate: 111.11 },
                { name: "Henry Moore", status: "b. Green", runs: 1, balls: 3, fours: 0, sixes: 0, strikeRate: 33.33 },
                { name: "Alexander Taylor", status: "not out", runs: 5, balls: 2, fours: 1, sixes: 0, strikeRate: 250.00 },
                { name: "Mason Anderson", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Michael Thomas", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Ava Wright", overs: 4, maidens: 0, runs: 25, wickets: 2, economy: 6.25 },
                { name: "Olivia Scott", overs: 4, maidens: 0, runs: 30, wickets: 2, economy: 7.50 },
                { name: "Emma Green", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 },
                { name: "Isabella Young", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
                { name: "Mia King", overs: 4, maidens: 0, runs: 24, wickets: 0, economy: 6.00 },
            ],
            fallOfWickets: [
                { runs: 10, wicket: 1, batsmanName: "Noah Jones", over: 2.1 },
                { runs: 65, wicket: 2, batsmanName: "Liam Smith", over: 8.3 },
                { runs: 90, wicket: 3, batsmanName: "Elijah Brown", over: 12.4 },
                { runs: 105, wicket: 4, batsmanName: "James Davis", over: 15.1 },
                { runs: 130, wicket: 5, batsmanName: "Oliver Williams", over: 17.2 },
                { runs: 140, wicket: 6, batsmanName: "Benjamin Miller", over: 18.5 },
                { runs: 142, wicket: 7, batsmanName: "Henry Moore", over: 19.2 },
            ],
            extras: { total: 11, details: "(w 6, nb 2, b 2, lb 1)" },
        },
    }
};
