
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Bus,
  ClipboardList,
  Shield,
  Swords,
  Target,
  Trophy,
  Users,
  Wand2,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';
import { cn } from '@/lib/utils';

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
    name: 'Priya Sharmma',
    role: 'Head of Sport',
    avatar: 'https://maverickdesign.co.za/wp-content/uploads/2025/07/2150757143.jpg',
    dataAiHint: 'woman smiling',
    testimonial: 'SCRBRD has revolutionized how we manage our cricket program. The strategic calendar and AI analysis give us an unprecedented edge in planning and execution. It\'s an indispensable tool.',
  },
  {
    name: 'Jonah Miller',
    role: '1st XI Coach',
    avatar: 'https://maverickdesign.co.za/wp-content/uploads/2025/07/2150007196.jpg',
    dataAiHint: 'man portrait',
    testimonial: 'The player development tracker is a game-changer. I can visualize a player\'s progress over the season and have data-backed conversations about their performance. The AI insights are incredibly accurate.',
  },
  {
    name: 'Nkosi Sipamla',
    role: 'Parent & Spectator',
    avatar: 'https://maverickdesign.co.za/wp-content/uploads/2025/07/16419.jpg',
    dataAiHint: 'father portrait',
    testimonial: 'As a parent, staying updated with my son\'s schedule and performance has never been easier. The app is intuitive and provides all the information I need right at my fingertips. Truly fantastic!',
  },
];


export default function LandingPage() {
  const [activeIndex, setActiveIndex] = React.useState(1);
  const activeTestimonial = testimonials[activeIndex];
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative w-full py-20 md:py-32 lg:py-40 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('https://maverickdesign.co.za/wp-content/uploads/2025/07/stadium-with-stadium-with-lights-word-welcome-side.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="container relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <div className="max-w-xl text-left text-primary-foreground">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                The Future of Cricket Management is Here.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                From AI-powered analytics to seamless logistics, SCRBRD is the all-in-one platform to elevate your team, league, or school.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/signup">Get Started For Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  <Link href="#features">Learn More <span aria-hidden="true">→</span></Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <Image
                src="https://maverickdesign.co.za/wp-content/uploads/2025/07/pexels-case-originals-3800541.jpg"
                width={600}
                height={600}
                alt="A cricket player at the stumps"
                className="rounded-lg shadow-2xl"
                data-ai-hint="cricket action"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background via-green-50 dark:via-green-900/10 to-background">
          <div className="container">
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
        <section
          id="user-experience"
          className="relative w-full py-12 md:py-24 lg:py-32 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('https://maverickdesign.co.za/wp-content/uploads/2025/07/huuddle-700.jpg')" }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="container relative z-10">
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
                      <Card key={role.role} className="bg-card/80 backdrop-blur-sm">
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
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50 overflow-hidden">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trusted by Schools and Coaches
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                See what leaders in school cricket are saying about SCRBRD.
              </p>
            </div>

            <div className="relative mt-16 max-w-3xl mx-auto">
              {/* Testimonial Bubble */}
              <div className="relative rounded-lg bg-background p-8 shadow-lg">
                <Quote className="absolute -top-3 -left-3 h-10 w-10 text-primary/10" strokeWidth={1} />
                <blockquote className="relative text-center text-lg font-medium leading-relaxed text-foreground">
                  <p>"{activeTestimonial.testimonial}"</p>
                </blockquote>
              </div>
              {/* Pointer */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-2 w-4 h-4 bg-background rotate-45" />
            </div>

            <div className="mt-12 text-center">
              {/* Avatar Selectors */}
              <div className="flex justify-center items-center gap-4">
                {testimonials.map((testimonial, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveIndex(index)} 
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-muted/50"
                  >
                    <Avatar
                      className={cn(
                        "h-14 w-14 cursor-pointer transition-all duration-300 ease-in-out",
                        activeIndex === index
                          ? "scale-110 ring-2 ring-primary ring-offset-4 ring-offset-background"
                          : "scale-90 opacity-60 hover:scale-100 hover:opacity-100"
                      )}
                    >
                      <AvatarImage src={testimonial.avatar} data-ai-hint={testimonial.dataAiHint} />
                      <AvatarFallback>{testimonial.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>

              {/* Active Testimonial Info */}
              <div className="mt-6 transition-opacity duration-300">
                <p className="text-lg font-semibold text-foreground">{activeTestimonial.name}</p>
                <p className="text-muted-foreground">{activeTestimonial.role}</p>
              </div>
            </div>
          </div>
        </section>


        {/* Final CTA Section */}
        <section
          className="relative w-full py-24 md:py-32 overflow-hidden bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('https://maverickdesign.co.za/wp-content/uploads/2025/07/green-grass-soccer-stadium.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40" />
          <div className="container relative z-10 text-center">
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
