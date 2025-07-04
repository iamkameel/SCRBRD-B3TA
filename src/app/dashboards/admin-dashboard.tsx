'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle, UserCog, ShieldCheck, Database, BarChart2, Users, Shield, MapPin, Trophy, ClipboardList, Bus, Building, HeartPulse, HardHat, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import { Button } from '@/components/ui/button';

interface AdminDashboardData {
    kpis: {
        officials: number;
        competitions: number;
        schools: number;
        teams: number;
        players: number;
        staff: number;
        medicalSupport: number;
        fields: number;
        groundStaff: number;
        transportHub: number;
    };
}

function KpiCard({ title, value, description, href, icon: Icon }: { title: string, value: string | number, description: string, href: string, icon: React.ElementType }) {
    return (
        <Card className="flex flex-col transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">
                      <Link href={href} className="hover:underline">
                          {title}
                      </Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Button asChild variant="ghost" size="icon" className="h-6 w-6 -mt-2 -mr-2 text-muted-foreground hover:text-foreground">
                    <Link href={href}>
                        <PlusCircle className="h-5 w-5" />
                        <span className="sr-only">Add or manage {title}</span>
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
                <Link href={href} className="flex items-baseline gap-2 text-foreground">
                    <p className="text-4xl font-bold">{value}</p>
                    <Icon className="h-5 w-5 text-muted-foreground mb-1" />
                </Link>
            </CardContent>
        </Card>
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

  const kpiCards = [
    { title: "Officials", value: kpis.officials, description: "Umpires & Scorers", href: "/people", icon: ShieldCheck },
    { title: "Competitions", value: kpis.competitions, description: "Leagues & Cups", href: "/competitions", icon: Trophy },
    { title: "Schools", value: kpis.schools, description: "Registered Institutions", href: "/schools", icon: Building },
    { title: "Teams", value: kpis.teams, description: "Across all divisions", href: "/teams", icon: Users },
    { title: "Players", value: kpis.players, description: "Registered Athletes", href: "/people", icon: User },
    { title: "Staff", value: kpis.staff, description: "Coaches & Admins", href: "/people", icon: UserCog },
    { title: "Medical & Support", value: kpis.medicalSupport, description: "First Aid, Physios", href: "/people", icon: HeartPulse },
    { title: "Fields & Venues", value: kpis.fields, description: "Available for booking", href: "/fields", icon: MapPin },
    { title: "Ground Staff", value: kpis.groundStaff, description: "Assigned Keepers", href: "/people", icon: HardHat },
    { title: "Transport Hub", value: kpis.transportHub, description: "Vehicles in Fleet", href: "/transport", icon: Bus },
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
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpiCards.map(card => (
              <KpiCard key={card.title} {...card} />
            ))}
        </div>
    </div>
  );
}
