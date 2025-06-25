
import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, Users, User, PlusCircle, CalendarDays, MapPin } from 'lucide-react';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CricketIcon } from '@/components/icons/cricket-icon';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'SCRBRD - Cricket Scorer',
  description: 'A modern cricket scoring and management tool.',
};

function Sidebar() {
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/players', label: 'Players', icon: User },
    { href: '/seasons', label: 'Seasons', icon: CalendarDays },
    { href: '/fields', label: 'Fields', icon: MapPin },
    { href: '/new-match', label: 'New Match', icon: PlusCircle },
  ];

  return (
    <aside className="w-64 flex-col fixed inset-y-0 z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <CricketIcon className="h-6 w-6 text-sidebar-primary" />
          <span>SCRBRD</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex flex-col flex-1 md:pl-64">
            <main className="flex-1 bg-background p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
