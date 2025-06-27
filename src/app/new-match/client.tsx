'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
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
import type { Team, Competition, Field } from "@/lib/data";
import { addMatchAction } from "@/lib/actions/matches";

const baseFixtureSchema = z.object({
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  competitionId: z.string({ required_error: "Please select a competition." }),
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({
    required_error: "A date for the match is required.",
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format. Please use HH:MM.",
  }),
});

const fixtureSchema = baseFixtureSchema.refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

interface NewMatchClientProps {
  teams: Team[];
  competitions: Competition[];
  fields: Field[];
}

export default function NewMatchClient({ teams, competitions, fields }: NewMatchClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      time: "10:00",
    },
  });

  const teamAId = form.watch('teamAId');
  const teamBId = form.watch('teamBId');

  function onSubmit(data: FixtureFormValues) {
    startTransition(async () => {
      try {
        const [hours, minutes] = data.time.split(':').map(Number);
        const combinedDateTime = new Date(data.dateTime);
        combinedDateTime.setHours(hours, minutes, 0, 0);

        const { time, ...rest } = data;
        const finalData = { ...rest, dateTime: combinedDateTime };
        
        await addMatchAction(finalData);
        
        toast({
          title: "Fixture Created",
          description: "Redirecting to the match page..."
        });

      } catch (error) {
        toast({
          title: "Error Creating Match",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  }


  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/matches" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Matches
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create a New Match
        </h1>
        <p className="text-muted-foreground">
          Set up the details for your next fixture.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Match Setup</CardTitle>
          <CardDescription>
            Select teams, venue, and date to create a new match.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="teamAId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Home Team</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {teams.map((team) => (
                                    <SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamBId}>
                                    {team.name}
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
                        name="teamBId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Away Team</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {teams.map((team) => (
                                    <SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamAId}>
                                    {team.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="competitionId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Competition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a competition" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {competitions.map((comp) => (
                                <SelectItem key={comp.competitionId} value={comp.competitionId}>
                                {comp.name} ({comp.seasonName})
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
                    name="fieldId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Venue / Field</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a field" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {fields.map((field) => (
                                <SelectItem key={field.fieldId} value={field.fieldId}>
                                {field.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField
                        control={form.control}
                        name="dateTime"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Match Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isPending}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date < new Date(new Date().setHours(0,0,0,0))
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Match Time</FormLabel>
                                <FormControl>
                                    <Input type="time" className="w-full" {...field} disabled={isPending}/>
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating Match..." : "Create Fixture & Start Scoring"}
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
