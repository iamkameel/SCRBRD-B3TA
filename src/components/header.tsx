
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
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
import { getNavConfig } from './sidebar-nav-items';
import { cn } from '@/lib/utils';
import { CricketIcon } from '@/components/icons/cricket-icon';
import { useAuth } from '@/lib/auth-context';
import { updateActiveRoleAction } from '@/lib/actions/players';
import { signOutAction } from '@/lib/actions/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';
import { ROLE_GROUPS } from '@/lib/roles';

function RoleSwitcher() {
    const { person } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const router = useRouter();

    if (!person || !person.roles || person.roles.length <= 1) {
        return <p className="text-sm font-medium">{person?.activeRole}</p>;
    }

    const handleRoleChange = (role: string) => {
        startTransition(async () => {
            if (!person?.personId) {
                toast({ title: "Error", description: "User profile ID not found.", variant: "destructive" });
                return;
            }
            try {
                await updateActiveRoleAction(person.personId, role);
                toast({ title: "Role Switched", description: `You are now acting as a ${role}.` });
                router.refresh();
            } catch (error) {
                toast({ title: "Error", description: "Could not switch role.", variant: "destructive" });
            }
        });
    };
    
    const userRoles = new Set(person.roles);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 disabled:opacity-100 hover:bg-white/20 text-primary-foreground hover:text-primary-foreground" disabled={isPending}>
                    {person.activeRole}
                    <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuRadioGroup value={person.activeRole} onValueChange={handleRoleChange}>
                    <DropdownMenuLabel>Switch Active Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ROLE_GROUPS.map(group => {
                        const userRolesInGroup = group.roles.filter(role => userRoles.has(role.id));
                        if (userRolesInGroup.length === 0) return null;

                        return (
                            <React.Fragment key={group.group}>
                                <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs font-bold uppercase tracking-wider">
                                    {group.group}
                                </DropdownMenuLabel>
                                {userRolesInGroup.map(role => (
                                    <DropdownMenuRadioItem key={role.id} value={role.id} className="capitalize">
                                        {role.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header() {
    const { user, person } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const activeRole = person?.activeRole || 'Player';

    const { topLevel: topLevelNavItems, groups: navGroups } = getNavConfig(activeRole);

    const defaultOpenItems = React.useMemo(() => 
        navGroups
        .filter(group => group.items.some(item => pathname.startsWith(item.href)))
        .map(group => group.title),
        [pathname, navGroups]
    );

    const handleSignOut = async () => {
      await signOutAction();
      router.push('/login');
    };

    return (
        <header className="sticky top-0 z-40 flex items-center h-14 gap-4 px-4 border-b lg:px-6 bg-primary text-primary-foreground">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 hover:bg-white/20 md:hidden">
                        <Menu className="w-5 h-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">A list of pages to navigate through the application.</SheetDescription>
                    <div className="flex items-center h-16 px-6 border-b">
                        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
                          <CricketIcon className="w-6 h-6 text-primary" />
                          <span>SCRBRD</span>
                        </Link>
                    </div>
                    <ScrollArea className="flex-1">
                        <nav className="grid gap-1 p-4 text-base font-medium">
                            {topLevelNavItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <SheetClose asChild key={item.label}>
                                        <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-base font-semibold text-muted-foreground transition-colors rounded-lg hover:text-foreground",
                                            isActive && "bg-muted text-foreground"
                                        )}
                                        >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                        </Link>
                                    </SheetClose>
                                );
                            })}
                            
                            <Accordion type="multiple" defaultValue={defaultOpenItems} className="w-full">
                                {navGroups.map((group) => {
                                    if (group.adminOnly && activeRole !== 'Admin') return null;
                                    const visibleItems = group.items.filter(item => !(item.adminOnly && activeRole !== 'Admin'));
                                    if (visibleItems.length === 0) return null;
                                    
                                    return (
                                        <AccordionItem value={group.title} key={group.title} className="border-b-0">
                                            <AccordionTrigger className="flex items-center gap-3 px-3 py-2 text-sm font-normal text-muted-foreground transition-all rounded-lg hover:bg-accent hover:text-foreground hover:no-underline [&[data-state=open]]:bg-accent [&[data-state=open]]:text-foreground">
                                                <group.icon className="w-4 h-4" />
                                                <span className="flex-1 text-left">{group.title}</span>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-1 pb-0 pl-8">
                                                <div className="flex flex-col gap-1">
                                                    {visibleItems.map((item) => {
                                                        const isActive = pathname.startsWith(item.href);
                                                        return (
                                                            <SheetClose asChild key={item.label}>
                                                                <Link
                                                                    href={item.href}
                                                                    className={cn(
                                                                        "flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-all rounded-lg hover:bg-accent hover:text-foreground",
                                                                        isActive && "bg-accent text-foreground"
                                                                    )}
                                                                >
                                                                    <item.icon className="w-4 h-4" />
                                                                    {item.label}
                                                                </Link>
                                                            </SheetClose>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </nav>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <div className="flex-1 w-full" />
            
            {person && <RoleSwitcher />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={person?.profileImageUrl} alt={person?.firstName} />
                    <AvatarFallback>{person ? `${person.firstName?.[0]}${person.lastName?.[0]}` : '...'}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{person ? `${person.firstName} ${person.lastName}` : 'Guest'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="mr-2"/>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2"/>Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
