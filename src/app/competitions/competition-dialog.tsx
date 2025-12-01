
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
import type { Competition, Season, Division, Team, Sponsor } from "@/lib/data";
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
  sponsorIds: z.array(z.string()).optional(),
});
type CompetitionFormValues = z.infer;

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

export function CompetitionDialog({ mode, competition, seasons, divisions, teams, sponsors, open, onOpenChange }: { mode: 'add' | 'edit', competition?: Competition, seasons: Season[], divisions: Division[], teams: Team[], sponsors: Sponsor[], open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [schoolFilters, setSchoolFilters] = React.useState([]);

  const form = useForm {
      name: competition.name,
      competitionClass: competition.competitionClass || " ",
      type: competition.type,
      seasonId: competition.seasonId,
      divisionId: competition.divisionId,
      status: competition.status,
      winnerTeamId: competition.winnerTeamId || "",
      teamIds: competition.teamIds || [],
      sponsorIds: competition.sponsorIds || [],
    } : {
      name: "", competitionClass: " ", type: "League", status: "Draft", winnerTeamId: "", teamIds: [], sponsorIds: [],
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
      const schoolMap = new Map();
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
        form.reset({ ...competition, winnerTeamId: competition.winnerTeamId || "", competitionClass: competition.competitionClass || " ", teamIds: competition.teamIds || [], sponsorIds: competition.sponsorIds || [] });
      } else {
        const activeSeason = seasons.find(s => {
            const now = new Date();
            return s.active && now >= s.startDate && now  s.endDate);
        });
        form.reset({ name: "", competitionClass: " ", type: "League", status: "Draft", seasonId: activeSeason?.seasonId, divisionId: undefined, winnerTeamId: "", teamIds: [], sponsorIds: [] });
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
    
      
        
          {mode === 'edit' ? 'Edit Competition' : 'Add New Competition'}
          Follow the steps to setup your competition.
        
        
          
            
                
                    Step 1: Define Scope
                    Select the season and division. This will determine which teams are eligible to participate.
                
                
                  
                  
                  
                
            
            
                
                    
                        Step 2: Competition Details
                        Provide a name, format, and optional class for the competition.
                    
                    
                      
                      
                        
                      
                      
                      
                        
                          
                            
                              
                              
                                {COMPETITION_TYPE_DEFINITIONS.map(typeDef => (
                                  
                                  
                                    
                                    
                                      {typeDef.label}
                                      {typeDef.description}
                                    
                                  
                                ))}
                              
                            
                          
                        
                      
                      
                    
                
            

            
                
                    Step 3: Assign Teams & Sponsors
                    Select participating teams and official sponsors for this competition.
                
                
                     
                        
                            
                                Participating Teams
                            
                            {eligibleTeams.length > 0 && (
                                
                                    
                                        
                                            {schoolFilters.length === 0 && "Filter by School..."}{schoolFilters.length === 1 && eligibleSchools.find(s => s.schoolId === schoolFilters[0])?.schoolName}{schoolFilters.length > 1 && `${schoolFilters.length} schools selected`}
                                            
                                        
                                        
                                            
                                                Filter by School
                                                
                                                    
                                                    
                                                        {school.schoolName}
                                                    
                                                ))}
                                                
                                                    Clear filters
                                                
                                            
                                        
                                    
                                
                            )}
                            
                                {filteredTeams.length > 0 ? (
                                    filteredTeams.map((team) => (
                                         
                                            
                                                
                                                    
                                                    
                                                        
                                                        {team.name}
                                                    
                                                
                                            
                                        
                                    ))
                                ) : (  eligibleTeams.length === 0 ? "No teams available for the selected division and season." : "No teams found for the selected school filter."}
                            
                            
                        
                    
                    
                        
                            Sponsors (Optional)
                            
                                
                                {sponsors.length > 0 ? (
                                    sponsors.map((sponsor) => (
                                         
                                            
                                                
                                                    
                                                    
                                                        
                                                        {sponsor.name}
                                                    
                                                
                                            
                                        
                                    ))
                                ) : (  Add them on the Sponsors page.}
                            
                            
                            
                        
                    
                
            

            
                
                    Step 4: Set Status
                    Define the current status of the competition. If 'Completed', you can select a winner.
                
                
                  
                  
                  
                    {status === 'Completed' && (
                        
                            
                            
                                
                                    -- No Winner --
                                    {eligibleTeams.map((team) => (
                                        {team.name}
                                    ))}
                                
                            
                        
                    )}
                
            

            
          
        
      
    
  );
}
