
'use client';

import * as React from "react";
import Link from 'next/link';
import { format } from "date-fns";
import { ArrowLeft, Users, ClipboardList, Trophy, GitMerge, Wand2, Loader2, CalendarIcon, Handshake } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Competition, Match, StandingTeam, LeaderboardPlayer, Season, Sponsor } from "@/lib/data";
import { TopRunScorersChart, TopWicketTakersChart } from './competition-charts';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { autoScheduleFixturesAction } from "@/lib/actions/competitions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const scheduleSchema = z.object({
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface AutoScheduleDialogProps {
  competition: Competition;
  season: Season;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AutoScheduleDialog({ competition, season, open, onOpenChange }: AutoScheduleDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      startDate: season.startDate > new Date() ? season.startDate : new Date(),
      endDate: season.endDate,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        startDate: season.startDate > new Date() ? season.startDate : new Date(),
        endDate: season.endDate,
      });
    }
  }, [open, form, season]);

  function onSubmit(data: ScheduleFormValues) {
    startTransition(async () => {
      try {
        await autoScheduleFixturesAction(competition.competitionId, data.startDate, data.endDate);
        toast({ title: "Fixtures Scheduled", description: "The match schedule has been generated and saved." });
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error Scheduling", description: error instanceof Error ? error.message : "Could not schedule fixtures.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auto-Schedule Fixtures for {competition.name}</DialogTitle>
          <DialogDescription>
            Select a start and end date for the fixture generation. Matches will be scheduled weekly on Saturdays within this range. The date range must be within the season dates ({format(season.startDate, 'PPP')} - {format(season.endDate, 'PPP')}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < season.startDate || date > season.endDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (form.getValues('startDate') || season.startDate) || date > season.endDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isPending ? "Scheduling..." : "Generate Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


interface CompetitionDetailsClientProps {
    competition: Competition;
    standings: StandingTeam[];
    matches: Match[];
    leaderboards: {
        topRunScorers: LeaderboardPlayer[];
        topWicketTakers: LeaderboardPlayer[];
    };
    seasons: Season[];
    sponsors: Sponsor[];
}

const BracketMatch = React.forwardRef<HTMLDivElement, { match: Match }>(({ match }, ref) => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const teamAStyles = match.winnerTeamId === match.teamAId ? 'font-bold text-foreground' : 'text-muted-foreground';
  const teamBStyles = match.winnerTeamId === match.teamBId ? 'font-bold text-foreground' : 'text-muted-foreground';
  const isTBD = !match.teamBId;

  return (
    <div ref={ref} className="border p-3 rounded-lg bg-background w-64 shadow-sm z-10">
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
        <p>{isClient ? format(match.dateTime, "dd MMM, p") : '...'}</p>
        {!isTBD && <Link href={`/matches/${match.matchId}`} className="hover:underline">Details</Link>}
      </div>
      <div className="space-y-1.5 text-sm">
        <div className={cn("flex items-center gap-2", teamAStyles)}>
            <Avatar className="h-4 w-4"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName[0]}</AvatarFallback></Avatar>
            {match.teamAName}
        </div>
        <div className={cn("flex items-center gap-2", teamBStyles)}>
            {match.teamBId ? (<Avatar className="h-4 w-4"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName[0]}</AvatarFallback></Avatar>) : (<div className="h-4 w-4" />) }
            {match.teamBName || 'TBD'}
        </div>
      </div>
       {match.status === 'completed' && match.result && (
        <p className="text-xs text-center mt-2 font-medium">{match.result}</p>
      )}
    </div>
  );
});
BracketMatch.displayName = 'BracketMatch';

function TournamentBracket({ rounds }: { rounds: { round: number; matches: Match[] }[] }) {
    const matchRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map());
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [lines, setLines] = React.useState<React.ReactNode[]>([]);

    const getRoundTitle = (matchCount: number) => {
        if (matchCount === 1) return 'Final';
        if (matchCount === 2) return 'Semi-Finals';
        if (matchCount === 4) return 'Quarter-Finals';
        if (matchCount > 0) return `Round of ${matchCount * 2}`;
        return 'Round';
    };

    React.useEffect(() => {
        const calculateLines = () => {
            if (!containerRef.current) return;

            const bracketRect = containerRef.current.getBoundingClientRect();
            const newLines: React.ReactNode[] = [];

            for (let i = 0; i < rounds.length - 1; i++) {
                const currentRoundMatches = rounds[i].matches;
                const nextRoundMatches = rounds[i + 1].matches;

                currentRoundMatches.forEach((match, matchIndex) => {
                    const match1Div = matchRefs.current.get(match.matchId);
                    const nextMatch = nextRoundMatches[Math.floor(matchIndex / 2)];
                    if (!match1Div || !nextMatch) return;

                    const match2Div = matchRefs.current.get(nextMatch.matchId);
                    if (!match2Div) return;

                    const rect1 = match1Div.getBoundingClientRect();
                    const rect2 = match2Div.getBoundingClientRect();

                    const x1 = rect1.right - bracketRect.left;
                    const y1 = rect1.top + rect1.height / 2 - bracketRect.top;
                    const x2 = rect2.left - bracketRect.left;
                    const y2 = rect2.top + rect2.height / 2 - bracketRect.top;
                    
                    const midX = x1 + 24;

                    const pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

                    newLines.push(
                        <path key={`${match.matchId}-${nextMatch.matchId}`} d={pathD} stroke="hsl(var(--border))" strokeWidth="2" fill="none" />
                    );
                });
            }
            setLines(newLines);
        };
        
        // Timeout to ensure DOM is fully painted
        const timeoutId = setTimeout(calculateLines, 100);
        
        window.addEventListener('resize', calculateLines);
        return () => {
          clearTimeout(timeoutId);
          window.removeEventListener('resize', calculateLines);
        };
    }, [rounds]);
    
    return (
        <div ref={containerRef} className="relative">
             <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <svg className="w-full h-full">
                    <g>{lines}</g>
                </svg>
            </div>
            <div className="flex items-stretch gap-12 p-4 min-h-[400px]">
                 {rounds.map((round) => (
                    <div key={round.round} className="flex flex-col justify-around">
                        <h3 className="text-lg font-bold mb-4 text-center sticky top-0 bg-card/80 py-2 backdrop-blur-sm z-10">
                            {getRoundTitle(round.matches.length)}
                        </h3>
                        <div className="flex flex-col justify-around flex-grow gap-y-8">
                            {round.matches.map(match => (
                                <BracketMatch 
                                    key={match.matchId} 
                                    match={match} 
                                    ref={el => matchRefs.current.set(match.matchId, el)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function CompetitionDetailsClient({ competition, standings, matches, leaderboards, seasons, sponsors }: CompetitionDetailsClientProps) {
    const [isClient, setIsClient(false); }, []);
    const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = React.useState(false);
    
    const { topRunScorers, topWicketTakers } = leaderboards;
    const isLeague = competition.type === 'League';

    const bracketRounds = React.useMemo(() => {
        const grouped: { [key: number]: Match[] } = {};
        matches.forEach(match => {
            const round = match.round || 1;
            if (!grouped[round]) {
                grouped[round] = [];
            }
            grouped[round].push(match);
        });
        return Object.entries(grouped).map(([round, matchesInRound]) => ({
            round: parseInt(round, 10),
            matches: matchesInRound.sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime()),
        })).sort((a, b) => a.round - b.round);
    }, [matches]);
    
    const competitionSeason = seasons.find(s => s.seasonId === competition.seasonId);
    
    const linkedSponsors = React.useMemo(() => {
        if (!competition.sponsorIds || competition.sponsorIds.length === 0) return [];
        return sponsors.filter(s => competition.sponsorIds?.includes(s.sponsorId));
    }, [competition.sponsorIds, sponsors]);

    return (
        <>
        
            
                Back to Competitions
            
            
                
                    
                        
                            {competition.divisionName} &bull; {competition.seasonName}
                        
                    
                    
                         {competition.status !== 'Completed' && matches.length === 0 && (
                            
                                
                                Auto-Schedule Fixtures
                            
                         )}
                    
                
                {competition.winnerTeamName && (
                    
                        
                        Winner: {competition.winnerTeamName}
                    
                )}
            

            {linkedSponsors.length > 0 && (
                
                    
                        
                            Sponsors
                        
                    
                    
                        {linkedSponsors.map(sponsor => (
                            
                                
                                    
                                        
                                    
                                
                            
                        ))}
                    
                
            )}

            
                
                    {isLeague ? (
                        Standings
                    ) : (
                        Bracket
                    )}
                    Matches
                    Players
                

                {isLeague && (
                    
                        
                            
                                Team Standings
                                Current leaderboard for the {competition.name}.
                            
                            
                                 
                                    
                                        Pos
                                        Team
                                        Played
                                        Won
                                        Lost
                                        NRR
                                    
                                    
                                    {standings.length > 0 ? (
                                        standings.map((team, index) => (
                                        
                                            {index + 1}
                                            
                                                 
                                                    
                                                    {team.name}
                                                
                                            
                                            {team.stats.matchesPlayed}
                                            {team.stats.matchesWon}
                                            {team.stats.matchesLost}
                                            {team.stats.netRunRate.toFixed(2)}
                                        
                                        ))
                                    ) : (
                                        
                                            No team stats available yet.
                                        
                                    )}
                                    
                                
                            
                        
                    
                )}
                {!isLeague && (
                     
                        
                            
                                Tournament Bracket
                                A visual overview of the tournament matchups.
                            
                            
                                {bracketRounds.length > 0 ? (
                                    
                                        
                                        
                                    
                                ) : (
                                    
                                        No matches scheduled for this competition yet.
                                    
                                )}
                            
                        
                    
                )}
                
                    
                        
                            Match List
                            All matches scheduled for this competition.
                        
                        
                            
                                
                                    Match
                                    Date
                                    Venue
                                    Status
                                
                                
                                {matches.length > 0 ? (
                                    matches.map((match) => (
                                    
                                        
                                             
                                                
                                                    
                                                    {match.teamAName}
                                                
                                                
                                                
                                                    
                                                    {match.teamBName || 'TBD'}
                                                
                                            
                                        
                                        {isClient ? format(match.dateTime, "PPP p") : '\u00A0'}
                                        {match.fieldName}
                                        
                                    
                                ))
                                ) : (
                                
                                    No matches found for this competition.
                                
                                )}
                            
                        
                    
                
                
                    
                        
                            
                                Top Run Scorers
                                Batting leaders in this competition.
                            
                            
                                
                                {topRunScorers.length > 0 ? topRunScorers.map((player) => (
                                    
                                         
                                            
                                                {player.firstName} {player.lastName}
                                                Avg: {player.stats.battingAverage.toFixed(2)}
                                            
                                            
                                                {player.stats.totalRuns}
                                                Runs
                                            
                                        
                                    
                                )) : No batting stats yet.}
                            
                        
                         
                            
                                Top Wicket Takers
                                Bowling leaders in this competition.
                            
                             
                                
                                {topWicketTakers.length > 0 ? topWicketTakers.map((player) => (
                                    
                                         
                                            
                                                {player.firstName} {player.lastName}
                                                Econ: {player.stats.economyRate.toFixed(2)}
                                            
                                            
                                                {player.stats.wicketsTaken}
                                                Wickets
                                            
                                        
                                    
                                )) : No bowling stats yet.}
                            
                        
                    
                
            
        
        {competitionSeason && (
            
                
                
                
            
        )}
        
    );
}
