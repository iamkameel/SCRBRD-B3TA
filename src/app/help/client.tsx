
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, HelpCircle } from 'lucide-react';

const helpTopics = [
    {
        value: "item-1",
        title: "Getting Started: Migrating Sample Data",
        content: "The best way to explore the app is with sample data. Go to the Data Management page and click 'Migrate All Sample Data'. This will populate the entire application with schools, teams, players, and completed matches, allowing you to see all the features in action."
    },
    {
        value: "item-2",
        title: "Managing Your Organization",
        content: "The foundation of the app is your organizational data. In the 'League Structure' and 'Resources & Logistics' sections of the navigation, you can manage your Schools, Seasons, Divisions, and Fields. Setting these up is the first step to creating teams and competitions."
    },
    {
        value: "item-3",
        title: "Managing People and Teams",
        content: "Use the 'People' page to add and manage all individuals (players, coaches, staff). Once people exist, you can create Teams and assign people to them via the roster management tools on the Team details page."
    },
    {
        value: "item-4",
        title: "Creating Competitions and Matches",
        content: "Once you have teams, you can create a new Competition (like a League or Cup). After creating a competition, you can schedule Matches between the participating teams. Alternatively, you can create one-off Friendly matches without a formal competition."
    },
    {
        value: "item-5",
        title: "Using the AI Features",
        content: "The app is full of AI-powered tools. Once a match has a scorecard (either from live scoring or AI generation), you can generate match reports, player of the match awards, and highlight reels. Use the 'Scouting Assistant' to analyze player technique from a photo, or ask the 'Natural Language Stats Query' on the Analysis Hub page any question about your league's stats."
    }
];

export default function HelpClient() {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Help & Onboarding</h1>
                <p className="text-muted-foreground">
                    A guide to getting started and using the key features of the application.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HelpCircle />Frequently Asked Questions</CardTitle>
                    <CardDescription>
                        Click on a topic below to learn more about how to use the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {helpTopics.map(topic => (
                             <AccordionItem value={topic.value} key={topic.value}>
                                <AccordionTrigger>{topic.title}</AccordionTrigger>
                                <AccordionContent className="prose dark:prose-invert max-w-none">
                                    <p>{topic.content}</p>
                                    {topic.value === 'item-1' && (
                                        <Button asChild variant="outline" className="mt-4">
                                            <Link href="/data-management">
                                                Go to Data Management <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
