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

// --- Data Generation ---

const schoolData = [
    { schoolId: "MHS", name: "Michaelhouse", abbreviation: "MHS" },
    { schoolId: "DHS", name: "Durban High School", abbreviation: "DHS" },
    { schoolId: "WBHS", name: "Westville Boys' High School", abbreviation: "WBHS" },
    { schoolId: "HC", name: "Hilton College", abbreviation: "HC" },
];

const divisions = [
    { divisionId: 'div_open', name: 'Open' },
    { divisionId: 'div_u16', name: 'u16' },
    { divisionId: 'div_u15', name: 'u15' },
    { divisionId: 'div_u14', name: 'u14' },
    { divisionId: 'div_u13', name: 'u13' },
];

const seasons = [
    { seasonId: 'season_1', name: '2024/25 Season', startDate: pastDate(30), endDate: futureDate(90), active: true },
    { seasonId: 'season_2', name: '2023/24 Season', startDate: pastDate(395), endDate: pastDate(275), active: false },
];

const teamTemplates = [
    { divisionName: "Open", divisionId: "div_open", teamClass: "1st XI", teamId: "open_1xi" },
    { divisionName: "Open", divisionId: "div_open", teamClass: "2nd XI", teamId: "open_2xi" },
    { divisionName: "u16", divisionId: "div_u16", teamClass: "U16A", teamId: "u16_a" },
    { divisionName: "u16", divisionId: "div_u16", teamClass: "U16B", teamId: "u16_b" },
    { divisionName: "u15", divisionId: "div_u15", teamClass: "U15A", teamId: "u15_a" },
    { divisionName: "u15", divisionId: "div_u15", teamClass: "U15B", teamId: "u15_b" },
];

const firstNames = ["Sipho", "Themba", "Lunga", "Jabulani", "Thabo", "Nkosi", "Sandile", "Mandla", "Bongi", "Siyabonga", "David", "Michael", "Christopher", "Daniel", "Matthew", "James", "John", "Robert", "William", "Richard", "Thomas", "Charles", "Joseph", "Andrew", "Anthony", "Mark", "Donald", "Paul", "Kevin", "Jason", "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Ethan"];
const lastNames = ["Ngcobo", "Dlamini", "Zulu", "Ndlovu", "Khumalo", "Sithole", "Mkhize", "Cele", "Van der Merwe", "Botha", "Du Plessis", "Naidoo", "Pillay", "Singh", "Govender", "Smith", "Jones", "Williams", "Brown", "Taylor", "Wilson", "Johnson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "King", "Wright"];
const battingStyles = ["Right-handed", "Left-handed"];
const bowlingStyles = ["Fast", "Medium-Fast", "Spin-Off", "Spin-Leg", "None"];

const generatedPlayers: any[] = [];
const generatedTeams: any[] = [];

schoolData.forEach(school => {
    teamTemplates.forEach(template => {
        const teamId = `${school.schoolId}_${template.teamId}`;
        const newTeam = {
            teamId: teamId,
            name: `${school.name} ${template.teamClass}`,
            schoolId: school.schoolId,
            divisionId: template.divisionId,
            seasonId: 'season_1',
            teamClass: template.teamClass,
            schoolName: school.name,
            divisionName: template.divisionName,
            seasonName: '2024/25 Season',
            logoUrl: 'https://placehold.co/100x100.png',
            roster: [] as any[],
        };

        for (let i = 1; i <= 15; i++) {
            const playerNumber = i.toString().padStart(2, '0');
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const personId = `${school.schoolId}_${template.teamId}_${playerNumber}`;
            const battingHand = battingStyles[Math.floor(Math.random() * battingStyles.length)];
            const bowlingStyle = bowlingStyles[Math.floor(Math.random() * bowlingStyles.length)];
            
            const birthYear = new Date().getFullYear() - (template.divisionName === 'Open' ? 18 : parseInt(template.divisionName.substring(1), 10));
            const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString();

            generatedPlayers.push({
                personId: personId,
                firstName: firstName,
                lastName: lastName,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
                roles: ['Player'],
                activeRole: 'Player',
                assignedSchools: [school.schoolId],
                dateOfBirth: dateOfBirth,
                physicalAttributes: {
                    battingHand: battingHand,
                    bowlingStyles: bowlingStyle === "None" ? [] : [bowlingStyle],
                },
                notificationPreferences: { email: false, push: false }
            });

            newTeam.roster.push({
                personId: personId,
                role: 'Player',
                status: 'active',
                isCaptain: i === 1,
                isViceCaptain: i === 2,
            });
        }
        generatedTeams.push(newTeam);
    });
});

const adminAndStaff = [
    { personId: 'p_admin', firstName: 'Admin', lastName: 'User', email: 'admin@scrbrd.app', roles: ['Admin', 'Sportsmaster'], activeRole: 'Admin', notificationPreferences: { email: true, push: false } },
    { personId: 'p_kameel', firstName: 'Kameel', lastName: 'Kalyan', email: 'kameel@maverickdesign.co.za', roles: ['Admin', 'Sportsmaster', 'Umpire','School Admin','Coach','Assistant Coach'], activeRole: 'Coach', assignedSchools: ['MHS', 'HC'], notificationPreferences: { email: true, push: false } },
    { personId: 'staff_5', firstName: 'Paddy', lastName: 'Upton', email: 'paddy.upton@schooladmin.com', roles: ['School Admin'], activeRole: 'School Admin', assignedSchools: ['MHS'], notificationPreferences: { email: true, push: false } },
    { personId: 'staff_1', firstName: 'John', lastName: 'Doe', email: 'john.doe@umpire.com', roles: ['Umpire', 'Scorer'], activeRole: 'Umpire', notificationPreferences: { email: true, push: false } },
    { personId: 'staff_2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@umpire.com', roles: ['Umpire'], activeRole: 'Umpire', notificationPreferences: { email: true, push: false } },
    { personId: 'p_54', firstName: 'Robert', lastName: 'Anderson', email: 'robert.a@example.com', roles: ['Guardian'], activeRole: 'Guardian', notificationPreferences: { email: true, push: false } },
];

const people = [...adminAndStaff, ...generatedPlayers];

const finalTeams = generatedTeams.map(team => {
    // Add a coach to each 1st XI team
    if (team.teamId === 'MHS_open_1xi') {
        // Assign Kameel specifically to this team to demonstrate the assigned coach dashboard
        team.roster.push({
            personId: 'p_kameel',
            role: 'Coach',
            status: 'active',
            isCaptain: false,
            isViceCaptain: false,
        });
    } else if (team.teamClass === '1st XI') {
        const coachId = `coach_${team.schoolId}`;
        const coach = {
            personId: coachId,
            firstName: `${team.schoolId}Coach`,
            lastName: 'Lastname',
            email: `coach.${team.schoolId.toLowerCase()}@example.com`,
            roles: ['Coach'],
            activeRole: 'Coach',
            assignedSchools: [team.schoolId],
            notificationPreferences: { email: false, push: false }
        };
        if (!people.find(p => p.personId === coachId)) {
            people.push(coach);
        }
        team.roster.push({
            personId: coachId,
            role: 'Coach',
            status: 'active',
            isCaptain: false,
            isViceCaptain: false,
        });
    }
    return team;
});


const sampleDataPrecursor = {
    schools: [
        { schoolId: 'MHS', name: 'Michaelhouse', abbreviation: 'MHS', motto: 'Quis ut Deus?', establishmentYear: 1896, principal: 'Antony Clark', logoUrl: 'https://placehold.co/100x100.png', location: 'Balgowan, KwaZulu-Natal', phone: '+27 33 234 1000', website: 'https://www.michaelhouse.org/', brandColors: { primary: '#00205B', secondary: '#FFFFFF' }, socialMedia: { facebook: 'https://www.facebook.com/Michaelhouse.Life/', instagram: 'https://www.instagram.com/michaelhouse.life/' } },
        { schoolId: 'HC', name: 'Hilton College', abbreviation: 'HC', motto: 'Orando et Laborando', establishmentYear: 1872, principal: 'George Harris', logoUrl: 'https://placehold.co/100x100.png', location: 'Hilton, KwaZulu-Natal', phone: '+27 33 383 0100', website: 'https://www.hiltoncollege.com/', brandColors: { primary: '#A50034', secondary: '#FFFFFF' } },
        { schoolId: 'DHS', name: 'Durban High School', abbreviation: 'DHS', motto: 'Deo Fretus', establishmentYear: 1866, principal: 'A.D. Pinheiro', logoUrl: 'https://placehold.co/100x100.png', location: 'Musgrave, Durban', phone: '+27 31 277 1500', website: 'https://www.durbanhighschool.co.za/', brandColors: { primary: '#000080', secondary: '#FFD700' } },
        { schoolId: 'WBHS', name: 'Westville Boys\' High School', abbreviation: 'WBHS', motto: 'Incepto Ne Desistam', establishmentYear: 1955, principal: 'Graham Steele', logoUrl: 'https://placehold.co/100x100.png', location: 'Westville, Durban', phone: '+27 31 267 1330', website: 'https://www.wbhs.co.za/', brandColors: { primary: '#1E90FF', secondary: '#FFFFFF' } },
    ],
    divisions: divisions,
    seasons: seasons,
    drills: [
        { drillId: 'drill_1', name: 'Cover Drive Practice', description: 'Repetitive practice of the cover drive shot with a bowling machine.', category: 'Batting', duration: 20 },
        { drillId: 'drill_2', name: 'Yorker Bowling', description: 'Bowlers aim to hit a target placed at the base of the stumps.', category: 'Bowling', duration: 30 },
        { drillId: 'drill_3', name: 'High Catch Practice', description: 'Fielders practice taking high catches from various angles.', category: 'Fielding', duration: 25 },
    ],
    fields: [
        { fieldId: 'field_1', schoolId: 'MHS', name: 'John Medlicott Oval', status: 'Available' },
        { fieldId: 'field_2', schoolId: 'HC', name: 'Hart-Davis Oval', status: 'Available' },
        { fieldId: 'field_3', schoolId: 'DHS', name: 'The Horse-Shoe', status: 'Available' },
        { fieldId: 'field_4', schoolId: 'WBHS', name: 'The Bowden\'s Field', status: 'Available' },
    ],
    fieldAssignments: [],
    vehicles: [
        { vehicleId: 'vehicle_1', name: 'MHS Minibus 1', type: 'Minibus', capacity: 16, registration: 'MHS-01-ZN' },
    ],
    financials: [
        { transactionId: 'trans_1', description: 'KZN Open League Registration Fees', amount: 2500, type: 'Income', category: 'Registration Fee', date: pastDate(25) },
    ],
    equipment: [
        { itemId: 'equip_1', name: 'Gray-Nicolls Bat (Players Grade)', type: 'Bat', size: 'SH', status: 'Available' },
    ],
    equipmentAssignments: [],
    sponsors: [
      { sponsorId: 'sponsor_1', name: 'SuperSport', logoUrl: 'https://placehold.co/200x100.png', website: 'https://supersport.com/' },
    ],
    familyLinks: [
        { linkId: 'link_1', parentId: 'p_54', childId: 'MHS_open_1xi_01' },
    ],
};

const competitions = [
    { competitionId: 'comp_1', name: 'KZN Open League', type: 'League', seasonId: 'season_1', divisionId: 'div_open', status: 'In Progress', teamIds: ['MHS_open_1xi', 'HC_open_1xi', 'DHS_open_1xi', 'WBHS_open_1xi'], sponsorIds: ['sponsor_1'] },
    { competitionId: 'comp_2', name: 'KZN u16 League', type: 'League', seasonId: 'season_1', divisionId: 'div_u16', status: 'In Progress', teamIds: ['MHS_u16_a', 'HC_u16_a', 'DHS_u16_a', 'WBHS_u16_a'] },
];

const matches = [
    { matchId: 'match_1', teamAId: 'MHS_open_1xi', teamBId: 'HC_open_1xi', competitionId: 'comp_1', fieldId: 'field_1', dateTime: pastDate(14), status: 'completed', winnerTeamId: 'MHS_open_1xi', result: 'Michaelhouse won by 7 runs' },
    { matchId: 'match_2', teamAId: 'DHS_open_1xi', teamBId: 'WBHS_open_1xi', competitionId: 'comp_1', fieldId: 'field_3', dateTime: pastDate(7), status: 'completed', winnerTeamId: 'DHS_open_1xi', result: 'DHS won by 25 runs' },
    { matchId: 'match_3', teamAId: 'MHS_open_1xi', teamBId: 'DHS_open_1xi', competitionId: 'comp_1', fieldId: 'field_1', dateTime: futureDate(7), status: 'scheduled' },
];

const officials = [
    { assignmentId: 'off_1', matchId: 'match_3', personId: 'staff_1', role: 'Umpire', confirmed: true },
    { assignmentId: 'off_2', matchId: 'match_3', personId: 'staff_2', role: 'Scorer', confirmed: false },
];

export const sampleData = {
    ...sampleDataPrecursor,
    teams: finalTeams,
    people: people,
    competitions,
    matches,
    officials
};

export const sampleScorecardData = {
  "match_1": {
    "playerOfTheMatch": {
      "name": "S. Dlamini",
      "teamName": "Michaelhouse 1st XI",
      "justification": "For a match-winning 78 runs off 45 balls and taking two crucial wickets."
    },
    "innings1": {
      "teamName": "Michaelhouse 1st XI",
      "totalRuns": 182, "wickets": 7, "overs": 20,
      "battingCard": [
        { "name": "Sipho Ngcobo", "status": "c Fielder b Bowler A", "runs": 15, "balls": 12, "fours": 2, "sixes": 0, "strikeRate": 125.00 },
        { "name": "Themba Dlamini", "status": "b Bowler B", "runs": 25, "balls": 20, "fours": 3, "sixes": 0, "strikeRate": 125.00 },
        { "name": "Lunga Zulu", "status": "not out", "runs": 78, "balls": 45, "fours": 6, "sixes": 4, "strikeRate": 173.33 },
        { "name": "Jabulani Ndlovu", "status": "c Fielder b Bowler C", "runs": 32, "balls": 22, "fours": 3, "sixes": 1, "strikeRate": 145.45 },
        { "name": "Thabo Khumalo", "status": "run out", "runs": 8, "balls": 7, "fours": 1, "sixes": 0, "strikeRate": 114.29 },
        { "name": "Nkosi Sithole", "status": "lbw b Bowler D", "runs": 4, "balls": 5, "fours": 0, "sixes": 0, "strikeRate": 80.00 },
        { "name": "Sandile Mkhize", "status": "b Bowler A", "runs": 1, "balls": 3, "fours": 0, "sixes": 0, "strikeRate": 33.33 },
        { "name": "Mandla Cele", "status": "not out", "runs": 3, "balls": 6, "fours": 0, "sixes": 0, "strikeRate": 50.00 },
        { "name": "Bongi Van der Merwe", "status": "did not bat", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "strikeRate": 0 },
        { "name": "Siyabonga Botha", "status": "did not bat", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "strikeRate": 0 },
        { "name": "David Du Plessis", "status": "did not bat", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "strikeRate": 0 }
      ],
      "bowlingCard": [
        { "name": "Player 1 (HC)", "overs": 4, "maidens": 0, "runs": 35, "wickets": 2, "economy": 8.75 },
        { "name": "Player 2 (HC)", "overs": 4, "maidens": 0, "runs": 28, "wickets": 1, "economy": 7.00 },
        { "name": "Player 3 (HC)", "overs": 4, "maidens": 0, "runs": 30, "wickets": 1, "economy": 7.50 },
        { "name": "Player 4 (HC)", "overs": 4, "maidens": 0, "runs": 40, "wickets": 1, "economy": 10.00 },
        { "name": "Player 5 (HC)", "overs": 4, "maidens": 0, "runs": 42, "wickets": 1, "economy": 10.50 }
      ],
      "fallOfWickets": [
        { "wicket": 1, "runs": 28, "batsmanName": "Sipho Ngcobo", "over": 3.4 },
        { "wicket": 2, "runs": 65, "batsmanName": "Themba Dlamini", "over": 8.1 },
        { "wicket": 3, "runs": 130, "batsmanName": "Jabulani Ndlovu", "over": 14.2 }
      ],
      "extras": { "total": 16, "details": "(w 8, nb 2, b 4, lb 2)" }
    },
    "innings2": {
      "teamName": "Hilton College 1st XI",
      "totalRuns": 175, "wickets": 9, "overs": 20,
      "battingCard": [
        { "name": "Player 1 (HC)", "status": "c Fielder b Dlamini", "runs": 45, "balls": 30, "fours": 5, "sixes": 1, "strikeRate": 150.00 },
        { "name": "Player 2 (HC)", "status": "b Khumalo", "runs": 12, "balls": 15, "fours": 1, "sixes": 0, "strikeRate": 80.00 },
        { "name": "Player 3 (HC)", "status": "not out", "runs": 65, "balls": 40, "fours": 7, "sixes": 2, "strikeRate": 162.50 },
        { "name": "Player 4 (HC)", "status": "run out", "runs": 18, "balls": 15, "fours": 2, "sixes": 0, "strikeRate": 120.00 },
        { "name": "Player 5 (HC)", "status": "lbw b Dlamini", "runs": 5, "balls": 8, "fours": 0, "sixes": 0, "strikeRate": 62.50 }
      ],
      "bowlingCard": [
        { "name": "Thabo Khumalo", "overs": 4, "maidens": 0, "runs": 30, "wickets": 3, "economy": 7.50 },
        { "name": "S. Dlamini", "overs": 4, "maidens": 0, "runs": 25, "wickets": 2, "economy": 6.25 }
      ],
      "fallOfWickets": [
        { "wicket": 1, "runs": 50, "batsmanName": "Player 1 (HC)", "over": 6.2 },
        { "wicket": 2, "runs": 70, "batsmanName": "Player 2 (HC)", "over": 9.1 }
      ],
      "extras": { "total": 10, "details": "(w 5, nb 1, b 2, lb 2)" }
    }
  },
  "match_2": {
    "playerOfTheMatch": {
      "name": "David Smith",
      "teamName": "Durban High School 1st XI",
      "justification": "A brilliant all-round performance, scoring 55 runs and taking 3 key wickets."
    },
    "innings1": {
      "teamName": "Durban High School 1st XI",
      "totalRuns": 195, "wickets": 5, "overs": 20,
      "battingCard": [
        { "name": "Michael Johnson", "status": "c Fielder b Bowler X", "runs": 30, "balls": 20, "fours": 4, "sixes": 1, "strikeRate": 150.00 },
        { "name": "David Smith", "status": "not out", "runs": 55, "balls": 35, "fours": 5, "sixes": 2, "strikeRate": 157.14 }
      ],
      "bowlingCard": [
        { "name": "Bowler X (WBHS)", "overs": 4, "maidens": 0, "runs": 40, "wickets": 2, "economy": 10.00 }
      ],
      "fallOfWickets": [],
      "extras": { "total": 12, "details": "(w 6, nb 1, b 3, lb 2)" }
    },
    "innings2": {
      "teamName": "Westville Boys' High School 1st XI",
      "totalRuns": 170, "wickets": 8, "overs": 20,
      "battingCard": [
        { "name": "Chris Jones", "status": "b David Smith", "runs": 50, "balls": 40, "fours": 6, "sixes": 0, "strikeRate": 125.00 }
      ],
      "bowlingCard": [
        { "name": "David Smith", "overs": 4, "maidens": 0, "runs": 25, "wickets": 3, "economy": 6.25 }
      ],
      "fallOfWickets": [],
      "extras": { "total": 8, "details": "(w 4, b 4)" }
    }
  }
};
