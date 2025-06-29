

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Settings, LogOut, ChevronDown, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { navItems } from './sidebar-nav-items';
import { cn } from '@/lib/utils';
import { CricketIcon } from '@/components/icons/cricket-icon';
import type { Person } from '@/lib/data';
import { updateActiveRoleAction } from '@/lib/actions/players';
import { useToast } from '@/hooks/use-toast';

function RoleSwitcher({ user }: { user: Person }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();

    const handleRoleChange = (role: string) => {
        startTransition(async () => {
            try {
                await updateActiveRoleAction(user.personId, role);
                toast({ title: "Role Switched", description: `You are now acting as a ${role}.` });
            } catch (error) {
                toast({ title: "Error", description: "Could not switch role.", variant: "destructive" });
            }
        });
    };

    if (!user.roles || user.roles.length <= 1) {
        return <p className="text-sm font-medium">{user.activeRole}</p>;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent" disabled={isPending}>
                    {user.activeRole}
                    <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch Active Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={user.activeRole} onValueChange={handleRoleChange}>
                    {user.roles.map((role) => (
                        <DropdownMenuRadioItem key={role} value={role}>{role}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header({ user }: { user: Person | null }) {
    const pathname = usePathname();
    const isAdmin = user?.roles.includes('Admin');

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-primary text-primary-foreground px-4 lg:px-6 sticky top-0 z-40">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 md:hidden hover:bg-white/20">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">A list of pages to navigate through the application.</SheetDescription>
                    <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                        <Link href="/" className="flex items-center gap-2 font-bold">
                          <CricketIcon className="h-6 w-6 text-primary" />
                          <span>SCRBRD</span>
                        </Link>
                    </div>
                    <nav className="grid gap-2 p-4 text-base font-medium">
                        {navItems.map((item) => {
                            if (item.adminOnly && !isAdmin) {
                                return null;
                            }
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

            <div className="w-full flex-1" />

            {user && <RoleSwitcher user={user} />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
                    <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user ? `${user.firstName} ${user.lastName}` : 'Loading...'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="mr-2"/>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2"/>Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
