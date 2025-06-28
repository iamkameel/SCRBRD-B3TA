import { LayoutDashboard, Users, User, Bus, CalendarDays, MapPin, Building, Trophy, ClipboardList, Database, Shield, UserCog, GitCompareArrows } from 'lucide-react';

export const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: ClipboardList },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/people', label: 'People', icon: User },
    { href: '/competitions', label: 'Competitions', icon: Shield },
    { href: '/analysis', label: 'Analysis Hub', icon: GitCompareArrows },
    { href: '/seasons', label: 'Seasons', icon: CalendarDays },
    { href: '/schools', label: 'Schools', icon: Building },
    { href: '/divisions', label: 'Divisions', icon: Trophy },
    { href: '/fields', label: 'Fields', icon: MapPin },
    { href: '/transport', label: 'Transport', icon: Bus },
    { href: '/user-management', label: 'User Management', icon: UserCog },
    { href: '/data-management', label: 'Data Management', icon: Database },
];
