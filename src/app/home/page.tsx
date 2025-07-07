import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Bus,
  CalendarDays,
  ClipboardList,
  Shield,
  Swords,
  Target,
  Trophy,
  Users,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

const features = [
  {
    icon: Wand2,
    title: 'AI Scorecard Generation',
    description: 'Instantly create realistic T20 scorecards from just lineups, perfect for demos or filling in missing data.',
  },
  {
    icon: BarChart2,
    title: 'Advanced Match Visuals',
    description: 'Analyze games with interactive Manhattan, Worm, and Wagon Wheel charts for a deeper understanding of match flow.',
  },
  {
    icon: Target,
    title: 'Player Performance Tracker',
    description: 'Monitor long-term player development with performance graphs, skill ratings, and detailed training logs.',
  },
  {
    icon: BookOpen,
    title: 'AI-Powered Analysis',
    description: 'Generate journalistic match summaries, tactical previews, and AI-driven Player of the Match selections.',
  },
  {
    icon: ClipboardList,
    title: 'Comprehensive Management',
    description: 'Full CRUD control over schools, divisions, seasons, teams, and personnel, all in one place.',
  },
  {
    icon: Bus,
    title: 'Logistics & Transport Hub',
    description: 'Effortlessly manage your vehicle fleet, assign drivers, and coordinate transport for all fixtures.',
  },
];

const forEveryRole = [
    {
        icon: Shield,
        role: "Administrators",
        description: "Get a high-level strategic view of all fixtures, manage data with ease, and oversee the entire cricketing ecosystem from a central hub."
    },
    {
        icon: Swords,
        role: "Coaches",
        description: "Plan detailed training sessions, track player development with advanced analytics, and make data-driven decisions on match day."
    },
    {
        icon: Users,
        role: "Players",
        description: "View your personal stats, track your performance over time, and see your upcoming match schedule at a glance."
    },
    {
        icon: Trophy,
        role: "Fans & Guardians",
        description: "Follow your favorite teams, view live scores, check rankings, and stay connected with your child's cricketing journey."
    }
]

const testimonials = [
  {
    name: 'Sarah Jennings',
    role: 'Head of Sport, Michaelhouse',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman smiling',
    testimonial: 'SCRBRD has revolutionized how we manage our cricket program. The strategic calendar and AI analysis give us an unprecedented edge in planning and execution. It\'s an indispensable tool.',
  },
  {
    name: 'David Miller',
    role: '1st XI Coach, Westville Boys\' High',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'man portrait',
    testimonial: 'The player development tracker is a game-changer. I can visualize a player\'s progress over the season and have data-backed conversations about their performance. The AI insights are incredibly accurate.',
  },
  {
    name: 'James Hart',
    role: 'Parent & Spectator',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'father portrait',
    testimonial: 'As a parent, staying updated with my son\'s schedule and performance has never been easier. The app is intuitive and provides all the information I need right at my fingertips. Truly fantastic!',
  },
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
          <Image
            src="https://maverickdesign.co.za/wp-content/uploads/2025/07/cricket-stadium-dramatic-light.jpg"
            alt="A dramatic shot of a cricket stadium at night"
            data-ai-hint="cricket stadium night"
            fill
            className="object-cover -z-10"
          />
          <div className="absolute inset-0 bg-black/60 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
                The Future of Cricket Management is Here.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                From AI-powered analytics to seamless logistics, SCRBRD is the all-in-one platform to elevate your team, league, or school.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/signup">Get Started For Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  <Link href="#features">Learn More <span aria-hidden="true">→</span></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Everything You Need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A toolkit for the modern game
              </p>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                SCRBRD combines powerful management tools with cutting-edge AI to provide unparalleled insights and control.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.title} className="flex flex-col items-start">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* For Every Role Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary">Built for the whole team</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        A dedicated experience for every role
                    </p>
                     <p className="mt-6 text-lg leading-8 text-muted-foreground">
                        Whether you're managing a league, coaching a team, or following the action, SCRBRD provides the tools you need to succeed.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {forEveryRole.map((role) => (
                        <Card key={role.role}>
                            <CardHeader>
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                                  <role.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <CardTitle>{role.role}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{role.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>


        {/* Testimonials Section */}
        <section className="relative w-full py-12 md:py-24 lg:py-32 bg-muted/50 overflow-hidden">
             <Image
                src="https://maverickdesign.co.za/wp-content/uploads/2025/07/grass-texture-green.jpg"
                alt="Close-up of cricket pitch grass"
                fill
                className="object-cover -z-10 opacity-10"
                data-ai-hint="cricket grass"
            />
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trusted by Schools and Coaches
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                See what leaders in school cricket are saying about SCRBRD.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="bg-card/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">"{testimonial.testimonial}"</p>
                  </CardContent>
                  <CardHeader>
                    <div className="flex items-center gap-x-4">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} data-ai-hint={testimonial.dataAiHint} />
                        <AvatarFallback>{testimonial.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative w-full py-24 md:py-32 overflow-hidden">
             <Image
                src="https://maverickdesign.co.za/wp-content/uploads/2025/07/cricket-team-huddle.jpg"
                alt="A cricket team huddling on the field"
                fill
                className="object-cover -z-10"
                data-ai-hint="cricket team"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 -z-10" />
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to elevate your game?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Start managing your cricket world like a pro. Sign up today and unlock the future of cricket management.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/signup">Sign Up For Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
