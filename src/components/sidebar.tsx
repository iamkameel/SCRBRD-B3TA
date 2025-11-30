

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { getNavConfig } from './sidebar-nav-items';
import { useAuth } from '@/lib/auth-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';

export function Sidebar() {
  const { person } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRole = person?.activeRole || 'Player'; // Default to a non-admin role

  const { topLevel: topLevelNavItems, groups: navGroups } = getNavConfig(activeRole);
  
  const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const defaultOpenItems = React.useMemo(() => 
    navGroups
      .filter(group => group.items.some(item => pathname.startsWith(item.href.split('?')[0])))
      .map(group => group.title),
    [pathname, navGroups]
  );

  return (
    <aside className="w-64 flex-col fixed inset-y-0 z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-bold text-sidebar-foreground">
          <Logo />
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {topLevelNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          
          <Accordion type="multiple" defaultValue={defaultOpenItems} className="w-full">
              {navGroups.map((group) => {
                  const isAdminRole = activeRole === 'Admin' || activeRole === 'System Architect';
                  const isSportsmaster = activeRole === 'Sportsmaster';

                  if (group.adminOnly && !isAdminRole && !isSportsmaster) {
                      return null;
                  }
                  
                  const visibleItems = group.items.filter(item => {
                      if (item.adminOnly && !isAdminRole && !isSportsmaster) return false;
                      return true;
                  });

                  if (visibleItems.length === 0) return null;

                  return (
                      <AccordionItem value={group.title} key={group.title} className="border-b-0">
                          <AccordionTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline [&[data-state=open]]:bg-sidebar-accent [&[data-state=open]]:text-sidebar-accent-foreground">
                               <group.icon className="h-4 w-4" />
                               <span className="flex-1 text-left font-normal">{group.title}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pl-4 pt-1 pb-0">
                              <div className="flex flex-col gap-1">
                                  {visibleItems.map((item) => {
                                      const isActive = item.href === currentHref;
                                      return (
                                          <Link
                                              key={item.label}
                                              href={item.href}
                                              className={cn(
                                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                              )}
                                          >
                                              <item.icon className="h-4 w-4" />
                                              {item.label}
                                          </Link>
                                      );
                                  })}
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  )
              })}
          </Accordion>
        </nav>
      </ScrollArea>
    </aside>
  );
}
