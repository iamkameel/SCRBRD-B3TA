"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Schema based on competitions.teams
const teamSchema = z.object({
  name: z.string().min(1, { message: "Team name is required." }),
  schoolId: z.string({ required_error: "Please select a school." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

// Mock data for related entities. In a real app, this would come from a database.
const schools = [
  { id: "school_1", name: "Greenwood High" },
  { id: "school_2", name: "Oakdale Academy" },
  { id: "school_3", name: "Riverbend School" },
];

const divisions = [
  { id: "div_1", name: "U19 Varsity" },
  { id: "div_2", name: "U17 Junior Varsity" },
  { id: "div_3", name: "U15 Freshmen" },
];

const seasons = [
  { id: "season_1", name: "2024-2025" },
  { id: "season_2", name: "2023-2024" },
];

interface Team {
  teamId: string;
  name: string;
  schoolName: string;
  divisionName: string;
  seasonName: string;
  teamColors?: {
    primary?: string;
    secondary?: string;
  };
}

const initialTeams: Team[] = [
    { teamId: 'team_1', name: 'Greenwood Gators', schoolName: 'Greenwood High', divisionName: 'U19 Varsity', seasonName: '2024-2025', teamColors: { primary: '#004d00', secondary: '#ffc400'} },
    { teamId: 'team_2', name: 'Oakdale Eagles', schoolName: 'Oakdale Academy', divisionName: 'U19 Varsity', seasonName: '2024-2025', teamColors: { primary: '#6a0dad', secondary: '#ffd700'} },
]


function AddTeamDialog({ onTeamAdded }: { onTeamAdded: (team: Team) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
    },
  });

  function onSubmit(data: TeamFormValues) {
    const school = schools.find((s) => s.id === data.schoolId);
    const division = divisions.find((d) => d.id === data.divisionId);
    const season = seasons.find((s) => s.id === data.seasonId);

    if (!school || !division || !season) {
        toast({
            title: "Error",
            description: "Invalid selection. Please try again.",
            variant: "destructive"
        })
        return;
    }

    const newTeam: Team = {
      teamId: `team_${new Date().getTime()}`, // Use a temporary unique ID
      name: data.name,
      schoolName: school.name,
      divisionName: division.name,
      seasonName: season.name,
      teamColors: {
        primary: data.primaryColor,
        secondary: data.secondaryColor,
      },
    };
    onTeamAdded(newTeam);
    toast({
      title: "Team Added",
      description: `${data.name} has been successfully created.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Enter the details for the new team. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Greenwood Gators" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="divisionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a division" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisions.map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seasonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Season</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a season" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Team</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>(initialTeams);

  const handleTeamAdded = (newTeam: Team) => {
    setTeams((prevTeams) => [...prevTeams, newTeam]);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Teams
          </h1>
          <p className="text-muted-foreground">
            Manage your cricket teams.
          </p>
        </div>
        <AddTeamDialog onTeamAdded={handleTeamAdded} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
          <CardDescription>A list of all teams in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Season</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell className="font-medium">
                      <Link href={`/teams/${team.teamId}`} className="hover:underline">
                        {team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{team.schoolName}</TableCell>
                    <TableCell>{team.divisionName}</TableCell>
                    <TableCell>{team.seasonName}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No teams found. Get started by adding a team.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
