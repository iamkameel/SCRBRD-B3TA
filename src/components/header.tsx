'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { navItems } from './sidebar-nav-items';
import { cn } from '@/lib/utils';
import { CricketIcon } from '@/components/icons/cricket-icon';

export function Header() {
    const pathname = usePathname();
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <div className="flex h-16 items-center px-6 border-b">
                        <Link href="/" className="flex items-center gap-2 font-bold">
                          <CricketIcon className="h-6 w-6 text-primary" />
                          <span>SCRBRD</span>
                        </Link>
                    </div>
                    <nav className="grid gap-2 p-4 text-base font-medium">
                        {navItems.map((item) => {
                            const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
                            return (
                                <SheetClose asChild key={item.label}>
                                    <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground",
                                        isActive && "bg-muted text-foreground"
                                    )}
                                    >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                    </Link>
                                </SheetClose>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>
        </header>
    );
}
