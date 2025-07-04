
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Competition, Season, Division, Team } from "@/lib/data";
import { addCompetitionAction, updateCompetitionAction } from '@/lib/actions/competitions';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const competitionSchema = z.object({
  name: z.string().min(1, { message: "Competition name is required." }),
  competitionClass: z.string().optional(),
  type: z.enum(['League', 'Cup', 'Tournament', 'Festival', 'Friendlies'], { required_error: "Type is required." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  status: z.enum(['Draft', 'In Progress', 'Completed']).default('Draft'),
  winnerTeamId: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
});
type CompetitionFormValues = z.infer<typeof competitionSchema>;

const CLASS_DIVISION_MAP: { [key: string]: string[] } = {
    'Open': ['1st XI', '2nd XI', '3rd XI', '4th XI'],
    'u16': ['U16A', 'U16B', 'U16C'],
    'u15': ['U15A', 'U15B', 'U15C'],
    'u14': ['U14A', 'U14B', 'U14C'],
    'u13': ['U13A', 'U13B'],
};

const COMPETITION_TYPE_DEFINITIONS = [
    {
        id: 'League',
        label: 'League',
        description: 'A round-robin format testing consistency. Teams play each other home and away over a season.',
    },
    {
        id: 'Cup',
        label: 'Cup',
        description: 'A high-stakes, single-elimination knockout competition. Matchups are often determined by a random draw.',
    },
    {
        id: 'Tournament',
        label: 'Tournament',
        description: 'A showcase event combining a league-style group stage followed by an intense knockout phase.',
    },
    {
        id: 'Festival',
        label: 'Festival',
        description: 'A broader, celebratory event focused on community and atmosphere, which can host multiple competitions.',
    },
    {
        id: 'Friendlies',
        label: 'Friendlies',
        description: 'A collection of one-off matches not assigned to a formal league or cup structure.',
    }
] as const;

const COMPETITION_STATUSES = ['Draft', 'In Progress', 'Completed'] as const;

export function CompetitionDialog({ mode, competition, seasons, divisions, teams, open, onOpenChange }: { mode: 'add' | 'edit', competition?: Competition, seasons: Season[], divisions: Division[], teams: Team[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [schoolFilters, setSchoolFilters] = React.useState<string[]>([]);

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: mode === 'edit' && competition ? {
      name: competition.name,
      competitionClass: competition.competitionClass || " ",
      type: competition.type,
      seasonId: competition.seasonId,
      divisionId: competition.divisionId,
      status: competition.status,
      winnerTeamId: competition.winnerTeamId || "",
      teamIds: competition.teamIds || [],
    } : {
      name: "", competitionClass: " ", type: "League", status: "Draft", winnerTeamId: "", teamIds: [],
    },
  });
  
  const status = form.watch('status');
  const seasonId = form.watch('seasonId');
  const divisionId = form.watch('divisionId');
  
  const eligibleTeams = React.useMemo(() => {
    if (!divisionId || !seasonId) return [];
    return teams.filter(team => team.divisionId === divisionId && team.seasonId === seasonId);
  }, [teams, divisionId, seasonId]);

  const eligibleSchools = React.useMemo(() => {
      const schoolMap = new Map<string, { schoolId: string, schoolName: string }>();
      eligibleTeams.forEach(team => {
          if (team.schoolId && team.schoolName && !schoolMap.has(team.schoolId)) {
              schoolMap.set(team.schoolId, { schoolId: team.schoolId, schoolName: team.schoolName });
          }
      });
      return Array.from(schoolMap.values()).sort((a,b) => a.schoolName.localeCompare(b.schoolName));
  }, [eligibleTeams]);
  
  const filteredTeams = React.useMemo(() => {
    if (schoolFilters.length === 0) return eligibleTeams;
    return eligibleTeams.filter(team => schoolFilters.includes(team.schoolId));
  }, [eligibleTeams, schoolFilters]);

  const eligibleClasses = React.useMemo(() => {
    if (!divisionId) return [];
    const selectedDivision = divisions.find(d => d.divisionId === divisionId);
    if (!selectedDivision) return [];
    return CLASS_DIVISION_MAP[selectedDivision.name as keyof typeof CLASS_DIVISION_MAP] || [];
  }, [divisionId, divisions]);

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && competition) {
        form.reset({ ...competition, winnerTeamId: competition.winnerTeamId || "", competitionClass: competition.competitionClass || " ", teamIds: competition.teamIds || [] });
      } else {
        const activeSeason = seasons.find(s => {
            const now = new Date();
            return s.active && now >= s.startDate && now <= s.endDate;
        });
        form.reset({ name: "", competitionClass: " ", type: "League", status: "Draft", seasonId: activeSeason?.seasonId, divisionId: undefined, winnerTeamId: "", teamIds: [] });
      }
      setSchoolFilters([]);
    }
  }, [competition, mode, open, form, seasons]);
  
  // When season changes, reset division, class, and teams
  React.useEffect(() => {
    form.resetField('divisionId');
    form.resetField('competitionClass');
    form.resetField('teamIds');
  }, [seasonId, form]);

  // When division changes, reset class and teams
  React.useEffect(() => {
    form.resetField('competitionClass');
    form.resetField('teamIds');
    setSchoolFilters([]);
  }, [divisionId, form]);


  React.useEffect(() => {
    if (form.getValues('status') !== 'Completed') {
      form.setValue('winnerTeamId', '');
    }
  }, [status, form]);

  function onSubmit(data: CompetitionFormValues) {
    startTransition(async () => {
      try {
        const payload = {
          ...data,
          competitionClass: data.competitionClass?.trim(),
        };

        if (mode === 'edit' && competition) {
          await updateCompetitionAction({ competitionId: competition.competitionId, ...payload });
          toast({ title: "Competition Updated", description: `${data.name} has been updated.` });
        } else {
          await addCompetitionAction(payload);
          toast({ title: "Competition Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} competition.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Competition' : 'Add New Competition'}</DialogTitle>
          <DialogDescription>Follow the steps to setup your competition.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Define Scope</CardTitle>
                    <CardDescription>Select the season and division. This will determine which teams are eligible to participate.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="seasonId" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger></FormControl><SelectContent>{seasons.map((s) => (<SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>Division</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending || !seasonId}><FormControl><SelectTrigger><SelectValue placeholder={!seasonId ? "Select a season first" : "Select a division"}/></SelectTrigger></FormControl><SelectContent>{divisions.map((d) => (<SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Competition Details</CardTitle>
                    <CardDescription>Provide a name, format, and optional class for the competition.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Competition Name</FormLabel><FormControl><Input placeholder="e.g. U19 Varsity League" {...field} disabled={isPending || !divisionId} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField
                        control={form.control} name="type" render={({ field }) => (
                        <FormItem className="space-y-3"><FormLabel>Competition Type</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4" disabled={isPending || !divisionId}>
                            {COMPETITION_TYPE_DEFINITIONS.map(typeDef => (
                                <FormItem key={typeDef.id} className={cn("flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors", (isPending || !divisionId) ? "cursor-not-allowed opacity-50" : "hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary" )}>
                                <FormControl><RadioGroupItem value={typeDef.id} disabled={isPending || !divisionId} /></FormControl>
                                <div className="space-y-1 leading-none"><FormLabel className="font-semibold">{typeDef.label}</FormLabel><p className="text-sm text-muted-foreground">{typeDef.description}</p></div>
                                </FormItem>
                            ))}
                        </RadioGroup></FormControl><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="competitionClass" render={({ field }) => (<FormItem><FormLabel>Class / Level (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || " "} disabled={isPending || !divisionId || eligibleClasses.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!divisionId ? "Select a division first" : "Select a class"} /></SelectTrigger></FormControl><SelectContent><SelectItem value=" ">-- No Class --</SelectItem>{eligibleClasses.map((cls) => (<SelectItem key={cls} value={cls}>{cls}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Step 3: Assign Teams</CardTitle>
                    <CardDescription>Select participating teams. The list is filtered based on your selections in Step 1.</CardDescription>
                </CardHeader>
                <CardContent className={cn(!seasonId || !divisionId ? "opacity-50 cursor-not-allowed" : "")}>
                    <fieldset disabled={!seasonId || !divisionId} className="space-y-4">
                        <FormField control={form.control} name="teamIds" render={() => (
                            <FormItem>
                            {eligibleTeams.length > 0 && (
                                <div className="mb-4">
                                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate">{schoolFilters.length === 0 && "Filter by School..."}{schoolFilters.length === 1 && eligibleSchools.find(s => s.schoolId === schoolFilters[0])?.schoolName}{schoolFilters.length > 1 && `${schoolFilters.length} schools selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[300px]"><DropdownMenuLabel>Filter by School</DropdownMenuLabel><DropdownMenuSeparator />
                                            {eligibleSchools.map(school => (<DropdownMenuCheckboxItem key={school.schoolId} checked={schoolFilters.includes(school.schoolId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => {const newFilters = checked ? [...schoolFilters, school.schoolId] : schoolFilters.filter(id => id !== school.schoolId); setSchoolFilters(newFilters);}}>{school.schoolName}</DropdownMenuCheckboxItem>))}
                                            {schoolFilters.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setSchoolFilters([])} className="justify-center text-sm">Clear filters</DropdownMenuItem></>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            <ScrollArea className="h-48 rounded-md border"><div className="p-4">
                                {filteredTeams.length > 0 ? (
                                    filteredTeams.map((team) => (<FormField key={team.teamId} control={form.control} name="teamIds" render={({ field }) => { return (<FormItem key={team.teamId} className="flex flex-row items-start space-x-3 space-y-0 mb-4"><FormControl><Checkbox checked={field.value?.includes(team.teamId)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), team.teamId]) : field.onChange(field.value?.filter((value) => value !== team.teamId))}}/></FormControl><FormLabel className="font-normal">{team.name}</FormLabel></FormItem>)}}/>))
                                ) : ( <p className="text-sm text-muted-foreground text-center pt-4">{eligibleTeams.length === 0 ? "No teams available for the selected division and season." : "No teams found for the selected school filter."}</p>)}
                            </div></ScrollArea><FormMessage />
                            </FormItem>
                        )}/>
                    </fieldset>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Step 4: Set Status</CardTitle>
                    <CardDescription>Define the current status of the competition. If 'Completed', you can select a winner.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="Draft" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{COMPETITION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    {status === 'Completed' && (
                        <FormField control={form.control} name="winnerTeamId" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Winner (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isPending || eligibleTeams.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={eligibleTeams.length === 0 ? "No eligible teams" : "Select a winning team"} /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value=" ">-- No Winner --</SelectItem>{eligibleTeams.map((team) => (<SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>))}</SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )} />
                    )}
                </CardContent>
            </Card>

            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Competition"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
