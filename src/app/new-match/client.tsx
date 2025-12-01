
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Info, PlusCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Team, Competition, Field, Season, Division } from "@/lib/data";
import { addMatchAction } from '@/lib/actions/matches';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fixtureSchema = z.object({
  competitionId: z.string({ required_error: "Please select a competition or 'Friendly'." }),
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({
    required_error: "A date for the match is required.",
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format. Please use HH:MM.",
  }),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});


type FixtureFormValues = z.infer<typeof fixtureSchema>;

interface NewMatchClientProps {
  teams: Team[];
  competitions: Competition[];
  fields: Field[];
  seasons: Season[];
  divisions: Division[];
  isAdmin: boolean;
}

export default function NewMatchClient({ teams, competitions, fields, seasons, divisions, isAdmin }: NewMatchClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      time: "10:00",
    },
  });
  
  const selectedDate = form.watch('dateTime');
  const selectedCompetitionId = form.watch('competitionId');
  const teamAId = form.watch('teamAId');
  const teamBId = form.watch('teamBId');
  
  const isFriendly = selectedCompetitionId === 'friendly';

  const availableCompetitions = React.useMemo(() => {
    if (!selectedDate) return [];
    const activeSeason = seasons.find(s => 
        s.active && selectedDate >= s.startDate && selectedDate <= s.endDate
    );
    if (!activeSeason) return [];
    return competitions.filter(c => c.seasonId === activeSeason.seasonId);
  }, [selectedDate, seasons, competitions]);

  const eligibleTeams = React.useMemo(() => {
    if (isFriendly) return teams; // All teams are eligible for friendlies
    if (!selectedCompetitionId) return [];

    const competition = competitions.find(c => c.competitionId === selectedCompetitionId);
    if (!competition) return [];

    const teamIdsInCompetition = competition.teamIds || [];
    if (teamIdsInCompetition.length > 0) {
        return teams.filter(t => teamIdsInCompetition.includes(t.teamId));
    }
    
    // Fallback if no teams are assigned to the competition: filter by season and division
    return teams.filter(t => t.seasonId === competition.seasonId && t.divisionId === competition.divisionId);
  }, [isFriendly, selectedCompetitionId, competitions, teams]);
  
  const autoSelectedSeason = React.useMemo(() => {
    if (isFriendly || !selectedDate) return null;
    return seasons.find(s => s.active && selectedDate >= s.startDate && selectedDate <= s.endDate) || null;
  }, [isFriendly, selectedDate, seasons]);

  const autoSelectedDivisionName = React.useMemo(() => {
    if (isFriendly || !selectedCompetitionId) return null;
    const competition = competitions.find(c => c.competitionId === selectedCompetitionId);
    return competition ? competition.divisionName : null;
  }, [isFriendly, selectedCompetitionId, competitions]);


  React.useEffect(() => {
    form.resetField('competitionId');
  }, [selectedDate, form]);

  React.useEffect(() => {
    form.resetField('teamAId');
    form.resetField('teamBId');
  }, [selectedCompetitionId, form]);


  function onSubmit(data: FixtureFormValues) {
    startTransition(async () => {
      try {
        const [hours, minutes] = data.time.split(':').map(Number);
        const combinedDateTime = new Date(data.dateTime);
        combinedDateTime.setHours(hours, minutes, 0, 0);
        
        await addMatchAction({ ...data, dateTime: combinedDateTime });
        
        toast({
          title: "Fixture Created",
          description: "Redirecting to the match page..."
        });

      } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          throw error;
        }
        toast({
          title: "Error Creating Match",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    isAdmin && (
      <Button asChild>
        <Link href="/new-match"><PlusCircle className="mr-2" />New Match</Link>
      </Button>
    )
  );
}
