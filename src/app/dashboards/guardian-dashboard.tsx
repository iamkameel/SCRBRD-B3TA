'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, MessageSquare, IndianRupee, User, ArrowRight } from 'lucide-react';
import type { Person, Match } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getGuardianDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';

interface GuardianDashboardData {
  child: Person;
  teamName: string;
  nextMatch: Match | null;
}

interface GuardianDashboardProps {
  data: GuardianDashboardData[];
}

function ChildCard({ child, teamName, nextMatch }: { child: Person, teamName: string, nextMatch: Match | null }) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);
    
    const opponentName = nextMatch ? (nextMatch.teamAName === teamName ? nextMatch.teamBName : nextMatch.teamAName) : '';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={child.profileImageUrl} alt={`${child.firstName} ${child.lastName}`} />
                    <AvatarFallback>{child.firstName?.[0]}{child.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{child.firstName} {child.lastName}</CardTitle>
                    <CardDescription>{teamName}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <h3 className="font-semibold text-foreground">Next Event</h3>
                {nextMatch ? (
                    <div className="p-4 border rounded-lg space-y-2">
                        <p className="font-bold text-lg">vs {opponentName}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{isClient ? format(nextMatch.dateTime, 'PPP') : '...'}</p>
                            <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{isClient ? format(nextMatch.dateTime, 'p') : '...'}</p>
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{nextMatch.fieldName}</p>
                        </div>
                         <Button asChild size="sm" className="w-full mt-2">
                            <Link href={`/matches/${nextMatch.matchId}`}>View Match Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 border rounded-lg text-center text-muted-foreground">
                        <p>No upcoming matches scheduled.</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button variant="outline" disabled><MessageSquare className="mr-2" />Message Coach</Button>
                    <Button variant="outline" disabled><IndianRupee className="mr-2" />Pay Fees</Button>
                </div>
            </CardContent>
        </Card>
    )
}

function GuardianDashboardInternal({ data }: GuardianDashboardProps) {
  const { person } = useAuth();
  
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Guardian Dashboard</h1>
        <p className="text-sm opacity-90">Your family's schedule and team communications at a glance.</p>
      </header>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map(({ child, teamName, nextMatch }) => (
                <ChildCard key={child.personId} child={child} teamName={teamName} nextMatch={nextMatch} />
            ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Children Linked</CardTitle>
            <CardDescription className="mt-2 max-w-sm">
                To see schedules and information here, please link your children to your profile. You can do this by editing your profile on the People page or contacting your administrator.
            </CardDescription>
        </Card>
      )}
    </div>
  );
}

export default function GuardianDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<GuardianDashboardData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person?.personId) {
      getGuardianDashboardData(person.personId).then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      });
    }
  }, [person]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <GuardianDashboardInternal data={data} />;
}
