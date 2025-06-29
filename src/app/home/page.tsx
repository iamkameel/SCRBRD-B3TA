
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Wand2, ClipboardList, Users, CalendarCheck, BarChartHorizontal, UserCog } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg border shadow-sm">
    <div className="p-3 mb-4 bg-primary/10 rounded-full">
      <Icon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      {description}
    </p>
  </div>
);

const TestimonialCard = ({ quote, name, role, avatarSrc, avatarHint }: { quote: string, name: string, role: string, avatarSrc: string, avatarHint: string }) => (
    <Card className="flex flex-col justify-between">
        <CardContent className="pt-6">
            <p className="text-muted-foreground">"{quote}"</p>
        </CardContent>
        <CardHeader>
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={avatarSrc} alt={name} />
                    <AvatarFallback data-ai-hint={avatarHint}>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{name}</CardTitle>
                    <CardDescription>{role}</CardDescription>
                </div>
            </div>
        </CardHeader>
    </Card>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <Badge variant="outline" className="w-fit">The All-in-One Cricket Platform</Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Manage, Score, and Analyze Like a Pro
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  SCRBRD elevates cricket management. Go beyond the scorecard with live scoring, powerful AI analytics, and seamless league administration.
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="#features">Learn More</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x600.png"
                width="600"
                height="600"
                alt="A stylised image of a cricket stadium"
                data-ai-hint="cricket stadium illustration"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Feature for Every Part of the Game</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From grassroots to the top leagues, SCRBRD provides the tools to streamline operations and uncover game-winning insights.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-none">
              <FeatureCard 
                icon={ClipboardList} 
                title="Live Scoring"
                description="Intuitive ball-by-ball scoring interface with real-time updates and live win probability calculations."
              />
              <FeatureCard 
                icon={Wand2} 
                title="AI-Powered Analytics"
                description="Generate match summaries, previews, player of the match selections, and even player development plans."
              />
              <FeatureCard 
                icon={Users} 
                title="Comprehensive Management"
                description="Effortlessly manage teams, players, competitions, fields, and transport logistics all in one place."
              />
               <FeatureCard 
                icon={CalendarCheck} 
                title="Scheduling & Logistics"
                description="Advanced fixture creation with clash detection, plus vehicle and driver assignments for match days."
              />
              <FeatureCard 
                icon={BarChartHorizontal} 
                title="Detailed Statistics"
                description="Automatically calculated player and team stats. Compare head-to-head to find the competitive edge."
              />
              <FeatureCard 
                icon={UserCog} 
                title="Role-Based Dashboards"
                description="Tailored dashboards for Admins, Coaches, Umpires, and Drivers to see the info that matters most to them."
              />
            </div>
          </div>
        </section>

         {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Streamlined Workflow</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get Up and Running in Minutes</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Our logical four-step process makes setting up and managing your season a breeze.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-4 lg:gap-12">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><span className="text-2xl font-bold">1</span></div>
                        <h3 className="text-xl font-bold">Setup</h3>
                        <p className="text-muted-foreground">Define your foundational data: seasons, divisions, schools, fields, and people.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><span className="text-2xl font-bold">2</span></div>
                        <h3 className="text-xl font-bold">Organize</h3>
                        <p className="text-muted-foreground">Create teams, assign players to rosters, and group them into competitions.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><span className="text-2xl font-bold">3</span></div>
                        <h3 className="text-xl font-bold">Schedule</h3>
                        <p className="text-muted-foreground">Create fixtures with our smart clash detection and assign officials and transport.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><span className="text-2xl font-bold">4</span></div>
                        <h3 className="text-xl font-bold">Analyze</h3>
                        <p className="text-muted-foreground">Score live or use AI to generate results, then dive deep into the stats and analytics.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Trusted by Coaches and Admins</h2>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                <TestimonialCard 
                    quote="SCRBRD has revolutionized how we manage our school's cricket program. The time saved on admin allows me to focus on coaching. The AI player reports are a game-changer."
                    name="John Smith"
                    role="Head Coach, Greenwood High"
                    avatarSrc="https://placehold.co/100x100.png"
                    avatarHint="man portrait"
                />
                <TestimonialCard 
                    quote="As a league administrator, tracking standings and fixtures used to be a nightmare. Now, it's all automated and beautifully presented. I can't imagine running our league without it."
                    name="Priya Sharma"
                    role="League Administrator, City Youth League"
                    avatarSrc="https://placehold.co/100x100.png"
                    avatarHint="woman portrait"
                />
                 <TestimonialCard 
                    quote="The live scoring is incredibly intuitive, and our parents love following along online. The automated match summaries are a fantastic bonus for our weekly newsletter."
                    name="David Chen"
                    role="Team Manager, U16 Warriors"
                    avatarSrc="https://placehold.co/100x100.png"
                    avatarHint="man portrait"
                />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Elevate Your Game?
              </h2>
              <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Take control of your cricket season. Explore the dashboard and see the power of SCRBRD for yourself.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-x-2">
               <Button asChild size="lg" variant="secondary">
                 <Link href="/signup">Get Started Now</Link>
               </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SCRBRD. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
