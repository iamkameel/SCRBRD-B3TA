
'use client';

import * as React from "react";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, ChevronDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ROLE_GROUPS } from "@/lib/roles";
import type { Person } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { deletePlayerAction } from '@/lib/actions/players';

const PersonDialog = dynamic(() => import('../people/person-dialog').then(mod => mod.PersonDialog), {
  ssr: false,
});

const ALL_ROLES = ROLE_GROUPS.flatMap(group => group.roles);

export default function UserManagementClient({ users, currentUser }: { users: Person[], currentUser: Person }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilters, setRoleFilters] = React.useState<string[]>([]);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const canAddUsers = currentUser?.roles.includes('Admin') ?? false;

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRole = roleFilters.length === 0 || roleFilters.some(role => user.roles.includes(role));
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilters]);

  const filtersApplied = searchQuery || roleFilters.length > 0;
  
  const handleDelete = () => {
    if (!selectedPerson) return;
    startTransition(async () => {
      try {
        await deletePlayerAction(selectedPerson.personId);
        toast({ title: "Person Deleted", description: `${selectedPerson.firstName} ${selectedPerson.lastName} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setSelectedPerson(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete person.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedPerson(null);
      }
    });
  };

  return (
    <>
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
            User Management
            </h1>
            <p className="text-muted-foreground">
            Invite and manage users with access to the system.
            </p>
        </div>
        {canAddUsers && <Button onClick={() => { setDialogMode('add'); setSelectedPerson(null); setIsPersonDialogOpen(true); }}><PlusCircle className="mr-2" />Add User</Button>}
      </header>

      <Card>
        <CardHeader>
           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                    A list of all people with access to the system.
                </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="justify-between font-normal w-48">
                            <span className="truncate">
                                {roleFilters.length === 0 && "Filter by role..."}
                                {roleFilters.length === 1 && ALL_ROLES.find(r => r.id === roleFilters[0])?.label}
                                {roleFilters.length > 1 && `${roleFilters.length} roles selected`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_ROLES.map(role => (
                        <DropdownMenuCheckboxItem
                            key={role.id}
                            checked={roleFilters.includes(role.id)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={checked => {
                                const newFilters = checked
                                    ? [...roleFilters, role.id]
                                    : roleFilters.filter(id => id !== role.id);
                                setRoleFilters(newFilters);
                            }}
                        >
                            {role.label}
                        </DropdownMenuCheckboxItem>
                        ))}
                        {roleFilters.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                            onSelect={() => setRoleFilters([])}
                            className="justify-center text-sm"
                            >
                            Clear filter
                            </DropdownMenuItem>
                        </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isTargetAdmin = user.roles.includes('Admin');
                  const canCurrentUserEdit = currentUser.roles.includes('Admin') || !isTargetAdmin;
                  const canCurrentUserDelete = currentUser.roles.includes('Admin') && currentUser.personId !== user.personId;

                  return (
                    <TableRow key={user.personId}>
                      <TableCell className="font-medium flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                              <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <Link href={`/people/${user.personId}`}>{user.firstName} {user.lastName}</Link>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="capitalize">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canCurrentUserEdit && <DropdownMenuItem onSelect={() => { setSelectedPerson(user); setDialogMode('edit'); setIsPersonDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit Profile & Roles</DropdownMenuItem>}
                                {canCurrentUserDelete && <DropdownMenuSeparator />}
                                {canCurrentUserDelete && <DropdownMenuItem onSelect={() => { setSelectedPerson(user); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete User</DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {filtersApplied ? "No users found matching your filters." : "No users found. Add people on the People page."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <strong>{selectedPerson?.firstName} {selectedPerson?.lastName}</strong> and all associated data.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedPerson(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Person"}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    {isPersonDialogOpen && <PersonDialog mode={dialogMode} person={selectedPerson ?? undefined} currentUser={currentUser} open={isPersonDialogOpen} onOpenChange={setIsPersonDialogOpen} schools={[]}/>}
    </>
  );
}
