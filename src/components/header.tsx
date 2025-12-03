
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, Settings, LogOut, ChevronDown, User, Bell, Calendar, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { getNavConfig } from './sidebar-nav-items';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/lib/auth-context';
import { updateActiveRoleAction } from '@/lib/actions/players';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';
import { getUnconfirmedAssignmentsCount } from '@/lib/actions/alerts';
import { CommandSearch } from './command-search';
import { ROLE_CATEGORIES } from '@/lib/roles';


function RoleSwitcher() {
    const { person, setPerson } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = React.useTransition();

    if (!person || !person.roleAssignments || person.roleAssignments.length <= 1) {
        return <p className="text-sm font-medium text-primary-foreground/90">{person?.activeRole || 'User'}</p>;
    }
    
    const handleRoleChange = (roleCode: string) => {
        if (roleCode === person.activeRole) return;
        
        const oldPersonState = { ...person };
        setPerson({ ...person, activeRole: roleCode });

        startTransition(async () => {
            if (!person?.personId) {
                toast({ title: "Error", description: "User profile ID not found.", variant: "destructive" });
                setPerson(oldPersonState);
                return;
            }
            try {
                await updateActiveRoleAction(person.personId, roleCode);
                router.refresh();
                toast({ title: "Role Switched", description: `You are now acting as a ${roleCode}.` });
            } catch (error) {
                setPerson(oldPersonState);
                toast({ title: "Error", description: "Could not switch role.", variant: "destructive" });
            }
        });
    };
    
    const groupedRoles = person.roleAssignments.reduce((acc, assignment) => {
        const roleInfo = ALL_ROLES.find(r => r.code === assignment.roleCode);
        if (!roleInfo) return acc;

        const category = ROLE_CATEGORIES.find(c => c.roleCategoryId === roleInfo.roleCategoryId);
        if (!category) return acc;
        
        if (!acc[category.name]) {
            acc[category.name] = [];
        }
        acc[category.name].push({ ...assignment, roleLabel: roleInfo.label });
        
        return acc;
    }, {} as Record<string, ({ roleLabel: string } & typeof person.roleAssignments[0])[]>);
    
    const sortedCategories = Object.keys(groupedRoles).sort((a,b) => {
        const catA = ROLE_CATEGORIES.find(c => c.name === a)?.displayOrder || 99;
        const catB = ROLE_CATEGORIES.find(c => c.name === b)?.displayOrder || 99;
        return catA - catB;
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1 rounded-md disabled:opacity-100 hover:bg-white/20 text-primary-foreground hover:text-primary-foreground" disabled={isPending}>
                    <span className="text-sm font-medium">{person.activeRole}</span>
                    {isPending ? <Loader2 className="w-4 h-4 ml-1 animate-spin"/> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuRadioGroup value={person.activeRole} onValueChange={handleRoleChange}>
                    <DropdownMenuLabel>Switch Active Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortedCategories.map(categoryName => (
                        <DropdownMenuGroup key={categoryName}>
                            <DropdownMenuLabel className="text-xs text-muted-foreground">{categoryName}</DropdownMenuLabel>
                            {groupedRoles[categoryName].map(assignment => (
                                <DropdownMenuRadioItem key={assignment.assignmentId} value={assignment.roleCode} className="capitalize flex flex-col items-start">
                                    <span>{assignment.roleLabel.replace(/_/g, ' ').toLowerCase()}</span>
                                    {assignment.contextName && <span className="text-xs text-muted-foreground -mt-1">({assignment.contextName})</span>}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuGroup>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationBell() {
    const [count, setCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const { person } = useAuth();
    const pathname = usePathname();

    const isOfficial = person?.roles.includes('UMPIRE') || person?.roles.includes('SCORER');

    React.useEffect(() => {
        if (isOfficial && person?.personId) {
            setLoading(true);
            getUnconfirmedAssignmentsCount(person.personId).then(num => {
                setCount(num);
                setLoading(false);
            });
        } else {
            setLoading(false);
            setCount(0);
        }
    }, [isOfficial, person, pathname]);

    if (!isOfficial) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 relative">
                    <Bell className="h-5 w-5" />
                    {!loading && count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {count}
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                    <DropdownMenuItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </DropdownMenuItem>
                ) : count > 0 ? (
                    <DropdownMenuItem asChild>
                         <Link href="/dashboard">
                            You have {count} unconfirmed match assignment{count > 1 ? 's' : ''}.
                        </Link>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem disabled>
                       No new notifications
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header() {
    const { user, person } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeRole = person?.activeRole || 'SPECTATOR'; 

    const { topLevel: topLevelNavItems, groups: navGroups } = getNavConfig(activeRole);

    const defaultOpenItems = React.useMemo(() => 
        navGroups
        .filter(group => group.items.some(item => pathname.startsWith(item.href)))
        .map(group => group.title),
        [pathname, navGroups]
    );

    const handleSignOut = async () => {
      await signOut(auth);
      router.push('/login');
    };

    return (
        <header className="sticky top-0 z-40 flex items-center h-14 gap-4 px-4 lg:px-6 bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 hover:bg-white/20 md:hidden">
                        <Menu className="w-5 h-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
                    <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
                        <Link href="/" className="flex items-center gap-2 font-bold text-sidebar-foreground">
                          <Logo />
                        </Link>
                    </div>
                    <ScrollArea className="flex-1">
                        <nav className="grid gap-1 p-2 text-base font-medium">
                            {topLevelNavItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <SheetClose asChild key={item.label}>
                                        <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-base font-semibold transition-all rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
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
                                    const isAdminRole = activeRole === 'ADMIN' || activeRole === 'SYSTEM_ARCHITECT';
                                    if (group.adminOnly && !isAdminRole) return null;
                                    
                                    const visibleItems = group.items.filter(item => !(item.adminOnly && !isAdminRole));
                                    if (visibleItems.length === 0) return null;
                                    
                                    return (
                                        <AccordionItem value={group.title} key={group.title} className="border-b-0">
                                            <AccordionTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline [&[data-state=open]]:bg-sidebar-accent [&[data-state=open]]:text-sidebar-accent-foreground">
                                               <group.icon className="w-4 h-4" />
                                               <span className="flex-1 text-left font-normal">{group.title}</span>
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
                                                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
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
            
            <CommandSearch />

            <div className="flex-1 w-full" />
            
            <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                <Link href="/matches">
                    <Calendar className="h-5 w-5" />
                    <span className="sr-only">Fixtures</span>
                </Link>
            </Button>
            <NotificationBell />

            <div className="flex items-center gap-2">
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
                    {person?.personId && (
                        <DropdownMenuItem asChild>
                            <Link href={`/people/${person.personId}`}><User className="mr-2"/>My Profile</Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                    <Link href="/settings"><Settings className="mr-2"/>Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2"/>Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
