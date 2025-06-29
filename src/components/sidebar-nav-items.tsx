import {
    LayoutDashboard, Users, User, Bus, CalendarDays, MapPin, Building, Trophy, ClipboardList, Database,
    Shield, UserCog, GitCompareArrows, Medal, Camera, Handshake, Landmark, Backpack,
    Swords,
    Wrench,
    Banknote,
    Cog
} from 'lucide-react';

export const topLevelNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export const navGroups = [
    {
        title: "Match Operations",
        icon: Swords,
        items: [
            { href: '/matches', label: 'Matches', icon: ClipboardList },
            { href: '/umpire-review', label: 'Umpire Review', icon: Camera },
            { href: '/analysis', label: 'Compare', icon: GitCompareArrows },
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
