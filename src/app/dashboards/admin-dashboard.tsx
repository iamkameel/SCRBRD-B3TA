
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Users, Shield, Trophy, MapPin, Database, Bus, Building, ClipboardList, UserCog, Banknote, ArrowRight, User, PlusCircle } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import { Button } from '@/components/ui/button';

interface AdminDashboardData {
    kpis: {
        competitions: number;
        teams: number;
        players: number;
        fields: number;
    };
}

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}

function ManagementLink({ href, title, description, icon: Icon, addHref }: { href: string; title:string; description: string; icon: React.ElementType; addHref?: string }) {
    return (
        <div className="p-4 transition-colors border rounded-lg hover:bg-muted/50 flex items-center gap-4">
            <Icon className="w-8 h-8 text-muted-foreground shrink-0" />
            <Link href={href} className="flex-1 group">
                <h3 className="font-semibold group-hover:underline">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </Link>
            <div className="flex items-center shrink-0">
                {addHref ? (
                    <Button asChild variant="outline" size="icon" className="h-9 w-9">
                        <Link href={addHref} aria-label={`Add new for ${title}`}>
                            <PlusCircle className="h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                     <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href={href} aria-label={`Navigate to ${title}`}>
                           <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getAdminDashboardData().then(fetchedData => {
      setData(fetchedData as AdminDashboardData);
      setLoading(false);
    }).catch(error => {
      console.error("Failed to load admin dashboard data:", error);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { kpis } = data;

  const managementLinks = [
    { href: "/people", title: "Personnel Management", description: "Manage all players, staff, and officials.", icon: UserCog, addHref: "/people" },
    { href: "/teams", title: "Team Management", description: "Create teams and manage rosters.", icon: Users, addHref: "/teams" },
    { href: "/competitions", title: "Competition Management", description: "Set up leagues, cups, and tournaments.", icon: Trophy, addHref: "/competitions" },
    { href: "/matches", title: "Fixture Management", description: "Schedule and update all matches.", icon: ClipboardList, addHref: "/new-match" },
    { href: "/schools", title: "School & Division Management", description: "Manage schools, divisions, and seasons.", icon: Building, addHref: "/schools" },
    { href: "/fields", title: "Field & Venue Management", description: "Manage all available grounds.", icon: MapPin, addHref: "/fields" },
    { href: "/transport", title: "Transport Hub", description: "Manage vehicles and driver assignments.", icon: Bus, addHref: "/transport" },
    { href: "/financials", title: "Financials & Sponsors", description: "Track income, expenses, and sponsors.", icon: Banknote, addHref: "/financials" },
    { href: "/data-management", title: "Data Management", description: "Migrate sample data or clear records.", icon: Database },
  ];

  return (
    <div className="flex flex-col gap-8">
        <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm opacity-90">High-level overview of all operations.</p>
                </div>
            </div>
        </header>

        <Card>
            <CardHeader>
                <CardTitle>Global Overview</CardTitle>
                <CardDescription>High-level metrics across the entire system.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard title="Competitions" value={kpis.competitions} icon={Trophy} description="active this season" />
                <StatCard title="Teams" value={kpis.teams} icon={Users} description="across all divisions"/>
                <StatCard title="Total People" value={kpis.players} icon={User} description="registered" />
                <StatCard title="Fields & Venues" value={kpis.fields} icon={MapPin} description="available" />
            </CardContent>
        </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Management Hub</CardTitle>
                <CardDescription>Quick access to key management areas where you can add and assign resources.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
               {managementLinks.map(link => (
                   <ManagementLink key={link.href} {...link} />
               ))}
            </CardContent>
        </Card>
    </div>
  );
}
