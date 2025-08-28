
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
    image: 'https://maverickdesign.co.za/wp-content/uploads/2025/07/2151240375-1.jpg',
    imageAlt: 'Digital representation of a cricket scorecard on a screen.',
    dataAiHint: 'digital scorecard',
  },
  {
    icon: BarChart2,
    title: 'Advanced Match Visuals',
    description: 'Analyze games with interactive Manhattan, Worm, and Wagon Wheel charts for a deeper understanding of match flow.',
    image: 'https://maverickdesign.co.za/wp-content/uploads/2025/07/2151004124.jpg',
    imageAlt: 'A vibrant chart showing sports analytics.',
    dataAiHint: 'analytics chart',
  },
  {
    icon: Target,
    title: 'Player Performance Tracker',
    description: 'Monitor long-term player development with performance graphs, skill ratings, and detailed training logs.',
    image: 'https://maverickdesign.co.za/wp-content/uploads/2025/07/40090.jpg',
    imageAlt: 'A focused cricketer in the nets, with data overlays showing performance metrics.',
    dataAiHint: 'cricket training',
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
        <section id="features" className="py-12 md:py-24 lg:py-32">
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

                {features.map((feature, index) => (
                    <div key={feature.title} className="mt-16 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                        <div className={cn("flex flex-col justify-center", index % 2 === 1 && 'lg:order-last')}>
                            <h3 className="text-2xl font-bold tracking-tight text-foreground">{feature.title}</h3>
                            <p className="mt-4 text-muted-foreground">{feature.description}</p>
                            <ul className="mt-6 space-y-4 text-sm">
                                <li className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Comprehensive Management</li>
                                <li className="flex items-center gap-2"><Bus className="h-5 w-5 text-primary" /> Logistics & Transport Hub</li>
                                <li className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> AI-Powered Analysis</li>
                            </ul>
                        </div>
                        <div className="overflow-hidden rounded-lg">
                             <Image
                                src={feature.image}
                                alt={feature.imageAlt}
                                width={500}
                                height={500}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                data-ai-hint={feature.dataAiHint}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
        
        {/* For Every Role Section */}
        <section
          id="user-experience"
          className="relative w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
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
                      <Card key={role.role} className="bg-background text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                          <CardHeader className="items-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                                <role.icon className="h-7 w-7" aria-hidden="true" />
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
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trusted by Schools and Coaches
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                See what leaders in school cricket are saying about SCRBRD.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                  <Card key={testimonial.name} className="flex flex-col">
                      <CardContent className="flex-1 pt-6">
                           <blockquote className="text-muted-foreground">"{testimonial.testimonial}"</blockquote>
                      </CardContent>
                      <CardHeader className="flex-row items-center gap-4 pt-4">
                          <Avatar>
                              <AvatarImage src={testimonial.avatar} data-ai-hint={testimonial.dataAiHint} />
                              <AvatarFallback>{testimonial.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                              <CardTitle className="text-base">{testimonial.name}</CardTitle>
                              <CardDescription>{testimonial.role}</CardDescription>
                          </div>
                      </CardHeader>
                  </Card>
              ))}
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
