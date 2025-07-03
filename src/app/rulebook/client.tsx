
'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

const ruleTopics = [
    {
        value: "item-1",
        title: "The Spirit of Cricket",
        content: "Cricket owes much of its appeal and enjoyment to the fact that it is played not only according to the Laws, but also within the Spirit of Cricket. The major responsibility for ensuring fair play rests with the captains, but extends to all players, umpires and, especially in junior cricket, teachers, coaches and parents."
    },
    {
        value: "item-2",
        title: "Ways a Batsman Can Be Out",
        content: "There are several ways a batsman can be dismissed:\n\n- **Bowled:** The bowler's delivery hits the stumps and dislodges the bails.\n- **Caught:** A fielder catches the ball on the full after the batsman has hit it.\n- **Leg Before Wicket (LBW):** The ball strikes the batsman's body before hitting the bat, and the umpire judges that the ball would have gone on to hit the wickets.\n- **Run Out:** A fielder removes the bails with the ball while the batsman is out of their crease and attempting a run.\n- **Stumped:** The wicket-keeper removes the bails with the ball when the batsman is out of their crease and not attempting a run.\n- **Hit Wicket:** The batsman dislodges their own stumps with their bat or body while playing a shot or setting off for a run.\n- **Handled the Ball / Obstructing the Field:** (Now combined) A batsman willfully handles the ball or obstructs a fielder.\n- **Timed Out:** A new batsman fails to be ready to face a delivery within a set time (usually 3 minutes) of the previous wicket falling."
    },
    {
        value: "item-3",
        title: "Scoring Runs",
        content: "Runs are scored when two batsmen run from one end of the pitch to the other, successfully reaching the opposite crease. Runs can be scored in singles, twos, threes, or more. A **boundary four** is awarded if the ball is hit along the ground to the boundary rope. A **boundary six** is awarded if the ball is hit over the boundary rope on the full."
    },
    {
        value: "item-4",
        title: "No-balls and Wides",
        content: "**No-ball:** A penalty of one run is given to the batting side, and the bowler must bowl an extra delivery. A no-ball can be called for various reasons, most commonly for overstepping the popping crease during delivery. Batsmen cannot be out Bowled, LBW, Caught, or Stumped off a no-ball.\n\n**Wide:** A penalty of one run is given to the batting side, and the bowler must re-bowl the delivery. A wide is called if the umpire deems the ball to have been delivered too wide for the batsman to have a reasonable opportunity to score."
    },
    {
        value: "item-5",
        title: "Fielding Restrictions (T20)",
        content: "In a T20 match, there are fielding restrictions to encourage attacking batting:\n\n- **Powerplay (Overs 1-6):** A maximum of two fielders are allowed outside the 30-yard circle.\n- **Middle Overs (Overs 7-20):** A maximum of five fielders are allowed outside the 30-yard circle."
    }
];

export default function RuleBookClient() {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Cricket Rule Book</h1>
                <p className="text-muted-foreground">
                    A summary of key rules and the spirit of the game.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ScrollText />Official Rules</CardTitle>
                    <CardDescription>
                        A guide to the fundamental laws of cricket.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {ruleTopics.map(topic => (
                             <AccordionItem value={topic.value} key={topic.value}>
                                <AccordionTrigger>{topic.title}</AccordionTrigger>
                                <AccordionContent className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {topic.content}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
