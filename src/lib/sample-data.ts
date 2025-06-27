
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
        { schoolId: 'temp_school_1', name: 'Greenwood High' },
        { schoolId: 'temp_school_2', name: 'Oakridge Academy' },
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
    people: [
        // Greenwood Gators (12 people)
        { personId: 'p_1', firstName: 'Liam', lastName: 'Smith', email: 'liam.smith@example.com', roles: ['Player', 'Captain'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_2', firstName: 'Noah', lastName: 'Jones', email: 'noah.jones@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_3', firstName: 'Oliver', lastName: 'Williams', email: 'oliver.w@example.com', roles: ['Player', 'Vice-Captain'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_4', firstName: 'Elijah', lastName: 'Brown', email: 'elijah.brown@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_5', firstName: 'James', lastName: 'Davis', email: 'james.davis@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_6', firstName: 'Benjamin', lastName: 'Miller', email: 'benjamin.m@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_7', firstName: 'Lucas', lastName: 'Wilson', email: 'lucas.wilson@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_8', firstName: 'Henry', lastName: 'Moore', email: 'henry.moore@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_9', firstName: 'Alexander', lastName: 'Taylor', email: 'alex.t@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_10', firstName: 'Mason', lastName: 'Anderson', email: 'mason.a@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_11', firstName: 'Michael', lastName: 'Thomas', email: 'michael.t@example.com', roles: ['Player', 'Driver'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_12', firstName: 'David', lastName: 'Robinson', email: 'david.r@example.com', roles: ['Coach'], profileImageUrl: 'https://placehold.co/100x100.png' },
        
        // Oakridge Oaks (12 people)
        { personId: 'p_13', firstName: 'Charlotte', lastName: 'Harris', email: 'charlotte.h@example.com', roles: ['Player', 'Captain'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_14', firstName: 'Amelia', lastName: 'Clark', email: 'amelia.c@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_15', firstName: 'Evelyn', lastName: 'Lewis', email: 'evelyn.l@example.com', roles: ['Player', 'Vice-Captain'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_16', firstName: 'Abigail', lastName: 'Walker', email: 'abigail.w@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_17', firstName: 'Harper', lastName: 'Hall', email: 'harper.h@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_18', firstName: 'Sophia', lastName: 'Allen', email: 'sophia.a@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_19', firstName: 'Isabella', lastName: 'Young', email: 'isabella.y@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_20', firstName: 'Mia', lastName: 'King', email: 'mia.king@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_21', firstName: 'Ava', lastName: 'Wright', email: 'ava.w@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_22', firstName: 'Olivia', lastName: 'Scott', email: 'olivia.s@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_23', firstName: 'Emma', lastName: 'Green', email: 'emma.g@example.com', roles: ['Player'], profileImageUrl: 'https://placehold.co/100x100.png' },
        { personId: 'p_24', firstName: 'Susan', lastName: 'Hill', email: 'susan.h@example.com', roles: ['Coach', 'Driver'], profileImageUrl: 'https://placehold.co/100x100.png' },

        // Officials & Staff
        { personId: 'p_25', firstName: 'Robert', lastName: 'Baker', email: 'robert.b@example.com', roles: ['Umpire', 'Grounds-Keeper'] },
        { personId: 'p_26', firstName: 'Patricia', lastName: 'Adams', email: 'patricia.a@example.com', roles: ['Umpire', 'Scorer'] },
    ],
    competitions: [
        { competitionId: 'temp_comp_1', name: 'U19 Varsity League', type: 'League', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'In Progress' }
    ],
    teams: [
        { 
            teamId: 'temp_team_1', name: 'Greenwood Gators', schoolId: 'temp_school_1', divisionId: 'temp_div_1', seasonId: 'temp_season_1', 
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
            teamId: 'temp_team_2', name: 'Oakridge Oaks', schoolId: 'temp_school_2', divisionId: 'temp_div_1', seasonId: 'temp_season_1', 
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
    ],
};
