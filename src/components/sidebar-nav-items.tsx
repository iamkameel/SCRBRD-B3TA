import { LayoutDashboard, Users, User, PlusCircle, CalendarDays, MapPin, Building, Trophy, ClipboardList, Settings, Database, UserCog } from 'lucide-react';

export const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: ClipboardList },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/players', label: 'Players', icon: User },
    { href: '/seasons', label: 'Seasons', icon: CalendarDays },
    { href: '/schools', label: 'Schools', icon: Building },
    { href: '/divisions', label: 'Divisions', icon: Trophy },
    { href: '/fields', label: 'Fields', icon: MapPin },
    { href: '/user-management', label: 'User Management', icon: UserCog },
    { href: '/data-management', label: 'Data Management', icon: Database },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/new-match', label: 'New Match', icon: PlusCircle },
];
