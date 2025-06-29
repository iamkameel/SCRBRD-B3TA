
import { LayoutDashboard, Users, User, Bus, CalendarDays, MapPin, Building, Trophy, ClipboardList, Database, Shield, UserCog, GitCompareArrows, Medal, Camera, Handshake, Landmark, Backpack } from 'lucide-react';

export const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: ClipboardList },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/people', label: 'People', icon: User },
    { href: '/competitions', label: 'Competitions', icon: Shield },
    { href: '/rankings', label: 'Rankings', icon: Trophy },
    { href: '/analysis', label: 'Compare', icon: GitCompareArrows },
    { href: '/umpire-review', label: 'Umpire Review', icon: Camera },
    { href: '/seasons', label: 'Seasons', icon: CalendarDays, adminOnly: true },
    { href: '/schools', label: 'Schools', icon: Building, adminOnly: true },
    { href: '/divisions', label: 'Divisions', icon: Medal, adminOnly: true },
    { href: '/fields', label: 'Fields', icon: MapPin, adminOnly: true },
    { href: '/transport', label: 'Transport', icon: Bus, adminOnly: true },
    { href: '/equipment', label: 'Equipment', icon: Backpack, adminOnly: true },
    { href: '/sponsors', label: 'Sponsors', icon: Handshake, adminOnly: true },
    { href: '/financials', label: 'Financials', icon: Landmark, adminOnly: true },
    { href: '/user-management', label: 'User Management', icon: UserCog, adminOnly: true },
    { href: '/data-management', label: 'Data Management', icon: Database, adminOnly: true },
];
