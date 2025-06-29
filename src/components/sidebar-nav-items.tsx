
import {
    LayoutDashboard, Users, User, Bus, CalendarDays, MapPin, Building, Trophy, ClipboardList, Database,
    Shield, UserCog, GitCompareArrows, Medal, Camera, Handshake, Landmark, Backpack,
    Swords,
    Wrench,
    Banknote,
    Cog,
    HeartPulse,
    Dumbbell
} from 'lucide-react';

const adminTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const adminNavGroups = [
    {
        title: "Match Operations",
        icon: Swords,
        items: [
            { href: '/matches', label: 'All Matches', icon: ClipboardList },
            { href: '/umpire-review', label: 'Umpire Review', icon: Camera },
            { href: '/analysis', label: 'Head-to-Head', icon: GitCompareArrows },
        ]
    },
    {
        title: "Participants",
        icon: Users,
        items: [
            { href: '/teams', label: 'Teams', icon: Users },
            { href: '/people', label: 'People', icon: User },
            { href: '/schools', label: 'Schools', icon: Building, adminOnly: true },
        ]
    },
    {
        title: "League Structure",
        icon: Trophy,
        items: [
            { href: '/competitions', label: 'Competitions', icon: Shield },
            { href: '/seasons', label: 'Seasons', icon: CalendarDays, adminOnly: true },
            { href: '/divisions', label: 'Divisions', icon: Medal, adminOnly: true },
            { href: '/rankings', label: 'Rankings', icon: Trophy },
        ]
    },
    {
        title: "Resources & Logistics",
        icon: Wrench,
        adminOnly: true,
        items: [
            { href: '/fields', label: 'Fields', icon: MapPin, adminOnly: true },
            { href: '/equipment', label: 'Equipment', icon: Backpack, adminOnly: true },
            { href: '/transport', label: 'Transport', icon: Bus, adminOnly: true },
        ]
    },
    {
        title: "Finance & Partnerships",
        icon: Banknote,
        adminOnly: true,
        items: [
            { href: '/sponsors', label: 'Sponsors', icon: Handshake, adminOnly: true },
            { href: '/financials', label: 'Financials', icon: Landmark, adminOnly: true },
        ]
    },
    {
        title: "System Administration",
        icon: Cog,
        adminOnly: true,
        items: [
            { href: '/user-management', label: 'User Management', icon: UserCog, adminOnly: true },
            { href: '/data-management', label: 'Data Management', icon: Database, adminOnly: true },
        ]
    }
];

const sportsmasterNavGroups = [
    {
        title: "League Structure",
        icon: Trophy,
        items: [
            { href: '/competitions', label: 'Competitions', icon: Shield },
            { href: '/seasons', label: 'Seasons', icon: CalendarDays },
            { href: '/divisions', label: 'Divisions', icon: Medal },
            { href: '/rankings', label: 'Rankings', icon: Trophy },
        ]
    },
    {
        title: "Match Operations",
        icon: Swords,
        items: [
            { href: '/matches', label: 'All Matches', icon: ClipboardList },
            { href: '/umpire-review', label: 'Umpire Review', icon: Camera },
        ]
    },
     {
        title: "Participants",
        icon: Users,
        items: [
            { href: '/teams', label: 'Teams', icon: Users },
            { href: '/people', label: 'People', icon: User },
            { href: '/schools', label: 'Schools', icon: Building },
        ]
    },
    {
        title: "Resources",
        icon: Wrench,
        items: [
            { href: '/fields', label: 'Fields', icon: MapPin },
        ]
    },
];

const playerCoachTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const playerCoachNavGroups = [
    {
        title: "My Matches",
        icon: Swords,
        items: [
            { href: '/matches', label: 'Fixtures & Results', icon: ClipboardList },
        ]
    },
    {
        title: "My Teams",
        icon: Users,
        items: [
            { href: '/teams', label: 'Team Hubs', icon: Users },
            { href: '/people', label: 'My Profile', icon: User },
        ]
    },
    {
        title: "Analysis",
        icon: Trophy,
        items: [
            { href: '/rankings', label: 'Leaderboards', icon: Trophy },
            { href: '/analysis', label: 'Head-to-Head', icon: GitCompareArrows },
        ]
    }
];

const officialTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const officialNavGroups = [
    {
        title: "Assignments",
        icon: ClipboardList,
        items: [
            { href: '/matches', label: 'All Matches', icon: ClipboardList },
        ]
    }
];

const driverTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const driverNavGroups = [
    {
        title: "Assignments",
        icon: Bus,
        items: [
            { href: '/transport', label: 'My Schedule', icon: Bus },
        ]
    }
];

const groundskeeperTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const groundskeeperNavGroups = [
    {
        title: "Facilities",
        icon: Wrench,
        items: [
            { href: '/fields', label: 'All Fields', icon: MapPin },
        ]
    }
];

const guardianTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const guardianNavGroups = [
    {
        title: "My Family",
        icon: Users,
        items: [
            { href: '/matches', label: 'Schedule', icon: CalendarDays },
            { href: '/teams', label: 'Teams', icon: Users },
            { href: '/people', label: 'Profiles', icon: User },
        ]
    }
];

const trainerTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const trainerNavGroups = [
     {
        title: "Athletes",
        icon: Dumbbell,
        items: [
            { href: '/people', label: 'Athlete Roster', icon: Users },
        ]
    }
];

const spectatorTopLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const spectatorNavGroups = [
    {
        title: "Explore",
        icon: Trophy,
        items: [
            { href: '/matches', label: 'All Matches', icon: ClipboardList },
            { href: '/rankings', label: 'Rankings', icon: Trophy },
        ]
    }
];


export function getNavConfig(role: string) {
    switch (role) {
        case 'Admin':
            return { topLevel: adminTopLevelNavItems, groups: adminNavGroups };
        case 'Sportsmaster':
            return { topLevel: adminTopLevelNavItems, groups: sportsmasterNavGroups };
        case 'Coach':
        case 'Assistant Coach':
        case 'Captain':
        case 'Team Manager':
            return { topLevel: playerCoachTopLevelNavItems, groups: playerCoachNavGroups };
        case 'Player':
             return { topLevel: playerCoachTopLevelNavItems, groups: playerCoachNavGroups };
        case 'Umpire':
        case 'Scorer':
            return { topLevel: officialTopLevelNavItems, groups: officialNavGroups };
        case 'Driver':
            return { topLevel: driverTopLevelNavItems, groups: driverNavGroups };
        case 'Grounds-Keeper':
            return { topLevel: groundskeeperTopLevelNavItems, groups: groundskeeperNavGroups };
        case 'Guardian':
            return { topLevel: guardianTopLevelNavItems, groups: guardianNavGroups };
        case 'Trainer':
            return { topLevel: trainerTopLevelNavItems, groups: trainerNavGroups };
        case 'Spectator':
            return { topLevel: spectatorTopLevelNavItems, groups: spectatorNavGroups };
        default:
             // Default to a safe, minimal navigation for any other roles
            return { topLevel: spectatorTopLevelNavItems, groups: spectatorNavGroups };
    }
}
