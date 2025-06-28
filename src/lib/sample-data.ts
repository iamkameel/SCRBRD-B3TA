

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
        { schoolId: 'temp_school_3', name: 'Riverside Secondary', abbreviation: 'RSS' },
        { schoolId: 'temp_school_4', name: 'Mountain View Prep', abbreviation: 'MVP' },
        { schoolId: 'temp_school_5', name: 'Cedar Ridge Institute', abbreviation: 'CRI' },
        { schoolId: 'temp_school_6', name: 'Pinecrest Collegiate', abbreviation: 'PCS' },
        { schoolId: 'temp_school_7', name: 'Bayview Academy', abbreviation: 'BVA' },
        { schoolId: 'temp_school_8', name: 'Summit School', abbreviation: 'SUM' },
        { schoolId: 'temp_school_9', name: 'Northwood International', abbreviation: 'NIS' },
        { schoolId: 'temp_school_10', name: 'Westfield Grammar', abbreviation: 'WGS' },
        { schoolId: 'temp_school_11', name: 'Bridgewater College', abbreviation: 'BWC' },
        { schoolId: 'temp_school_12', name: 'Aston Hall', abbreviation: 'AST' },
        { schoolId: 'temp_school_13', name: 'Elmwood Day School', abbreviation: 'EDS' },
        { schoolId: 'temp_school_14', name: 'Forrest Hill', abbreviation: 'FHS' },
    ],
    divisions: [
        { divisionId: 'temp_div_1', name: 'U19 Varsity Division 1' },
        { divisionId: 'temp_div_2', name: 'U16 Junior Varsity' },
        { divisionId: 'temp_div_3', name: 'U19 Varsity Division 2' },
        { divisionId: 'temp_div_4', name: 'U16 Junior Division 2' },
    ],
    seasons: [
        { seasonId: 'temp_season_1', name: '2024-2025 Season', startDate: pastDate(30), endDate: futureDate(90), active: true },
        { seasonId: 'temp_season_2', name: '2023-2024 Season', startDate: pastDate(395), endDate: pastDate(275), active: false },
    ],
    fields: [
        { fieldId: 'temp_field_1', name: 'Main Oval', surfaceType: 'Grass', facilities: 'Pavilion, Toilets, Nets', status: 'Available' },
        { fieldId: 'temp_field_2', name: 'North Field', surfaceType: 'Turf', facilities: 'Nets, Canteen', status: 'Maintenance' },
        { fieldId: 'temp_field_3', name: 'Westwood Park', surfaceType: 'Grass', facilities: 'Toilets', status: 'Available' },
        { fieldId: 'temp_field_4', name: 'South Academy Pitch', surfaceType: 'Artificial', facilities: 'Nets', status: 'Available' },
    ],
    vehicles: [
        { vehicleId: 'temp_vehicle_1', name: 'Minibus 1', type: 'Minibus', capacity: 16, registration: 'GHS-01' },
        { vehicleId: 'temp_vehicle_2', name: 'Van', type: 'Van', capacity: 8, registration: 'OAKS-01' },
        { vehicleId: 'temp_vehicle_3', name: 'Main Bus', type: 'Bus', capacity: 40, registration: 'GHS-02' }
    ],
    financials: [
        { transactionId: 'temp_trans_1', description: 'U19 Varsity League Registration Fees', amount: 1500, type: 'Income', category: 'Registration Fee', date: pastDate(25) },
        { transactionId: 'temp_trans_2', description: 'Awesome Inc. Sponsorship', amount: 5000, type: 'Income', category: 'Sponsorship', date: pastDate(20) },
        { transactionId: 'temp_trans_3', description: 'Main Oval Hire for Pre-Season Series', amount: 750, type: 'Expense', category: 'Venue Hire', date: pastDate(15) },
        { transactionId: 'temp_trans_4', description: 'Purchase of 12 new cricket balls', amount: 300, type: 'Expense', category: 'Equipment', date: pastDate(10) },
        { transactionId: 'temp_trans_5', description: 'Umpire payment for Match #2', amount: 100, type: 'Expense', category: 'Umpire Fees', date: pastDate(14) },
    ],
    equipment: [
        { itemId: 'temp_equip_1', name: 'Kookaburra Bat', type: 'Bat', size: 'SH', status: 'Available' },
        { itemId: 'temp_equip_2', name: 'Gray-Nicolls Pads', type: 'Pads', size: 'Adult', status: 'Assigned' },
        { itemId: 'temp_equip_3', name: 'Masuri Helmet', type: 'Helmet', size: 'Large', status: 'Available' },
        { itemId: 'temp_equip_4', name: 'SG Club Ball (Box of 6)', type: 'Ball', status: 'Maintenance' },
        { itemId: 'temp_equip_5', name: 'Adidas Gloves', type: 'Gloves', size: 'Adult', status: 'Available' },
    ],
    equipmentAssignments: [
        { assignmentId: 'temp_assign_1', itemId: 'temp_equip_2', personId: 'p_1', assignedDate: pastDate(10) },
    ],
    people: [
        // Greenwood Gators (12 people)
        { personId: 'p_1', firstName: 'Liam', lastName: 'Smith', email: 'liam.smith@example.com', roles: ['Player', 'Captain'], profileImageUrl: 'https://placehold.co/400x400.png', notificationPreferences: { email: true, push: false } },
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
        { personId: 'p_12', firstName: 'David', lastName: 'Robinson', email: 'david.r@example.com', roles: ['Coach'], profileImageUrl: 'https://placehold.co/400x400.png', notificationPreferences: { email: true, push: false } },
        
        // Oakridge Oaks (12 people)
        { personId: 'p_13', firstName: 'Charlotte', lastName: 'Harris', email: 'charlotte.h@example.com', roles: ['Player', 'Captain'], profileImageUrl: 'https://placehold.co/400x400.png', notificationPreferences: { email: true, push: false } },
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
        { personId: 'p_admin', firstName: 'Admin', lastName: 'User', email: 'admin@scrbrd.app', roles: ['Admin'], notificationPreferences: { email: true, push: false } },
        
        // Riverside Rangers (12 people)
        { personId: 'p_27', firstName: 'Ethan', lastName: 'Carter', email: 'ethan.c@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_28', firstName: 'Aiden', lastName: 'Mitchell', email: 'aiden.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_29', firstName: 'Logan', lastName: 'Perez', email: 'logan.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_30', firstName: 'Caleb', lastName: 'Roberts', email: 'caleb.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_31', firstName: 'Ryan', lastName: 'Turner', email: 'ryan.t@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_32', firstName: 'Nathan', lastName: 'Phillips', email: 'nathan.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_33', firstName: 'Owen', lastName: 'Campbell', email: 'owen.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_34', firstName: 'Luke', lastName: 'Parker', email: 'luke.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_35', firstName: 'Jack', lastName: 'Evans', email: 'jack.e@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_36', firstName: 'Levi', lastName: 'Edwards', email: 'levi.e@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_37', firstName: 'Daniel', lastName: 'Collins', email: 'daniel.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_38', firstName: 'Sarah', lastName: 'Morgan', email: 'sarah.m@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },
        
        // Mountain View Mavericks (12 people)
        { personId: 'p_39', firstName: 'Lily', lastName: 'Stewart', email: 'lily.s@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_40', firstName: 'Grace', lastName: 'Sanchez', email: 'grace.s@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_41', firstName: 'Chloe', lastName: 'Morris', email: 'chloe.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_42', firstName: 'Zoe', lastName: 'Rogers', email: 'zoe.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_43', firstName: 'Aria', lastName: 'Reed', email: 'aria.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_44', firstName: 'Riley', lastName: 'Cook', email: 'riley.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_45', firstName: 'Nora', lastName: 'Morgan', email: 'nora.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_46', firstName: 'Scarlett', lastName: 'Bell', email: 'scarlett.b@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_47', firstName: 'Hannah', lastName: 'Murphy', email: 'hannah.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_48', firstName: 'Layla', lastName: 'Bailey', email: 'layla.b@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_49', firstName: 'Ellie', lastName: 'Rivera', email: 'ellie.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_50', firstName: 'Chris', lastName: 'Peterson', email: 'chris.p@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },

        // Cedar Ridge Centurions (12 people)
        { personId: 'p_51', firstName: 'Leo', lastName: 'Garcia', email: 'leo.g@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_52', firstName: 'Mateo', lastName: 'Martinez', email: 'mateo.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_53', firstName: 'Julian', lastName: 'Rodriguez', email: 'julian.r@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_54', firstName: 'Wyatt', lastName: 'Hernandez', email: 'wyatt.h@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_55', firstName: 'Isaiah', lastName: 'Lopez', email: 'isaiah.l@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_56', firstName: 'Eli', lastName: 'Gonzalez', email: 'eli.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_57', firstName: 'Josiah', lastName: 'Perez', email: 'josiah.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_58', firstName: 'Hudson', lastName: 'Gomez', email: 'hudson.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_59', firstName: 'Christian', lastName: 'Reyes', email: 'christian.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_60', firstName: 'Asher', lastName: 'Diaz', email: 'asher.d@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_61', firstName: 'Ezra', lastName: 'Cruz', email: 'ezra.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_62', firstName: 'Maria', lastName: 'Flores', email: 'maria.f@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },
        
        // Pinecrest Pythons (12 people)
        { personId: 'p_63', firstName: 'Aurora', lastName: 'Ramirez', email: 'aurora.r@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_64', firstName: 'Willow', lastName: 'Torres', email: 'willow.t@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_65', firstName: 'Nova', lastName: 'Gutierrez', email: 'nova.g@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_66', firstName: 'Luna', lastName: 'Jimenez', email: 'luna.j@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_67', firstName: 'Penelope', lastName: 'Mendoza', email: 'penelope.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_68', firstName: 'Stella', lastName: 'Alvarez', email: 'stella.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_69', firstName: 'Paisley', lastName: 'Castillo', email: 'paisley.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_70', firstName: 'Everly', lastName: 'Ortiz', email: 'everly.o@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_71', firstName: 'Naomi', lastName: 'Sandoval', email: 'naomi.s@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_72', firstName: 'Elena', lastName: 'Rojas', email: 'elena.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_73', firstName: 'Hazel', lastName: 'Vargas', email: 'hazel.v@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_74', firstName: 'John', lastName: 'Kim', email: 'john.k@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },
        
        // Bayview Blazers (U16) - 12 people
        { personId: 'p_75', firstName: 'Samuel', lastName: 'Wright', email: 'samuel.w@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_76', firstName: 'Gabriel', lastName: 'Lee', email: 'gabriel.l@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_77', firstName: 'Anthony', lastName: 'Walker', email: 'anthony.w@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_78', firstName: 'David', lastName: 'Hall', email: 'david.h@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_79', firstName: 'Joseph', lastName: 'Allen', email: 'joseph.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_80', firstName: 'Andrew', lastName: 'Young', email: 'andrew.y@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_81', firstName: 'Matthew', lastName: 'King', email: 'matthew.k@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_82', firstName: 'Joshua', lastName: 'Scott', email: 'joshua.s@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_83', firstName: 'Christopher', lastName: 'Green', email: 'christopher.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_84', firstName: 'Daniel', lastName: 'Adams', email: 'daniel.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_85', firstName: 'Isaac', lastName: 'Nelson', email: 'isaac.n@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_86', firstName: 'Laura', lastName: 'Hill', email: 'laura.h@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },

        // Summit Strikers (U16) - 12 people
        { personId: 'p_87', firstName: 'Victoria', lastName: 'Baker', email: 'victoria.b@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_88', firstName: 'Madison', lastName: 'Gonzalez', email: 'madison.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_89', firstName: 'Bella', lastName: 'Carter', email: 'bella.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_90', firstName: 'Claire', lastName: 'Mitchell', email: 'claire.m@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_91', firstName: 'Skylar', lastName: 'Perez', email: 'skylar.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_92', firstName: 'Lucy', lastName: 'Roberts', email: 'lucy.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_93', firstName: 'Audrey', lastName: 'Turner', email: 'audrey.t@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_94', firstName: 'Brooklyn', lastName: 'Phillips', email: 'brooklyn.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_95', firstName: 'Savannah', lastName: 'Campbell', email: 'savannah.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_96', firstName: 'Leah', lastName: 'Parker', email: 'leah.p@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_97', firstName: 'Gabriella', lastName: 'Evans', email: 'gabriella.e@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_98', firstName: 'Mark', lastName: 'Taylor', email: 'mark.t@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },

        // Northwood Knights (U19 Div 2) - 12 people
        { personId: 'p_99', firstName: 'Jack', lastName: 'White', email: 'jack.w@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_100', firstName: 'Owen', lastName: 'Harris', email: 'owen.h@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_101', firstName: 'Dylan', lastName: 'Martin', email: 'dylan.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_102', firstName: 'Luke', lastName: 'Thompson', email: 'luke.t@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_103', firstName: 'Caleb', lastName: 'Garcia', email: 'caleb.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_104', firstName: 'Henry', lastName: 'Martinez', email: 'henry.m@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_105', firstName: 'Wyatt', lastName: 'Robinson', email: 'wyatt.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_106', firstName: 'Levi', lastName: 'Clark', email: 'levi.c@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_107', firstName: 'Eli', lastName: 'Rodriguez', email: 'eli.r@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_108', firstName: 'Isaiah', lastName: 'Lewis', email: 'isaiah.lewis@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_109', firstName: 'Julian', lastName: 'Lee', email: 'julian.l@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_110', firstName: 'Emily', lastName: 'Walker', email: 'emily.w@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },

        // Westfield Warriors (U19 Div 2) - 12 people
        { personId: 'p_111', firstName: 'Ella', lastName: 'Hall', email: 'ella.h@example.com', roles: ['Player', 'Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_112', firstName: 'Avery', lastName: 'Allen', email: 'avery.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_113', firstName: 'Sofia', lastName: 'Young', email: 'sofia.y@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_114', firstName: 'Camila', lastName: 'King', email: 'camila.k@example.com', roles: ['Player', 'Vice-Captain'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_115', firstName: 'Aria', lastName: 'Wright', email: 'aria.wright@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_116', firstName: 'Mila', lastName: 'Scott', email: 'mila.s@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_117', firstName: 'Layla', lastName: 'Green', email: 'layla.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_118', firstName: 'Scarlett', lastName: 'Adams', email: 'scarlett.a@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_119', firstName: 'Chloe', lastName: 'Baker', email: 'chloe.b@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_120', firstName: 'Zoe', lastName: 'Gonzalez', email: 'zoe.g@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_121', firstName: 'Nora', lastName: 'Nelson', email: 'nora.n@example.com', roles: ['Player'], notificationPreferences: { email: true, push: false } },
        { personId: 'p_122', firstName: 'Kevin', lastName: 'Carter', email: 'kevin.c@example.com', roles: ['Coach'], notificationPreferences: { email: true, push: false } },

    ],
    competitions: [
        { competitionId: 'temp_comp_1', name: 'U19 Varsity League Division 1', type: 'League', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'In Progress' },
        { competitionId: 'temp_comp_2', name: 'U19 Pre-Season Tournament', type: 'Tournament', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'Completed', winnerTeamId: 'temp_team_1' },
        { competitionId: 'temp_comp_3', name: 'U19 Pre-Season Cup', type: 'Cup', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'In Progress' },
        { competitionId: 'temp_comp_4', name: 'Summer Sports Festival', type: 'Festival', seasonId: 'temp_season_1', divisionId: 'temp_div_1', status: 'Draft' },
        { competitionId: 'temp_comp_5', name: 'U16 Junior Varsity League', type: 'League', seasonId: 'temp_season_1', divisionId: 'temp_div_2', status: 'In Progress' },
        { competitionId: 'temp_comp_6', name: 'U19 Varsity League Division 2', type: 'League', seasonId: 'temp_season_1', divisionId: 'temp_div_3', status: 'In Progress' },
    ],
    teams: [
        { 
            teamId: 'temp_team_1', name: 'Greenwood Gators', schoolId: 'temp_school_1', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#0A7A42', secondary: '#FFC72C' },
            roster: [
                { personId: 'p_1', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_2', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_3', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true }, { personId: 'p_4', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_5', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_6', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_7', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_8', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_9', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_10', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_11', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_12', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_2', name: 'Oakridge Oaks', schoolId: 'temp_school_2', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#5D3A00', secondary: '#E0E0E0' },
            roster: [
                { personId: 'p_13', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_14', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_15', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true }, { personId: 'p_16', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_17', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_18', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_19', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_20', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_21', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_22', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_23', role: 'Player', status: 'injured', isCaptain: false, isViceCaptain: false }, { personId: 'p_24', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_3', name: 'Riverside Rangers', schoolId: 'temp_school_3', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#005f73', secondary: '#94d2bd' },
            roster: [
                { personId: 'p_27', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_28', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_29', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_30', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_31', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_32', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_33', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_34', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_35', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_36', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_37', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_38', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_4', name: 'Mountain View Mavericks', schoolId: 'temp_school_4', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#4a4e69', secondary: '#c9ada7' },
            roster: [
                { personId: 'p_39', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_40', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_41', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_42', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_43', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_44', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_45', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_46', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_47', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_48', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_49', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_50', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_5', name: 'Cedar Ridge Centurions', schoolId: 'temp_school_5', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#8d0801', secondary: '#f4a259' },
            roster: [
                { personId: 'p_51', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_52', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_53', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true }, { personId: 'p_54', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_55', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_56', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_57', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_58', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_59', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_60', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_61', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_62', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_6', name: 'Pinecrest Pythons', schoolId: 'temp_school_6', divisionId: 'temp_div_1', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#003049', secondary: '#d62828' },
            roster: [
                { personId: 'p_63', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_64', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_65', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true }, { personId: 'p_66', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_67', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_68', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_69', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_70', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_71', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_72', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_73', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_74', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_7', name: 'Bayview Blazers', schoolId: 'temp_school_7', divisionId: 'temp_div_2', seasonId: 'temp_season_1', teamClass: 'U16 A',
            teamColors: { primary: '#0077b6', secondary: '#caf0f8' },
            roster: [
                { personId: 'p_75', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_76', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_77', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_78', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true },
                { personId: 'p_79', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_80', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_81', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_82', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_83', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_84', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_85', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_86', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_8', name: 'Summit Strikers', schoolId: 'temp_school_8', divisionId: 'temp_div_2', seasonId: 'temp_season_1', teamClass: 'U16 A',
            teamColors: { primary: '#6a040f', secondary: '#f8f9fa' },
            roster: [
                { personId: 'p_87', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_88', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_89', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_90', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true },
                { personId: 'p_91', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_92', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_93', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_94', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_95', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_96', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_97', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_98', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_9', name: 'Northwood Knights', schoolId: 'temp_school_9', divisionId: 'temp_div_3', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#03045e', secondary: '#adb5bd' },
            roster: [
                { personId: 'p_99', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_100', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_101', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_102', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true },
                { personId: 'p_103', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_104', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_105', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_106', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_107', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_108', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_109', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_110', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
        { 
            teamId: 'temp_team_10', name: 'Westfield Warriors', schoolId: 'temp_school_10', divisionId: 'temp_div_3', seasonId: 'temp_season_1', teamClass: '1st XI',
            teamColors: { primary: '#fca311', secondary: '#14213d' },
            roster: [
                { personId: 'p_111', role: 'Player', status: 'active', isCaptain: true, isViceCaptain: false }, { personId: 'p_112', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_113', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_114', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: true },
                { personId: 'p_115', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_116', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_117', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_118', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_119', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_120', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false },
                { personId: 'p_121', role: 'Player', status: 'active', isCaptain: false, isViceCaptain: false }, { personId: 'p_122', role: 'Coach', status: 'active', isCaptain: false, isViceCaptain: false },
            ]
        },
    ],
    matches: [
        { 
            matchId: 'temp_match_1', teamAId: 'temp_team_1', teamBId: 'temp_team_2', 
            competitionId: 'temp_comp_1', fieldId: 'temp_field_1', dateTime: futureDate(7), status: 'scheduled' 
        },
         { 
            matchId: 'temp_match_2', teamAId: 'temp_team_2', teamBId: 'temp_team_1', 
            competitionId: 'temp_comp_2', fieldId: 'temp_field_2', dateTime: pastDate(14), status: 'completed' 
        },
        { 
            matchId: 'temp_match_3', teamAId: 'temp_team_1', teamBId: 'temp_team_3', 
            competitionId: 'temp_comp_3', fieldId: 'temp_field_1', dateTime: pastDate(2), status: 'completed', round: 1,
        },
        { 
            matchId: 'temp_match_4', teamAId: 'temp_team_2', teamBId: 'temp_team_4', 
            competitionId: 'temp_comp_3', fieldId: 'temp_field_2', dateTime: futureDate(1), status: 'scheduled', round: 1,
        },
        { 
            matchId: 'temp_match_5', teamAId: 'temp_team_1', teamBId: '', 
            competitionId: 'temp_comp_3', fieldId: 'temp_field_1', dateTime: futureDate(10), status: 'scheduled', round: 2,
        },
        { 
            matchId: 'temp_match_6', teamAId: 'temp_team_3', teamBId: 'temp_team_4', 
            competitionId: 'temp_comp_1', fieldId: 'temp_field_2', dateTime: new Date().toISOString(), status: 'live' 
        },
        { 
            matchId: 'temp_match_7', teamAId: 'temp_team_7', teamBId: 'temp_team_8', 
            competitionId: 'temp_comp_5', fieldId: 'temp_field_3', dateTime: pastDate(5), status: 'completed'
        },
        { 
            matchId: 'temp_match_8', teamAId: 'temp_team_9', teamBId: 'temp_team_10', 
            competitionId: 'temp_comp_6', fieldId: 'temp_field_4', dateTime: futureDate(3), status: 'scheduled'
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
            teamName: "Oakridge Oaks", totalRuns: 164, wickets: 5, overs: 20,
            battingCard: [
                { name: "Charlotte Harris", status: "c. Smith b. Jones", runs: 25, balls: 15, fours: 4, sixes: 1, strikeRate: 166.67 }, { name: "Amelia Clark", status: "b. Anderson", runs: 10, balls: 8, fours: 2, sixes: 0, strikeRate: 125.00 },
                { name: "Evelyn Lewis", status: "not out", runs: 75, balls: 50, fours: 6, sixes: 3, strikeRate: 150.00 }, { name: "Abigail Walker", status: "run out (Wilson)", runs: 12, balls: 15, fours: 1, sixes: 0, strikeRate: 80.00 },
                { name: "Harper Hall", status: "lbw b. Taylor", runs: 5, balls: 7, fours: 0, sixes: 0, strikeRate: 71.43 }, { name: "Sophia Allen", status: "c. Davis b. Jones", runs: 18, balls: 13, fours: 2, sixes: 1, strikeRate: 138.46 },
                { name: "Isabella Young", status: "not out", runs: 8, balls: 12, fours: 1, sixes: 0, strikeRate: 66.67 }, { name: "Mia King", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Ava Wright", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 }, { name: "Olivia Scott", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Emma Green", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Noah Jones", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 }, { name: "Mason Anderson", overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
                { name: "Benjamin Miller", overs: 4, maidens: 0, runs: 30, wickets: 0, economy: 7.50 }, { name: "Alexander Taylor", overs: 4, maidens: 0, runs: 25, wickets: 1, economy: 6.25 },
                { name: "Michael Thomas", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
            ],
            fallOfWickets: [
                { runs: 28, wicket: 1, batsmanName: "Amelia Clark", over: 3.2 }, { runs: 55, wicket: 2, batsmanName: "Charlotte Harris", over: 6.1 },
                { runs: 80, wicket: 3, batsmanName: "Abigail Walker", over: 10.5 }, { runs: 95, wicket: 4, batsmanName: "Harper Hall", over: 13.2 },
                { runs: 120, wicket: 5, batsmanName: "Sophia Allen", over: 16.4 },
            ],
            extras: { total: 11, details: "(w 5, nb 1, b 4, lb 1)" },
        },
        innings2: {
            teamName: "Greenwood Gators", totalRuns: 152, wickets: 7, overs: 20,
            battingCard: [
                { name: "Liam Smith", status: "c. Clark b. Scott", runs: 45, balls: 30, fours: 5, sixes: 2, strikeRate: 150.00 }, { name: "Noah Jones", status: "b. Green", runs: 2, balls: 5, fours: 0, sixes: 0, strikeRate: 40.00 },
                { name: "Oliver Williams", status: "b. Wright", runs: 33, balls: 28, fours: 3, sixes: 1, strikeRate: 117.86 }, { name: "Elijah Brown", status: "st King b. Scott", runs: 15, balls: 15, fours: 1, sixes: 0, strikeRate: 100.00 },
                { name: "James Davis", status: "run out (Harris)", runs: 8, balls: 10, fours: 0, sixes: 0, strikeRate: 80.00 }, { name: "Benjamin Miller", status: "c & b Wright", runs: 22, balls: 18, fours: 2, sixes: 0, strikeRate: 122.22 },
                { name: "Lucas Wilson", status: "not out", runs: 10, balls: 9, fours: 1, sixes: 0, strikeRate: 111.11 }, { name: "Henry Moore", status: "b. Green", runs: 1, balls: 3, fours: 0, sixes: 0, strikeRate: 33.33 },
                { name: "Alexander Taylor", status: "not out", runs: 5, balls: 2, fours: 1, sixes: 0, strikeRate: 250.00 }, { name: "Mason Anderson", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Michael Thomas", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Ava Wright", overs: 4, maidens: 0, runs: 25, wickets: 2, economy: 6.25 }, { name: "Olivia Scott", overs: 4, maidens: 0, runs: 30, wickets: 2, economy: 7.50 },
                { name: "Emma Green", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 }, { name: "Isabella Young", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
                { name: "Mia King", overs: 4, maidens: 0, runs: 24, wickets: 0, economy: 6.00 },
            ],
            fallOfWickets: [
                { runs: 10, wicket: 1, batsmanName: "Noah Jones", over: 2.1 }, { runs: 65, wicket: 2, batsmanName: "Liam Smith", over: 8.3 },
                { runs: 90, wicket: 3, batsmanName: "Elijah Brown", over: 12.4 }, { runs: 105, wicket: 4, batsmanName: "James Davis", over: 15.1 },
                { runs: 130, wicket: 5, batsmanName: "Oliver Williams", over: 17.2 }, { runs: 140, wicket: 6, batsmanName: "Benjamin Miller", over: 18.5 },
                { runs: 142, wicket: 7, batsmanName: "Henry Moore", over: 19.2 },
            ],
            extras: { total: 11, details: "(w 6, nb 2, b 2, lb 1)" },
        },
    },
    "temp_match_3": {
        playerOfTheMatch: {
            name: "Liam Smith", teamName: "Greenwood Gators",
            justification: "For an explosive innings of 88 runs from just 45 balls, setting up a dominant victory for the Greenwood Gators with powerful hitting and a high strike rate.",
        },
        innings1: {
            teamName: "Greenwood Gators", totalRuns: 195, wickets: 4, overs: 20,
            battingCard: [
                { name: "Liam Smith", status: "c. Carter b. Parker", runs: 88, balls: 45, fours: 9, sixes: 4, strikeRate: 195.56 }, { name: "Noah Jones", status: "b. Campbell", runs: 12, balls: 10, fours: 2, sixes: 0, strikeRate: 120.00 },
                { name: "Oliver Williams", status: "not out", runs: 52, balls: 40, fours: 5, sixes: 1, strikeRate: 130.00 }, { name: "Elijah Brown", status: "c. Evans b. Phillips", runs: 20, balls: 15, fours: 2, sixes: 1, strikeRate: 133.33 },
                { name: "James Davis", status: "b. Campbell", runs: 1, balls: 3, fours: 0, sixes: 0, strikeRate: 33.33 }, { name: "Benjamin Miller", status: "not out", runs: 10, balls: 7, fours: 1, sixes: 0, strikeRate: 142.86 },
                { name: "Lucas Wilson", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 }, { name: "Henry Moore", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Alexander Taylor", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 }, { name: "Mason Anderson", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Michael Thomas", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Owen Campbell", overs: 4, maidens: 0, runs: 35, wickets: 2, economy: 8.75 }, { name: "Luke Parker", overs: 4, maidens: 0, runs: 40, wickets: 1, economy: 10.00 },
                { name: "Nathan Phillips", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.50 }, { name: "Jack Evans", overs: 4, maidens: 0, runs: 45, wickets: 0, economy: 11.25 },
                { name: "Daniel Collins", overs: 4, maidens: 0, runs: 38, wickets: 0, economy: 9.50 },
            ],
            fallOfWickets: [
                { runs: 25, wicket: 1, batsmanName: "Noah Jones", over: 3.1 }, { runs: 130, wicket: 2, batsmanName: "Liam Smith", over: 12.5 },
                { runs: 165, wicket: 3, batsmanName: "Elijah Brown", over: 16.2 }, { runs: 170, wicket: 4, batsmanName: "James Davis", over: 17.4 },
            ],
            extras: { total: 12, details: "(w 7, nb 1, b 3, lb 1)" },
        },
        innings2: {
            teamName: "Riverside Rangers", totalRuns: 140, wickets: 9, overs: 20,
            battingCard: [
                { name: "Ethan Carter", status: "c. Moore b. Miller", runs: 30, balls: 25, fours: 4, sixes: 0, strikeRate: 120.00 }, { name: "Aiden Mitchell", status: "b. Anderson", runs: 5, balls: 8, fours: 1, sixes: 0, strikeRate: 62.50 },
                { name: "Logan Perez", status: "run out (Smith)", runs: 45, balls: 35, fours: 5, sixes: 1, strikeRate: 128.57 }, { name: "Caleb Roberts", status: "lbw b. Taylor", runs: 10, balls: 12, fours: 1, sixes: 0, strikeRate: 83.33 },
                { name: "Ryan Turner", status: "c. Davis b. Jones", runs: 2, balls: 5, fours: 0, sixes: 0, strikeRate: 40.00 }, { name: "Nathan Phillips", status: "c. Wilson b. Miller", runs: 15, balls: 14, fours: 1, sixes: 0, strikeRate: 107.14 },
                { name: "Owen Campbell", status: "b. Anderson", runs: 8, balls: 9, fours: 0, sixes: 0, strikeRate: 88.89 }, { name: "Luke Parker", status: "not out", runs: 7, balls: 8, fours: 0, sixes: 0, strikeRate: 87.50 },
                { name: "Jack Evans", status: "b. Jones", runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0.00 }, { name: "Levi Edwards", status: "b. Miller", runs: 2, balls: 2, fours: 0, sixes: 0, strikeRate: 100.00 },
                { name: "Daniel Collins", status: "not out", runs: 1, balls: 1, fours: 0, sixes: 0, strikeRate: 100.00 },
            ],
            bowlingCard: [
                { name: "Noah Jones", overs: 4, maidens: 0, runs: 22, wickets: 2, economy: 5.50 }, { name: "Mason Anderson", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 },
                { name: "Benjamin Miller", overs: 4, maidens: 0, runs: 30, wickets: 3, economy: 7.50 }, { name: "Alexander Taylor", overs: 4, maidens: 0, runs: 25, wickets: 1, economy: 6.25 },
                { name: "Michael Thomas", overs: 4, maidens: 0, runs: 30, wickets: 0, economy: 7.50 },
            ],
            fallOfWickets: [
                { runs: 15, wicket: 1, batsmanName: "Aiden Mitchell", over: 3.2 }, { runs: 60, wicket: 2, batsmanName: "Ethan Carter", over: 9.1 },
                { runs: 85, wicket: 3, batsmanName: "Caleb Roberts", over: 12.4 }, { runs: 90, wicket: 4, batsmanName: "Ryan Turner", over: 13.5 },
                { runs: 118, wicket: 5, batsmanName: "Logan Perez", over: 16.3 }, { runs: 125, wicket: 6, batsmanName: "Nathan Phillips", over: 17.5 },
                { runs: 135, wicket: 7, batsmanName: "Owen Campbell", over: 19.1 }, { runs: 135, wicket: 8, batsmanName: "Jack Evans", over: 19.2 },
                { runs: 138, wicket: 9, batsmanName: "Levi Edwards", over: 19.4 },
            ],
            extras: { total: 15, details: "(w 8, nb 2, b 4, lb 1)" },
        },
    },
    "temp_match_7": {
        playerOfTheMatch: {
            name: "Samuel Wright",
            teamName: "Bayview Blazers",
            justification: "For a commanding 62 runs and a crucial wicket, demonstrating all-round excellence to lead the Bayview Blazers to victory.",
        },
        innings1: {
            teamName: "Bayview Blazers", totalRuns: 155, wickets: 6, overs: 20,
            battingCard: [
                { name: "Samuel Wright", status: "c. Baker b. Parker", runs: 62, balls: 40, fours: 7, sixes: 2, strikeRate: 155.00 }, { name: "Gabriel Lee", status: "b. Phillips", runs: 15, balls: 12, fours: 2, sixes: 0, strikeRate: 125.00 },
                { name: "Anthony Walker", status: "not out", runs: 35, balls: 30, fours: 3, sixes: 0, strikeRate: 116.67 }, { name: "David Hall", status: "c. Carter b. Campbell", runs: 10, balls: 15, fours: 1, sixes: 0, strikeRate: 66.67 },
                { name: "Joseph Allen", status: "b. Phillips", runs: 5, balls: 8, fours: 0, sixes: 0, strikeRate: 62.50 }, { name: "Andrew Young", status: "run out (Mitchell)", runs: 8, balls: 9, fours: 1, sixes: 0, strikeRate: 88.89 },
                { name: "Matthew King", status: "not out", runs: 4, balls: 6, fours: 0, sixes: 0, strikeRate: 66.67 }, { name: "Joshua Scott", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Christopher Green", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 }, { name: "Daniel Adams", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Isaac Nelson", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Brooklyn Phillips", overs: 4, maidens: 0, runs: 25, wickets: 2, economy: 6.25 }, { name: "Savannah Campbell", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.50 },
                { name: "Leah Parker", overs: 4, maidens: 0, runs: 32, wickets: 1, economy: 8.00 }, { name: "Gabriella Evans", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.00 },
                { name: "Audrey Turner", overs: 4, maidens: 0, runs: 23, wickets: 0, economy: 5.75 },
            ],
            fallOfWickets: [
                { runs: 25, wicket: 1, batsmanName: "Gabriel Lee", over: 3.5 }, { runs: 90, wicket: 2, batsmanName: "Samuel Wright", over: 11.2 },
                { runs: 110, wicket: 3, batsmanName: "David Hall", over: 14.6 }, { runs: 120, wicket: 4, batsmanName: "Joseph Allen", over: 16.1 },
                { runs: 140, wicket: 5, batsmanName: "Andrew Young", over: 18.2 },
            ],
            extras: { total: 16, details: "(w 10, nb 2, b 4, lb 0)" },
        },
        innings2: {
            teamName: "Summit Strikers", totalRuns: 135, wickets: 8, overs: 20,
            battingCard: [
                { name: "Victoria Baker", status: "c. Green b. Adams", runs: 28, balls: 22, fours: 3, sixes: 1, strikeRate: 127.27 }, { name: "Madison Gonzalez", status: "b. Wright", runs: 10, balls: 15, fours: 1, sixes: 0, strikeRate: 66.67 },
                { name: "Bella Carter", status: "c. Allen b. Scott", runs: 40, balls: 35, fours: 4, sixes: 0, strikeRate: 114.29 }, { name: "Claire Mitchell", status: "b. Wright", runs: 5, balls: 10, fours: 0, sixes: 0, strikeRate: 50.00 },
                { name: "Skylar Perez", status: "run out (King)", runs: 12, balls: 12, fours: 1, sixes: 0, strikeRate: 100.00 }, { name: "Lucy Roberts", status: "b. Adams", runs: 8, balls: 10, fours: 1, sixes: 0, strikeRate: 80.00 },
                { name: "Audrey Turner", status: "not out", runs: 15, balls: 11, fours: 2, sixes: 0, strikeRate: 136.36 }, { name: "Brooklyn Phillips", status: "b. Scott", runs: 1, balls: 3, fours: 0, sixes: 0, strikeRate: 33.33 },
                { name: "Savannah Campbell", status: "not out", runs: 2, balls: 2, fours: 0, sixes: 0, strikeRate: 100.00 }, { name: "Leah Parker", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
                { name: "Gabriella Evans", status: "did not bat", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            ],
            bowlingCard: [
                { name: "Samuel Wright", overs: 4, maidens: 0, runs: 20, wickets: 2, economy: 5.00 }, { name: "Joshua Scott", overs: 4, maidens: 0, runs: 28, wickets: 2, economy: 7.00 },
                { name: "Daniel Adams", overs: 4, maidens: 0, runs: 30, wickets: 2, economy: 7.50 }, { name: "Isaac Nelson", overs: 4, maidens: 0, runs: 25, wickets: 0, economy: 6.25 },
                { name: "Christopher Green", overs: 4, maidens: 1, runs: 27, wickets: 0, economy: 6.75 },
            ],
            fallOfWickets: [
                { runs: 20, wicket: 1, batsmanName: "Madison Gonzalez", over: 4.1 }, { runs: 55, wicket: 2, batsmanName: "Victoria Baker", over: 9.3 },
                { runs: 70, wicket: 3, batsmanName: "Claire Mitchell", over: 12.2 }, { runs: 95, wicket: 4, batsmanName: "Skylar Perez", over: 15.4 },
                { runs: 110, wicket: 5, batsmanName: "Bella Carter", over: 17.1 }, { runs: 120, wicket: 6, batsmanName: "Lucy Roberts", over: 18.3 },
                { runs: 125, wicket: 7, batsmanName: "Brooklyn Phillips", over: 19.1 },
            ],
            extras: { total: 14, details: "(w 8, nb 1, b 4, lb 1)" },
        },
    }
};
