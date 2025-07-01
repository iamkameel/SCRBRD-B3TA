
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, UserCog, Database, BarChart2, Users, Shield, MapPin, Trophy, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';

interface AdminDashboardData {
    kpis: {
        competitions: number;
        teams: number;
        players: number;
        fields: number;
    };
}

function KpiCard({ title, value, description, href, icon: Icon }: { title: string, value: string | number, description: string, href: string, icon: React.ElementType }) {
    return (
        <Link href={href}>
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getAdminDashboardData().then(fetchedData => {
      setData(fetchedData);
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Competitions" value={kpis.competitions} description="Active this season" href="/competitions" icon={Shield} />
            <KpiCard title="Teams" value={kpis.teams} description="All divisions" href="/teams" icon={Users} />
            <KpiCard title="Players" value={kpis.players} description="Registered" href="/people" icon={UserCog} />
            <KpiCard title="Fields & Venues" value={kpis.fields} description="Available for booking" href="/fields" icon={MapPin} />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Management Hub</CardTitle>
                <CardDescription>Quick access to key management areas.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AdminLink href="/teams" icon={Users} title="Team Management" description="Create teams and manage rosters." />
                <AdminLink href="/competitions" icon={Trophy} title="Competition Management" description="Manage leagues, cups, and tournaments."/>
                <AdminLink href="/matches" icon={ClipboardList} title="Fixture Management" description="Schedule matches and view results."/>
                <AdminLink href="/people" icon={UserCog} title="Personnel Management" description="Manage all players, staff, and users."/>
                <AdminLink href="/data-management" icon={Database} title="Data Management" description="Migrate sample data or clear the database." />
                <AdminLink href="/analysis" icon={BarChart2} title="Analysis Hub" description="Compare player and team stats." />
            </CardContent>
        </Card>
    </div>
  );
}

const AdminLink = ({href, icon: Icon, title, description}: {href: string, icon: React.ElementType, title: string, description: string}) => (
    <Link href={href} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors">
        <Icon className="w-8 h-8 text-primary shrink-0" />
        <div>
            <span className="font-semibold">{title}</span>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
    </Link>
)
