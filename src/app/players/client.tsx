
'use client';

import * as React from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Search } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Person as Player } from "@/lib/data";
import { deletePlayerAction } from '@/lib/actions/players';

const PlayerDialog = dynamic(() => import('./player-dialog').then(mod => mod.PlayerDialog), {
  ssr: false,
});

const ROLES = [
  { id: "Player", label: "Player" }, { id: "Coach", label: "Coach" },
  { id: "Umpire", label: "Umpire" }, { id: "Scorer", label: "Scorer" },
  { id: "Guardian", label: "Guardian" }, { id: "Sportmaster", label: "Sportmaster" },
  { id: "Grounds-Keeper", label: "Grounds-Keeper" }, { id: "Driver", label: "Driver" },
] as const;

export default function PlayersClient({ players }: { players: Player[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedPerson, setSelectedPerson] = React.useState<Player | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");

  const filteredPlayers = players.filter(player => {
    const matchesSearch = `${player.firstName} ${player.lastName} ${player.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || player.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const filtersApplied = searchQuery || roleFilter !== 'all';
  
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
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">People</h1><p className="text-muted-foreground">Manage your roster of players, coaches, and officials.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedPerson(null); setIsPlayerDialogOpen(true); }}><PlusCircle className="mr-2" />Add Person</Button>
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Person Roster</CardTitle>
                <CardDescription>A list of all people in the system.</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                    {filtersApplied && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filter Roster</h4>
                      <p className="text-sm text-muted-foreground">
                        Find people by name, email, or role.
                      </p>
                    </div>
                    <div className="grid gap-4">
                       <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="search-input">Search</Label>
                        <Input
                          id="search-input"
                          placeholder="Name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="col-span-2 h-8"
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="role-filter">Role</Label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.personId}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <Avatar><AvatarImage src={player.profileImageUrl} alt={`${player.firstName} ${player.lastName}`} /><AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback></Avatar>
                        <Link href={`/players/${player.personId}`} className="hover:underline">{player.firstName} {player.lastName}</Link>
                      </TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {player.roles.map((role) => (
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
                            <DropdownMenuItem onSelect={() => { setSelectedPerson(player); setDialogMode('edit'); setIsPlayerDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedPerson(player); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">{filtersApplied ? "No people found matching your filters." : 'No people found. Get started by adding someone.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {isPlayerDialogOpen && <PlayerDialog mode={dialogMode} player={selectedPerson ?? undefined} open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen} />}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{selectedPerson?.firstName} {selectedPerson?.lastName}</strong>, remove them from all team rosters, and delete their associated family links. They will not be removed from completed match scorecards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPerson(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Person"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
