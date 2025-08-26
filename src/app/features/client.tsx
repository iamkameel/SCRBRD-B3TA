
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BarChart2, Users, ClipboardList, Bus, Wand2, BookOpen } from 'lucide-react';

const featureCategories = [
    {
        category: "Core Data Management",
        icon: ClipboardList,
        features: [
            "Full CRUD management for Schools, Divisions, Seasons, and Fields.",
            "Comprehensive People module for all personnel (players, coaches, etc.).",
            "Automated player statistics calculation and family links system.",
            "Team creation and roster management with team-specific dashboards.",
            "Centralized Competitions dashboard for leagues, cups, and tournaments.",
            "User Profile management for personal information updates.",
        ]
    },
    {
        category: "Match & Scoring Engine",
        icon: Users,
        features: [
            "Full match lifecycle management: create fixtures, manage lineups, view results.",
            "AI Scorecard Generation for realistic T20 match data.",
        ]
    },
    {
        category: "AI-Powered Analysis & Insights",
        icon: Wand2,
        features: [
            "AI Match Summaries: Generate concise, journalistic reports of completed matches.",
            "AI Match Previews: Analyze team stats and weather for an analytical preview.",
            "AI Player of the Match Selection with detailed justification.",
            "AI Weather Forecasts using a Genkit Tool for match day conditions.",
        ]
    },
    {
        category: "Logistics & Transport",
        icon: Bus,
        features: [
            "Dedicated module to manage a fleet of transport vehicles.",
            "Driver Roster to view all personnel with the 'Driver' role.",
            "Logistics Hub to assign vehicles and drivers to specific matches.",
        ]
    },
    {
        category: "Advanced User Interface & Experience",
        icon: BarChart2,
        features: [
            "Modern UI/UX built with Next.js, React, ShadCN UI, and Tailwind CSS.",
            "Visual dashboards with charts for team standings and leaderboards.",
            "Powerful filtering and searching on key pages.",
            "Multiple view modes on the Matches page (List, Card, Calendar).",
            "Granular data management for migrating or deleting individual data subsets.",
        ]
    },
    {
        category: "Next-Generation Analytics & Governance",
        icon: BookOpen,
        features: [
            "Advanced interactive match visualizations: Manhattan, Worm, and Wagon Wheel charts.",
            "Player Performance Tracker with long-term development visualization.",
            "Player Skills Management with a radar chart for at-a-glance summaries.",
            "Professional, public-facing Home Page for prospective users.",
            "Awards Hub to showcase competition winners and season top performers.",
            "Digital, searchable Rule Book for easy reference.",
            "Clear User Role Directory defining responsibilities and permissions.",
            "High-level Strategic Calendar for resource and fixture planning.",
        ]
    },
];

const FeatureListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
    <span className="text-muted-foreground">{children}</span>
  </li>
);

export default function FeaturesClient() {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Application Features</h1>
                <p className="text-muted-foreground">
                    A detailed breakdown of all features and capabilities within SCRBRD.
                </p>
            </header>

            <div className="space-y-8">
                {featureCategories.map((category) => (
                    <Card key={category.category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <category.icon className="h-6 w-6 text-primary" />
                                {category.category}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {category.features.map((feature, index) => (
                                    <FeatureListItem key={index}>{feature}</FeatureListItem>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
