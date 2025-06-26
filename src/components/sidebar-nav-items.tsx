
import { LayoutDashboard, Users, User, Bus, CalendarDays, MapPin, Building, Trophy, ClipboardList, Database } from 'lucide-react';

export const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: ClipboardList },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/players', label: 'People', icon: User },
    { href: '/seasons', label: 'Seasons', icon: CalendarDays },
    { href: '/schools', label: 'Schools', icon: Building },
    { href: '/divisions', label: 'Divisions', icon: Trophy },
    { href: '/fields', label: 'Fields', icon: MapPin },
    { href: '/transport', label: 'Transport', icon: Bus },
    { href: '/data-management', label: 'Data Management', icon: Database },
];
