

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

const sampleDataPrecursor = {
    schools: [
        { schoolId: 'school_1', name: 'Michaelhouse', abbreviation: 'MHS', motto: 'Quis ut Deus?', establishmentYear: 1896, principal: 'Antony Clark', logoUrl: 'https://placehold.co/100x100.png', location: 'Balgowan, KwaZulu-Natal', phone: '+27 33 234 1000', website: 'https://www.michaelhouse.org/', brandColors: { primary: '#00205B', secondary: '#FFFFFF' }, socialMedia: { facebook: 'https://www.facebook.com/Michaelhouse.Life/', instagram: 'https://www.instagram.com/michaelhouse.life/' } },
        { schoolId: 'school_2', name: 'Hilton College', abbreviation: 'HC', motto: 'Orando et Laborando', establishmentYear: 1872, principal: 'George Harris', logoUrl: 'https://placehold.co/100x100.png', location: 'Hilton, KwaZulu-Natal', phone: '+27 33 383 0100', website: 'https://www.hiltoncollege.com/', brandColors: { primary: '#A50034', secondary: '#FFFFFF' } },
        { schoolId: 'school_3', name: 'Maritzburg College', abbreviation: 'MC', motto: 'Pro Aris et Focis', establishmentYear: 1863, principal: 'Chris Luman', logoUrl: 'https://placehold.co/100x100.png', location: 'Pietermaritzburg, KwaZulu-Natal', phone: '+27 33 342 9376', website: 'https://maritzburgcollege.co.za/', brandColors: { primary: '#B22222', secondary: '#FFFFFF' } },
        { schoolId: 'school_4', name: 'Durban High School', abbreviation: 'DHS', motto: 'Deo Fretus', establishmentYear: 1866, principal: 'A.D. Pinheiro', logoUrl: 'https://placehold.co/100x100.png', location: 'Musgrave, Durban', phone: '+27 31 277 1500', website: 'https://www.durbanhighschool.co.za/', brandColors: { primary: '#000080', secondary: '#FFD700' } },
        { schoolId: 'school_5', name: 'Glenwood High School', abbreviation: 'GHS', motto: 'Nil Desperandum', establishmentYear: 1910, principal: 'Dr Andri Barnes', logoUrl: 'https://placehold.co/100x100.png', location: 'Glenwood, Durban', phone: '+27 31 205 5241', website: 'https://www.glenwoodhighschool.co.za/', brandColors: { primary: '#008000', secondary: '#FFFFFF' } },
        { schoolId: 'school_6', name: 'Westville Boys\' High School', abbreviation: 'WBHS', motto: 'Incepto Ne Desistam', establishmentYear: 1955, principal: 'Graham Steele', logoUrl: 'https://placehold.co/100x100.png', location: 'Westville, Durban', phone: '+27 31 267 1330', website: 'https://www.wbhs.co.za/', brandColors: { primary: '#1E90FF', secondary: '#FFFFFF' } },
        { schoolId: 'school_7', name: 'Kearsney College', abbreviation: 'KC', motto: 'Carpe Diem', establishmentYear: 1921, principal: 'Patrick Lees', logoUrl: 'https://placehold.co/100x100.png', location: 'Botha\'s Hill, Durban', phone: '+27 31 765 9600', website: 'https://www.kearsney.com/', brandColors: { primary: '#FF4500', secondary: '#1E90FF' } },
        { schoolId: 'school_8', name: 'St Charles College', abbreviation: 'SCC', motto: 'Fide et Virtute', establishmentYear: 1875, principal: 'Allen van Blerk', logoUrl: 'https://placehold.co/100x100.png', location: 'Pietermaritzburg, KwaZulu-Natal', phone: '+27 33 386 8235', website: 'https://www.scc.co.za/', brandColors: { primary: '#00008B', secondary: '#ADD8E6' } },
        { schoolId: 'school_9', name: 'Northwood School', abbreviation: 'NS', motto: 'Acquit Ye Like Men', establishmentYear: 1949, principal: 'Paul Viljoen', logoUrl: 'https://placehold.co/100x100.png', location: 'Durban North, Durban', phone: '+27 31 563 6501', website: 'https://www.northwoodschool.co.za/', brandColors: { primary: '#004B8D', secondary: '#FFFFFF' } },
        { schoolId: 'school_10', name: 'Clifton School', abbreviation: 'CS', motto: 'Prodesse Quam Conspici', establishmentYear: 1924, principal: 'Clyde Mac Donald', logoUrl: 'https://placehold.co/100x100.png', location: 'Morningside, Durban', phone: '+27 31 312 2147', website: 'https://www.cliftonschool.co.za/', brandColors: { primary: '#800000', secondary: '#F0E68C' } },
    ],
    divisions: [
        { divisionId: 'div_open', name: 'Open' },
        { divisionId: 'div_u16', name: 'u16' },
        { divisionId: 'div_u15', name: 'u15' },
        { divisionId: 'div_u14', name: 'u14' },
        { divisionId: 'div_u13', name: 'u13' },
    ],
    seasons: [
        { seasonId: 'season_1', name: '2024/25 Season', startDate: pastDate(30), endDate: futureDate(90), active: true },
        { seasonId: 'season_2', name: '2023/24 Season', startDate: pastDate(395), endDate: pastDate(275), active: false },
    ],
    drills: [
        { drillId: 'drill_1', name: 'Cover Drive Practice', description: 'Repetitive practice of the cover drive shot with a bowling machine.', category: 'Batting', duration: 20 },
        { drillId: 'drill_2', name: 'Yorker Bowling', description: 'Bowlers aim to hit a target placed at the base of the stumps.', category: 'Bowling', duration: 30 },
        { drillId: 'drill_3', name: 'High Catch Practice', description: 'Fielders practice taking high catches from various angles.', category: 'Fielding', duration: 25 },
        { drillId: 'drill_4', name: 'Interval Sprints', description: 'Sprint training to improve running between the wickets.', category: 'Fitness', duration: 15 },
        { drillId: 'drill_5', name: 'Field Setting Simulation', description: 'Tactical session on setting fields for different bowling types and match situations.', category: 'Tactical', duration: 45 },
    ],
    fields: [
        // School-owned fields
        { fieldId: 'field_1', schoolId: 'school_1', name: 'John Medlicott Oval', alias: 'Main Oval', location: 'Michaelhouse, Balgowan', coordinates: { lat: -29.318, lon: 29.96 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion', 'toilets', 'nets'], amenities: ['seating', 'changing_rooms'], status: 'Available', contactPerson: 'Mark Taylor', contactPhone: '555-0101', notes: 'Pristine condition with excellent drainage after rain.', surfaceCondition: { rating: 5, details: { "Grass Cover": "95%", "Moisture Level": "Ideal", "Firmness": "Good" } } },
        { fieldId: 'field_2', schoolId: 'school_2', name: 'Hart-Davis Oval', alias: 'The Hart-Davis', location: 'Hilton College, Hilton', coordinates: { lat: -29.508, lon: 30.301 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion', 'scoreboard'], amenities: ['seating', 'parking'], status: 'Available', contactPerson: 'Grounds Dept.', contactPhone: '555-0102', notes: '' },
        { fieldId: 'field_3', schoolId: 'school_3', name: 'Goldstones', location: 'Maritzburg College, Pietermaritzburg', coordinates: { lat: -29.600, lon: 30.375 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['nets'], amenities: ['seating', 'food_drink'], status: 'Available' },
        { fieldId: 'field_4', schoolId: 'school_4', name: 'The Horse-Shoe', location: 'DHS, Durban', size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion'], amenities: [], status: 'Available' },
        { fieldId: 'field_5', schoolId: 'school_5', name: 'Glenwood High School Main Oval', alias: '', location: '2 Ryder Road, Musgrave, Durban', coordinates: { lat: -29.8418, lon: 31.0165 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion', 'nets'], amenities: ['changing_rooms', 'parking', 'toilets'], status: 'Available', contactPerson: 'Ms. Thandi Mbatha', contactPhone: '+27 31 208 4500', surfaceCondition: { rating: 3, details: { "Grass Cover": "85%", "Moisture Level": "Slightly Dry", "Firmness": "Firm" } }, notes: 'Dressing Rooms: 1 (15 capacity). Scoreboard: Manual.' },
        { fieldId: 'field_6', schoolId: 'school_6', name: 'Westville Boys\' High Main Oval', alias: 'The Woods', location: '15 Weybridge Road, Westville, Durban', coordinates: { lat: -29.8873, lon: 30.9304 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['nets', 'toilets', 'floodlights', 'scoreboard'], amenities: ['parking', 'seating'], status: 'Available', contactPerson: 'Mr. Sipho Dlamini', contactPhone: '+27 31 267 8500', surfaceCondition: { rating: 4, details: { "Grass Cover": "90%", "Moisture Level": "Ideal", "Firmness": "Soft" } }, notes: 'Dressing Rooms: 2 (18 capacity). Umpires Room available.' },
        { fieldId: 'field_7', schoolId: 'school_7', name: 'Kearsney College Main Oval', alias: 'The Hilltop Oval', location: 'Seminary Road, Botha’s Hill, 3650', coordinates: { lat: -29.7169, lon: 30.8884 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion', 'nets', 'scoreboard', 'floodlights', 'toilets'], amenities: ['seating', 'food_drink', 'parking', 'changing_rooms'], status: 'Available', contactPerson: 'Mr. John Grounds', contactPhone: '+27 31 701 1234', surfaceCondition: { rating: 4, details: { "Grass Cover": "92%", "Moisture Level": "Ideal", "Firmness": "Medium" } }, notes: 'Dressing Rooms: 2 (20 capacity). Umpires Room and First-Aid Room available. Recently reseeded; well-drained.' },
        { fieldId: 'field_8', schoolId: 'school_8', name: 'St Charles Oval', location: 'St Charles College, Pietermaritzburg', size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion'], amenities: [], status: 'Maintenance', notes: 'Top-dressing in progress until mid-October.' },
        { fieldId: 'field_9', schoolId: 'school_9', name: 'Northwood School Main Oval', alias: '', location: '1 Begonia Avenue, Durban North', coordinates: { lat: -29.7963, lon: 31.0134 }, size: 'Full Size', pitchType: 'Natural Turf', facilities: ['scoreboard', 'nets'], amenities: ['changing_rooms', 'parking'], status: 'Available', contactPerson: 'Grounds Manager', contactPhone: '+27 31 555 1234', surfaceCondition: { rating: 3, details: { "Grass Cover": "88%", "Moisture Level": "Ideal", "Firmness": "Medium" } }, notes: 'Dressing Rooms: 2 (15 capacity).' },
        { fieldId: 'field_10', schoolId: 'school_10', name: 'Clifton Oval', location: 'Clifton School, Durban', size: 'Full Size', pitchType: 'Natural Turf', facilities: ['pavilion'], amenities: [], status: 'Available' },
        // Independent fields
        { fieldId: 'field_11', name: 'Pietermaritzburg Oval', alias: 'The Oval', location: 'Alexandra Park, Pietermaritzburg', size: 'Full Size', pitchType: 'Natural Turf', facilities: ['floodlights'], amenities: ['seating', 'changing_rooms', 'food_drink'], status: 'Available', contactPerson: 'City Venues Dept.', contactPhone: '555-0111', notes: 'Historic venue. Pitch can be slow in the mornings.' },
        { fieldId: 'field_12', name: 'Kingsmead Cricket Ground', location: 'Kingsmead, Durban', coordinates: { lat: -29.851, lon: 31.025 }, size: 'Full Size', pitchType: 'Drop-in Turf', facilities: ['floodlights', 'scoreboard'], amenities: ['seating', 'parking', 'food_drink', 'changing_rooms'], status: 'Available', contactPerson: 'Lisa Sthalekar', contactPhone: '555-0112', notes: 'International standard venue. Bookings must be made well in advance.' },
        { fieldId: 'field_13', name: 'Chatsworth Oval', location: 'Chatsworth, Durban', size: 'Full Size', pitchType: 'Matting Wicket', facilities: [], amenities: ['seating'], status: 'Available' }
    ],
    fieldAssignments: [
        { assignmentId: 'fa_1', fieldId: 'field_1', personId: 'staff_3' }, // Mark Taylor -> John Medlicott Oval
        { assignmentId: 'fa_2', fieldId: 'field_12', personId: 'staff_4' }, // Lisa Sthalekar -> Kingsmead
    ],
    vehicles: [
        { vehicleId: 'vehicle_1', name: 'MHS Minibus 1', type: 'Minibus', capacity: 16, registration: 'MHS-01-ZN' },
        { vehicleId: 'vehicle_2', name: 'HC Sprinter', type: 'Van', capacity: 12, registration: 'HC-01-ZN' },
        { vehicleId: 'vehicle_3', name: 'MC Bus', type: 'Bus', capacity: 60, registration: 'MC-BUS-ZN' }
    ],
    financials: [
        { transactionId: 'trans_1', description: 'KZN Open League Registration Fees', amount: 2500, type: 'Income', category: 'Registration Fee', date: pastDate(25) },
        { transactionId: 'trans_2', description: 'SuperSport Sponsorship', amount: 10000, type: 'Income', category: 'Sponsorship', date: pastDate(20) },
        { transactionId: 'trans_3', description: 'Goldstones Hire for Tournament', amount: 1500, type: 'Expense', category: 'Venue Hire', date: pastDate(15) },
        { transactionId: 'trans_4', description: 'Purchase of 24 Kookaburra Balls', amount: 800, type: 'Expense', category: 'Equipment', date: pastDate(10) },
    ],
    equipment: [
        { itemId: 'equip_1', name: 'Gray-Nicolls Bat (Players Grade)', type: 'Bat', size: 'SH', status: 'Available' },
        { itemId: 'equip_2', name: 'Masuri Vision Series Helmet', type: 'Helmet', size: 'M', status: 'Assigned' },
        { itemId: 'equip_3', name: 'Kookaburra Regulation Match Balls (Box of 6)', type: 'Ball', status: 'Available' },
    ],
    equipmentAssignments: [
        { assignmentId: 'assign_1', itemId: 'equip_2', personId: 'p_1', assignedDate: pastDate(10) },
    ],
    sponsors: [
      { sponsorId: 'sponsor_1', name: 'SuperSport', logoUrl: 'https://placehold.co/200x100.png', website: 'https://supersport.com/' },
      { sponsorId: 'sponsor_2', name: 'Coca-Cola', logoUrl: 'https://placehold.co/200x100.png', website: 'https://www.coca-cola.com/' },
      { sponsorId: 'sponsor_3', name: 'Standard Bank', logoUrl: 'https://placehold.co/200x100.png', website: 'https://www.standardbank.co.za/' },
    ],
    people: [
        // Admin & Staff
        { personId: 'p_admin', firstName: 'Admin', lastName: 'User', email: 'admin@scrbrd.app', roles: ['Admin', 'Sportsmaster'], activeRole: 'Admin', notificationPreferences: { email: true, push: false } },
        { personId: 'p_kameel', firstName: 'Kameel', lastName: 'Kalyan', email: 'kameel@maverickdesign.co.za', roles: ['Admin', 'Sportsmaster', 'Umpire','School Admin','Coach','Assistant Coach'], activeRole: 'Sportsmaster', assignedSchools: ['school_1', 'school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'staff_5', firstName: 'Paddy', lastName: 'Upton', email: 'paddy.upton@schooladmin.com', roles: ['School Admin'], activeRole: 'School Admin', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'staff_1', firstName: 'John', lastName: 'Doe', email: 'john.doe@umpire.com', roles: ['Umpire', 'Scorer'], activeRole: 'Umpire', notificationPreferences: { email: true, push: false } },
        { personId: 'staff_2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@umpire.com', roles: ['Umpire'], activeRole: 'Umpire', notificationPreferences: { email: true, push: false } },
        { personId: 'staff_3', firstName: 'Mark', lastName: 'Taylor', email: 'mark.t@ground.com', roles: ['Grounds-Keeper', 'Driver'], activeRole: 'Grounds-Keeper', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'staff_4', firstName: 'Lisa', lastName: 'Sthalekar', email: 'lisa.s@ground.com', roles: ['Grounds-Keeper'], activeRole: 'Grounds-Keeper', notificationPreferences: { email: true, push: false } },
        { personId: 'p_49', firstName: 'Eoin', lastName: 'Morgan', email: 'eoin.m@example.com', roles: ['Team Manager'], activeRole: 'Team Manager', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_50', firstName: 'Anil', lastName: 'Kumble', email: 'anil.k@example.com', roles: ['Assistant Coach'], activeRole: 'Assistant Coach', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_51', firstName: 'Sarah', lastName: 'Connor', email: 'sarah.c@school.com', roles: ['School Admin'], activeRole: 'School Admin', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_52', firstName: 'Eva', lastName: 'Carneiro', email: 'eva.c@medical.com', roles: ['Doctor', 'First Aid'], activeRole: 'Doctor', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_53', firstName: 'Gary', lastName: 'Lewin', email: 'gary.l@medical.com', roles: ['Physiotherapist', 'Trainer'], activeRole: 'Physiotherapist', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_54', firstName: 'Robert', lastName: 'Anderson', email: 'robert.a@example.com', roles: ['Guardian'], activeRole: 'Guardian', notificationPreferences: { email: true, push: false } },
        
        // Michaelhouse Players & Coach
        { personId: 'p_1', firstName: 'James', lastName: 'Anderson', email: 'james.a@example.com', roles: ['Player', 'Captain'], activeRole: 'Player', profileImageUrl: 'https://placehold.co/400x400.png', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_2', firstName: 'Ben', lastName: 'Stokes', email: 'ben.s@example.com', roles: ['Player', 'Vice-Captain'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_3', firstName: 'Joe', lastName: 'Root', email: 'joe.r@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_4', firstName: 'Stuart', lastName: 'Broad', email: 'stuart.b@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_5', firstName: 'Jonny', lastName: 'Bairstow', email: 'jonny.b@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_6', firstName: 'Jos', lastName: 'Buttler', email: 'jos.b@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_7', firstName: 'Chris', lastName: 'Woakes', email: 'chris.w@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_8', firstName: 'Mark', lastName: 'Wood', email: 'mark.w@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_9', firstName: 'Adil', lastName: 'Rashid', email: 'adil.r@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_10', firstName: 'Jofra', lastName: 'Archer', email: 'jofra.a@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_11', firstName: 'Sam', lastName: 'Curran', email: 'sam.c@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_12', firstName: 'Trevor', lastName: 'Bayliss', email: 'trevor.b@coach.com', roles: ['Coach'], activeRole: 'Coach', assignedSchools: ['school_1'], notificationPreferences: { email: true, push: false } },

        // Hilton College Players & Coach
        { personId: 'p_13', firstName: 'Virat', lastName: 'Kohli', email: 'virat.k@example.com', roles: ['Player', 'Captain'], activeRole: 'Player', profileImageUrl: 'https://placehold.co/400x400.png', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_14', firstName: 'Rohit', lastName: 'Sharma', email: 'rohit.s@example.com', roles: ['Player', 'Vice-Captain'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_15', firstName: 'Jasprit', lastName: 'Bumrah', email: 'jasprit.b@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_16', firstName: 'KL', lastName: 'Rahul', email: 'kl.rahul@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_17', firstName: 'Rishabh', lastName: 'Pant', email: 'rishabh.p@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_18', firstName: 'Hardik', lastName: 'Pandya', email: 'hardik.p@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_19', firstName: 'Ravindra', lastName: 'Jadeja', email: 'ravindra.j@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_20', firstName: 'Mohammed', lastName: 'Shami', email: 'mohammed.s@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_21', firstName: 'Shikhar', lastName: 'Dhawan', email: 'shikhar.d@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_22', firstName: 'Yuzvendra', lastName: 'Chahal', email: 'yuzvendra.c@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_23', firstName: 'Suryakumar', lastName: 'Yadav', email: 'suryakumar.y@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_24', firstName: 'Ravi', lastName: 'Shastri', email: 'ravi.s@coach.com', roles: ['Coach', 'Driver'], activeRole: 'Coach', assignedSchools: ['school_2'], notificationPreferences: { email: true, push: false } },
        
        // Maritzburg College Players
        { personId: 'p_25', firstName: 'Kane', lastName: 'Williamson', email: 'kane.w@example.com', roles: ['Player', 'Captain'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_26', firstName: 'Trent', lastName: 'Boult', email: 'trent.b@example.com', roles: ['Player', 'Vice-Captain'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_27', firstName: 'Ross', lastName: 'Taylor', email: 'ross.t@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_28', firstName: 'Devon', lastName: 'Conway', email: 'devon.c@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_29', firstName: 'Kyle', lastName: 'Jamieson', email: 'kyle.j@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_30', firstName: 'Tom', lastName: 'Latham', email: 'tom.l@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_31', firstName: 'Mitchell', lastName: 'Santner', email: 'mitchell.s@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_32', firstName: 'Tim', lastName: 'Southee', email: 'tim.s@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_33', firstName: 'Lockie', lastName: 'Ferguson', email: 'lockie.f@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_34', firstName: 'Martin', lastName: 'Guptill', email: 'martin.g@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_35', firstName: 'Ish', lastName: 'Sodhi', email: 'ish.s@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_36', firstName: 'Gary', lastName: 'Stead', email: 'gary.s@coach.com', roles: ['Coach'], activeRole: 'Coach', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },

        // DHS Players
        { personId: 'p_37', firstName: 'Babar', lastName: 'Azam', email: 'babar.a@example.com', roles: ['Player', 'Captain'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_38', firstName: 'Shaheen', lastName: 'Afridi', email: 'shaheen.a@example.com', roles: ['Player', 'Vice-Captain'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_39', firstName: 'Mohammad', lastName: 'Rizwan', email: 'mohammad.r@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_40', firstName: 'Shadab', lastName: 'Khan', email: 'shadab.k@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_41', firstName: 'Fakhar', lastName: 'Zaman', email: 'fakhar.z@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_42', firstName: 'Haris', lastName: 'Rauf', email: 'haris.r@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_43', firstName: 'Imam-ul-Haq', email: 'imam.h@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_44', firstName: 'Hasan', lastName: 'Ali', email: 'hasan.a@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_45', firstName: 'Shoaib', lastName: 'Malik', email: 'shoaib.m@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_46', firstName: 'Iftikhar', lastName: 'Ahmed', email: 'iftikhar.a@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_47', firstName: 'Naseem', lastName: 'Shah', email: 'naseem.s@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_48', firstName: 'Mickey', lastName: 'Arthur', email: 'mickey.a@coach.com', roles: ['Coach'], activeRole: 'Coach', assignedSchools: ['school_4'], notificationPreferences: { email: true, push: false } },
        
        // Maritzburg College U16 Players & Coach
        { personId: 'p_u16_1', firstName: 'Aiden', lastName: 'Markram', email: 'aiden.m@example.com', roles: ['Player', 'Captain'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_2', firstName: 'Quinton', lastName: 'de Kock', email: 'quinton.d@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_3', firstName: 'Faf', lastName: 'du Plessis', email: 'faf.d@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_4', firstName: 'Kagiso', lastName: 'Rabada', email: 'kagiso.r@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_5', firstName: 'Anrich', lastName: 'Nortje', email: 'anrich.n@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_6', firstName: 'Lungi', lastName: 'Ngidi', email: 'lungi.n@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_7', firstName: 'David', lastName: 'Miller', email: 'david.m@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_8', firstName: 'Rassie', lastName: 'van der Dussen', email: 'rassie.v@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_9', firstName: 'Temba', lastName: 'Bavuma', email: 'temba.b@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_10', firstName: 'Keshav', lastName: 'Maharaj', email: 'keshav.m@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_11', firstName: 'Tabraiz', lastName: 'Shamsi', email: 'tabraiz.s@example.com', roles: ['Player'], activeRole: 'Player', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_u16_coach', firstName: 'Jacques', lastName: 'Kallis', email: 'jacques.k@coach.com', roles: ['Coach'], activeRole: 'Coach', assignedSchools: ['school_3'], notificationPreferences: { email: true, push: false } },
    ],
    familyLinks: [
        { linkId: 'link_1', parentId: 'p_54', childId: 'p_1' },
    ],
};

const generateTeams = () => {
    const teams = [];
    const teamNameMap = {};
    let teamIdCounter = 1;

    const openClasses = ['1st XI', '2nd XI', '3rd XI', '4th XI', '5th XI', '6th XI'];
    const ageGroupClasses = ['A', 'B', 'C', 'D', 'E'];
    const ageGroupDivisions = sampleDataPrecursor.divisions.filter(d => d.name !== 'Open');

    sampleDataPrecursor.schools.forEach(school => {
        const openDivision = sampleDataPrecursor.divisions.find(d => d.name === 'Open');
        if (openDivision) {
            openClasses.forEach(teamClass => {
                const teamId = `team_${teamIdCounter++}`;
                const teamName = `${school.name} ${teamClass}`;
                teams.push({
                    teamId: teamId,
                    name: teamName,
                    schoolId: school.schoolId,
                    divisionId: openDivision.divisionId,
                    seasonId: 'season_1',
                    teamClass: teamClass,
                    roster: []
                });
                teamNameMap[teamName] = teamId;
            });
        }

        ageGroupDivisions.forEach(division => {
            ageGroupClasses.forEach(teamClass => {
                const teamId = `team_${teamIdCounter++}`;
                const formattedTeamClass = `${division.name.toUpperCase()}${teamClass}`;
                const teamName = `${school.name} ${formattedTeamClass}`;
                teams.push({
                    teamId: teamId,
                    name: teamName,
                    schoolId: school.schoolId,
                    divisionId: division.divisionId,
                    seasonId: 'season_1',
                    teamClass: formattedTeamClass,
                    roster: []
                });
                teamNameMap[teamName] = teamId;
            });
        });
    });

    const originalRosters = {
        'Michaelhouse 1st XI': [
            ...Array.from({length: 11}, (_, i) => ({ personId: `p_${i + 1}`, role: 'Player', status: 'active', isCaptain: i === 0, isViceCaptain: i === 1 })),
            { personId: 'p_12', role: 'Coach', status: 'active' },
            { personId: 'p_49', role: 'Team Manager', status: 'active' },
        ],
        'Hilton College 1st XI': [
            ...Array.from({length: 11}, (_, i) => ({ personId: `p_${i + 13}`, role: 'Player', status: 'active', isCaptain: i === 0, isViceCaptain: i === 1 })),
            { personId: 'p_24', role: 'Coach', status: 'active' },
            { personId: 'p_50', role: 'Assistant Coach', status: 'active' },
        ],
        'Maritzburg College 1st XI': Array.from({length: 12}, (_, i) => ({ personId: `p_${i + 25}`, role: i < 11 ? 'Player' : 'Coach', status: 'active', isCaptain: i === 0, isViceCaptain: i === 1 })),
        'Durban High School 1st XI': Array.from({length: 12}, (_, i) => ({ personId: `p_${i + 37}`, role: i < 11 ? 'Player' : 'Coach', status: 'active', isCaptain: i === 0, isViceCaptain: i === 1 })),
        'Maritzburg College U16A': [
            ...Array.from({length: 11}, (_, i) => ({ personId: `p_u16_${i + 1}`, role: 'Player', status: 'active', isCaptain: i === 0, isViceCaptain: i === 1 })),
            { personId: 'p_u16_coach', role: 'Coach', status: 'active' },
        ],
    };

    teams.forEach(team => {
        if (originalRosters[team.name]) {
            team.roster = originalRosters[team.name];
        }
    });

    return { teams, teamNameMap };
};

const { teams, teamNameMap } = generateTeams();

const getTeamId = (name) => teamNameMap[name] || null;

const competitions = [
    { competitionId: 'comp_1', name: 'KZN Open League', type: 'League', seasonId: 'season_1', divisionId: 'div_open', status: 'In Progress', teamIds: [getTeamId('Michaelhouse 1st XI'), getTeamId('Hilton College 1st XI'), getTeamId('Maritzburg College 1st XI'), getTeamId('Durban High School 1st XI')] },
    { competitionId: 'comp_2', name: 'KZN u16 League', type: 'League', seasonId: 'season_1', divisionId: 'div_u16', status: 'In Progress', teamIds: [getTeamId('Maritzburg College U16A')] },
    { competitionId: 'comp_3', name: 'Coastal Cup', type: 'Cup', seasonId: 'season_1', divisionId: 'div_open', status: 'In Progress', teamIds: [getTeamId('Michaelhouse 1st XI'), getTeamId('Hilton College 1st XI'), getTeamId('Maritzburg College 1st XI'), getTeamId('Durban High School 1st XI')] },
];

const matches = [
    { matchId: 'match_1', teamAId: getTeamId('Michaelhouse 1st XI'), teamBId: getTeamId('Hilton College 1st XI'), competitionId: 'comp_1', fieldId: 'field_1', dateTime: pastDate(14), status: 'completed' },
    { matchId: 'match_2', teamAId: getTeamId('Maritzburg College 1st XI'), teamBId: getTeamId('Durban High School 1st XI'), competitionId: 'comp_1', fieldId: 'field_3', dateTime: pastDate(7), status: 'completed' },
    { matchId: 'match_3', teamAId: getTeamId('Michaelhouse 1st XI'), teamBId: getTeamId('Maritzburg College 1st XI'), competitionId: 'comp_1', fieldId: 'field_1', dateTime: futureDate(7), status: 'scheduled' },
    { matchId: 'match_4', teamAId: getTeamId('Hilton College 1st XI'), teamBId: getTeamId('Durban High School 1st XI'), competitionId: 'comp_1', fieldId: 'field_2', dateTime: futureDate(10), status: 'scheduled' },
    // Coastal Cup Matches
    { matchId: 'match_5', teamAId: getTeamId('Michaelhouse 1st XI'), teamBId: getTeamId('Durban High School 1st XI'), competitionId: 'comp_3', round: 1, fieldId: 'field_12', dateTime: pastDate(2), status: 'completed', winnerTeamId: getTeamId('Michaelhouse 1st XI'), result: 'Michaelhouse won by 15 runs' },
    { matchId: 'match_6', teamAId: getTeamId('Hilton College 1st XI'), teamBId: getTeamId('Maritzburg College 1st XI'), competitionId: 'comp_3', round: 1, fieldId: 'field_12', dateTime: pastDate(1), status: 'completed', winnerTeamId: getTeamId('Hilton College 1st XI'), result: 'Hilton won by 5 wickets' },
    { matchId: 'match_7', teamAId: getTeamId('Michaelhouse 1st XI'), teamBId: getTeamId('Hilton College 1st XI'), competitionId: 'comp_3', round: 2, fieldId: 'field_12', dateTime: futureDate(14), status: 'scheduled' },
];

const officials = [
    { assignmentId: 'off_1', matchId: 'match_3', personId: 'staff_1', role: 'Umpire', confirmed: true },
    { assignmentId: 'off_2', matchId: 'match_4', personId: 'staff_2', role: 'Scorer', confirmed: false },
    { assignmentId: 'off_3', matchId: 'match_4', personId: 'staff_1', role: 'Umpire', confirmed: false },
];

export const sampleData = {
    ...sampleDataPrecursor,
    teams,
    competitions,
    matches,
    officials
};


export const sampleScorecardData = {
    "match_1": {
        playerOfTheMatch: {
            name: "Ben Stokes",
            teamName: "Michaelhouse 1st XI",
            justification: "For a crucial all-round performance, scoring a quickfire 45 and taking 3 key wickets to turn the match in his team's favor.",
        },
        innings1: {
            teamName: "Michaelhouse 1st XI", totalRuns: 182, wickets: 7, overs: 20,
            battingCard: [
                { name: "Joe Root", status: "c. Rahul b. Bumrah", runs: 34, balls: 25, fours: 4, sixes: 1, strikeRate: 136.00 },
                { name: "Jonny Bairstow", status: "b. Shami", runs: 12, balls: 10, fours: 2, sixes: 0, strikeRate: 120.00 },
                { name: "James Anderson", status: "run out (Kohli)", runs: 25, balls: 20, fours: 3, sixes: 0, strikeRate: 125.00 },
                { name: "Ben Stokes", status: "not out", runs: 45, balls: 30, fours: 3, sixes: 2, strikeRate: 150.00 },
                { name: "Jos Buttler", status: "c. Pant b. Jadeja", runs: 18, balls: 15, fours: 1, sixes: 1, strikeRate: 120.00 },
                { name: "Sam Curran", status: "not out", runs: 28, balls: 20, fours: 2, sixes: 1, strikeRate: 140.00 },
                { name: "Stuart Broad", status: "b. Bumrah", runs: 4, balls: 5, fours: 0, sixes: 0, strikeRate: 80.00 },
                { name: "Chris Woakes", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Mark Wood", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Adil Rashid", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Jofra Archer", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Jasprit Bumrah", overs: 4, maidens: 0, runs: 30, wickets: 2, economy: 7.50 },
                { name: "Mohammed Shami", overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
                { name: "Hardik Pandya", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
                { name: "Ravindra Jadeja", overs: 4, maidens: 0, runs: 25, wickets: 1, economy: 6.25 },
                { name: "Yuzvendra Chahal", overs: 4, maidens: 0, runs: 42, wickets: 0, economy: 10.50 },
            ],
            fallOfWickets: [
                { runs: 22, wicket: 1, batsmanName: "Jonny Bairstow", over: 3.2 },
                { runs: 60, wicket: 2, batsmanName: "Joe Root", over: 8.1 },
                { runs: 90, wicket: 3, batsmanName: "James Anderson", over: 12.5 },
                { runs: 120, wicket: 4, batsmanName: "Jos Buttler", over: 15.2 },
                { runs: 150, wicket: 5, batsmanName: "Stuart Broad", over: 18.1 },
            ],
            extras: { total: 16, details: "(w 8, nb 2, b 4, lb 2)" },
        },
        innings2: {
            teamName: "Hilton College 1st XI", totalRuns: 175, wickets: 9, overs: 20,
            battingCard: [
                { name: "Virat Kohli", status: "c. Buttler b. Archer", runs: 55, balls: 40, fours: 6, sixes: 1, strikeRate: 137.50 },
                { name: "Rohit Sharma", status: "b. Wood", runs: 5, balls: 8, fours: 1, sixes: 0, strikeRate: 62.50 },
                { name: "KL Rahul", status: "c. Bairstow b. Stokes", runs: 30, balls: 25, fours: 3, sixes: 0, strikeRate: 120.00 },
                { name: "Rishabh Pant", status: "lbw b. Rashid", runs: 20, balls: 15, fours: 1, sixes: 1, strikeRate: 133.33 },
                { name: "Hardik Pandya", status: "c. Root b. Stokes", runs: 15, balls: 12, fours: 1, sixes: 1, strikeRate: 125.00 },
                { name: "Suryakumar Yadav", status: "b. Stokes", runs: 2, balls: 5, fours: 0, sixes: 0, strikeRate: 40.00 },
                { name: "Ravindra Jadeja", status: "not out", runs: 25, balls: 12, fours: 2, sixes: 1, strikeRate: 208.33 },
                { name: "Mohammed Shami", status: "run out (Curran)", runs: 1, balls: 1, fours: 0, sixes: 0, strikeRate: 100.00 },
                { name: "Jasprit Bumrah", status: "b. Archer", runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0.00 },
                { name: "Yuzvendra Chahal", status: "not out", runs: 1, balls: 1, fours: 0, sixes: 0, strikeRate: 100.00 },
                { name: "Shikhar Dhawan", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Jofra Archer", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 },
                { name: "Mark Wood", overs: 4, maidens: 0, runs: 32, wickets: 1, economy: 8.00 },
                { name: "Ben Stokes", overs: 4, maidens: 0, runs: 30, wickets: 3, economy: 7.50 },
                { name: "Adil Rashid", overs: 4, maidens: 0, runs: 40, wickets: 1, economy: 10.00 },
                { name: "Sam Curran", overs: 4, maidens: 0, runs: 35, wickets: 0, economy: 8.75 },
            ],
            fallOfWickets: [
                { runs: 10, wicket: 1, batsmanName: "Rohit Sharma", over: 2.1 },
                { runs: 65, wicket: 2, batsmanName: "KL Rahul", over: 8.3 },
                { runs: 100, wicket: 3, batsmanName: "Virat Kohli", over: 12.4 },
                { runs: 125, wicket: 4, batsmanName: "Rishabh Pant", over: 15.1 },
                { runs: 145, wicket: 5, batsmanName: "Hardik Pandya", over: 17.2 },
                { runs: 150, wicket: 6, batsmanName: "Suryakumar Yadav", over: 18.1 },
                { runs: 160, wicket: 7, batsmanName: "Mohammed Shami", over: 19.1 },
                { runs: 162, wicket: 8, batsmanName: "Jasprit Bumrah", over: 19.3 },
            ],
            extras: { total: 21, details: "(w 10, nb 3, b 4, lb 4)" },
        },
    },
    "match_2": {
        playerOfTheMatch: {
            name: "Shaheen Afridi",
            teamName: "Durban High School 1st XI",
            justification: "For an exceptional opening spell, taking 4 wickets for just 18 runs, which dismantled the opposition's top order and set the foundation for a convincing victory.",
        },
        innings1: {
            teamName: "Maritzburg College 1st XI", totalRuns: 145, wickets: 10, overs: 19.4,
            battingCard: [
                { name: "Kane Williamson", status: "b. Afridi", runs: 15, balls: 12, fours: 2, sixes: 0, strikeRate: 125.00 },
                { name: "Martin Guptill", status: "c. Rizwan b. Afridi", runs: 2, balls: 5, fours: 0, sixes: 0, strikeRate: 40.00 },
                { name: "Ross Taylor", status: "c. Azam b. Rauf", runs: 35, balls: 30, fours: 4, sixes: 0, strikeRate: 116.67 },
                { name: "Devon Conway", status: "lbw b. Shadab", runs: 28, balls: 25, fours: 3, sixes: 0, strikeRate: 112.00 },
                { name: "Tom Latham", status: "c. Zaman b. Ali", runs: 22, balls: 20, fours: 2, sixes: 0, strikeRate: 110.00 },
                { name: "Mitchell Santner", status: "b. Afridi", runs: 10, balls: 8, fours: 1, sixes: 0, strikeRate: 125.00 },
                { name: "Kyle Jamieson", status: "b. Rauf", runs: 5, balls: 5, fours: 0, sixes: 0, strikeRate: 100.00 },
                { name: "Tim Southee", status: "not out", runs: 8, balls: 6, fours: 1, sixes: 0, strikeRate: 133.33 },
                { name: "Ish Sodhi", status: "c. Malik b. Afridi", runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0.00 },
                { name: "Trent Boult", status: "run out (Shadab)", runs: 1, balls: 2, fours: 0, sixes: 0, strikeRate: 50.00 },
                { name: "Lockie Ferguson", status: "b. Rauf", runs: 4, balls: 4, fours: 0, sixes: 0, strikeRate: 100.00 },
            ],
            bowlingCard: [
                { name: "Shaheen Afridi", overs: 4, maidens: 0, runs: 18, wickets: 4, economy: 4.50 },
                { name: "Hasan Ali", overs: 3.4, maidens: 0, runs: 35, wickets: 1, economy: 9.55 },
                { name: "Haris Rauf", overs: 4, maidens: 0, runs: 25, wickets: 3, economy: 6.25 },
                { name: "Shadab Khan", overs: 4, maidens: 0, runs: 28, wickets: 1, economy: 7.00 },
                { name: "Iftikhar Ahmed", overs: 4, maidens: 0, runs: 30, wickets: 0, economy: 7.50 },
            ],
            fallOfWickets: [
                { runs: 5, wicket: 1, batsmanName: "Martin Guptill", over: 1.2 },
                { runs: 25, wicket: 2, batsmanName: "Kane Williamson", over: 3.5 },
                { runs: 70, wicket: 3, batsmanName: "Ross Taylor", over: 9.1 },
                { runs: 100, wicket: 4, batsmanName: "Devon Conway", over: 13.2 },
                { runs: 115, wicket: 5, batsmanName: "Kyle Jamieson", over: 15.1 },
                { runs: 128, wicket: 6, batsmanName: "Tom Latham", over: 16.4 },
                { runs: 135, wicket: 7, batsmanName: "Mitchell Santner", over: 17.5 },
                { runs: 136, wicket: 8, batsmanName: "Ish Sodhi", over: 18.1 },
                { runs: 138, wicket: 9, batsmanName: "Trent Boult", over: 18.4 },
                { runs: 145, wicket: 10, batsmanName: "Lockie Ferguson", over: 19.4 },
            ],
            extras: { total: 15, details: "(w 5, nb 2, b 4, lb 4)" },
        },
        innings2: {
            teamName: "Durban High School 1st XI", totalRuns: 146, wickets: 3, overs: 18.2,
            battingCard: [
                { name: "Babar Azam", status: "not out", runs: 68, balls: 55, fours: 8, sixes: 1, strikeRate: 123.64 },
                { name: "Mohammad Rizwan", status: "c. Latham b. Boult", runs: 25, balls: 20, fours: 3, sixes: 1, strikeRate: 125.00 },
                { name: "Fakhar Zaman", status: "b. Southee", runs: 18, balls: 15, fours: 2, sixes: 0, strikeRate: 120.00 },
                { name: "Shoaib Malik", status: "not out", runs: 25, balls: 20, fours: 1, sixes: 1, strikeRate: 125.00 },
                { name: "Imam-ul-Haq", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Shadab Khan", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Iftikhar Ahmed", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Hasan Ali", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Shaheen Afridi", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Haris Rauf", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Naseem Shah", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Trent Boult", overs: 4, maidens: 0, runs: 28, wickets: 1, economy: 7.00 },
                { name: "Tim Southee", overs: 4, maidens: 0, runs: 32, wickets: 1, economy: 8.00 },
                { name: "Lockie Ferguson", overs: 3.2, maidens: 0, runs: 30, wickets: 0, economy: 9.00 },
                { name: "Mitchell Santner", overs: 4, maidens: 0, runs: 25, wickets: 0, economy: 6.25 },
                { name: "Ish Sodhi", overs: 3, maidens: 0, runs: 21, wickets: 0, economy: 7.00 },
            ],
            fallOfWickets: [
                { runs: 45, wicket: 1, batsmanName: "Mohammad Rizwan", over: 5.3 },
                { runs: 80, wicket: 2, batsmanName: "Fakhar Zaman", over: 10.1 },
            ],
            extras: { total: 10, details: "(w 6, nb 1, b 2, lb 1)" },
        },
    },
    "match_5": {
        playerOfTheMatch: { name: "Babar Azam", teamName: "Durban High School 1st XI", justification: "A captain's knock of 75 not out saw his team home in a tricky run chase."},
        innings1: {
            teamName: "Michaelhouse 1st XI", totalRuns: 165, wickets: 8, overs: 20,
            battingCard: [], bowlingCard: [], fallOfWickets: [], extras: { total: 0, details: ''}
        },
        innings2: {
            teamName: "Durban High School 1st XI", totalRuns: 166, wickets: 5, overs: 19.1,
            battingCard: [], bowlingCard: [], fallOfWickets: [], extras: { total: 0, details: ''}
        }
    },
    "match_6": {
        playerOfTheMatch: { name: "Virat Kohli", teamName: "Hilton College 1st XI", justification: "A magnificent century (102 off 60) laid the platform for a dominant victory."},
        innings1: {
            teamName: "Hilton College 1st XI", totalRuns: 205, wickets: 4, overs: 20,
            battingCard: [], bowlingCard: [], fallOfWickets: [], extras: { total: 0, details: ''}
        },
        innings2: {
            teamName: "Maritzburg College 1st XI", totalRuns: 150, wickets: 9, overs: 20,
            battingCard: [], bowlingCard: [], fallOfWickets: [], extras: { total: 0, details: ''}
        }
    }
};

    


