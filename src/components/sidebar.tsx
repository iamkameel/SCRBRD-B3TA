'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CricketIcon } from '@/components/icons/cricket-icon';
import { cn } from '@/lib/utils';
import { navItems } from './sidebar-nav-items';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-col fixed inset-y-0 z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <CricketIcon className="h-6 w-6 text-sidebar-primary" />
          <span>SCRBRD</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
