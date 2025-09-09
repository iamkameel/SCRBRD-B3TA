
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart2, CheckCircle, Target, Users, Wand2 } from 'lucide-react';
import Link from 'next/link';

const Feature = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex items-start gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Step = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div>
        <h4 className="text-xl font-semibold text-primary">{number}</h4>
        <h5 className="mt-2 text-lg font-semibold">{title}</h5>
        <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
);


export default function PitchDeckClient() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12 py-8">
        <header className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">SCRBRD</h1>
            <p className="mt-4 text-xl text-muted-foreground">The Digital Evolution of Cricket Management</p>
        </header>

        <section id="problem">
            <Card className="bg-destructive/5 text-destructive-foreground border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-destructive">The Problem: An Analog Game in a Digital World</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-destructive/90">
                    <p>Amateur and semi-professional cricket leagues, from schools to clubs, are struggling with fragmentation. Pen-and-paper scorecards, disconnected spreadsheets, and endless WhatsApp groups create administrative chaos. This leads to:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Lost Data & Insights:</strong> Valuable player performance data is scattered and rarely analyzed for development.</li>
                        <li><strong>Administrative Burnout:</strong> Coaches and managers are bogged down by logistics instead of focusing on the game.</li>
                        <li><strong>Disconnected Community:</strong> Players, parents, and fans lack a central hub for schedules, results, and engagement.</li>
                        <li><strong>Missed Opportunities:</strong> Talent goes unnoticed, and strategic planning is based on guesswork, not data.</li>
                    </ul>
                </CardContent>
            </Card>
        </section>

        <section id="solution">
            <Card className="bg-primary/5 text-primary-foreground border-primary/20">
                <CardHeader>
                    <CardTitle className="text-primary">Our Solution: A Unified, AI-Powered Platform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>SCRBRD is a comprehensive, cloud-based platform that centralizes every aspect of cricket management. We replace administrative friction with intelligent automation, providing a single source of truth for leagues, teams, players, and their communities.</p>
                     <p className="font-semibold">Our mission is to empower the grassroots of cricket with elite-level tools, fostering development, engagement, and a love for the game.</p>
                </CardContent>
            </Card>
        </section>

        <section id="features">
            <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Feature 
                    icon={Wand2} 
                    title="AI-Powered Analytics" 
                    description="From generating realistic scorecards and match reports to providing player development plans and scouting analysis, our AI tools deliver insights previously available only to professionals." 
                />
                <Feature 
                    icon={Users} 
                    title="Comprehensive Management" 
                    description="Manage everything in one place: competitions, teams, player profiles, officials, venues, transport, and equipment. A complete operational toolkit." 
                />
                <Feature 
                    icon={BarChart2} 
                    title="Advanced Visualizations" 
                    description="Interactive charts like Manhattan graphs, wagon wheels, and performance timelines bring data to life, making it easy to understand match flow and player progress." 
                />
                <Feature 
                    icon={Target} 
                    title="Holistic Player Development" 
                    description="Track player skills, log training sessions and injuries, and set milestones. Our platform provides a 360-degree view of an athlete's journey." 
                />
            </div>
        </section>
        
        <section id="market">
            <Card>
                <CardHeader>
                    <CardTitle>Market Opportunity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong className="text-primary">Target Audience:</strong> Schools, universities, amateur clubs, and regional cricket boards.</p>
                    <p><strong className="text-primary">Market Size:</strong> Thousands of institutions globally are still using outdated methods. The demand for digital transformation in sports management is rapidly growing.</p>
                    <p><strong className="text-primary">Competitive Advantage:</strong> While basic scoring apps exist, SCRBRD's integration of AI analytics, comprehensive logistics, and holistic player development creates a unique, all-in-one value proposition that is currently unmatched in the amateur market.</p>
                </CardContent>
            </Card>
        </section>
        
        <section id="traction">
            <h2 className="text-3xl font-bold text-center mb-8">Our Traction & Roadmap</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <Step number="01" title="Feature Complete MVP" description="We have successfully built a feature-rich Minimum Viable Product that includes all core management modules, a live scoring engine, and a powerful suite of AI analysis tools." />
                <Step number="02" title="Pilot Program" description="We are now seeking partner leagues and schools for our pilot program to gather real-world feedback and demonstrate the platform's transformative impact." />
                <Step number="03" title="Future Growth" description="Our roadmap includes a mobile-optimized live scoring PWA, enhanced financial and sponsorship integrations, and even deeper AI-powered coaching recommendations." />
            </div>
        </section>

        <section id="cta">
            <Card className="text-center p-8">
                <CardTitle className="text-3xl">Join Us in Redefining Cricket</CardTitle>
                <CardDescription className="mt-2 text-lg max-w-2xl mx-auto">
                    We are seeking strategic partners and seed investment to accelerate our go-to-market strategy and scale our platform globally.
                </CardDescription>
                <CardContent className="mt-6">
                    <Button asChild size="lg">
                        <Link href="mailto:kameel@maverickdesign.co.za">
                            Contact Us to Learn More <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </section>
    </div>
  );
}
