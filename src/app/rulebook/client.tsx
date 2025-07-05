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
        content: "Cricket owes much of its appeal and enjoyment to the fact that it is played not only according to the Laws, but also within the Spirit of Cricket. The major responsibility for ensuring fair play rests with the captains, but extends to all players, umpires and, especially in junior cricket, teachers, coaches and parents. Respect is central to the Spirit of Cricket. Respect your captain, team-mates, opponents and the authority of the umpires."
    },
    {
        value: "item-2",
        title: "The Players & Officials",
        content: "- **The Players (Law 1):** A match is played between two sides, each of eleven players, one of whom shall be captain.\n\n- **The Umpires (Law 2):** Two umpires shall be appointed, one for each end, to control the match as required by the Laws, with absolute impartiality.\n\n- **The Scorers (Law 3):** Two scorers shall be appointed to record all runs scored, all wickets taken and, where appropriate, the number of overs bowled."
    },
    {
        value: "item-3",
        title: "Equipment & The Pitch",
        content: "- **The Ball (Law 4):** A cricket ball is a hard, solid ball. It consists of a cork core wound with string and then a leather cover stitched over it.\n\n- **The Bat (Law 5):** The bat consists of two parts, a handle and a blade. The blade of the cricket bat shall be a wooden block that is flat on the striking face and with a ridge on the reverse which concentrates wood in the middle where the ball is generally hit.\n\n- **The Pitch (Law 6):** The pitch is the rectangular area of the ground, 22 yards (20.12 m) long and 10 ft (3.05 m) wide, between the bowling creases. It is the area where the bowler bowls to the batsman.\n\n- **The Creases (Law 7):** A popping crease, a bowling crease and two return creases shall be marked in white at each end of the pitch."
    },
    {
        value: "item-4",
        title: "Gameplay, Scoring & Extras",
        content: "- **The Over (Law 17):** An over consists of six balls bowled by a bowler from one end of the pitch. After an over is completed, another bowler takes over from the opposite end.\n\n- **Scoring Runs (Law 18):** Runs are scored when two batsmen run from one end of the pitch to the other, successfully reaching the opposite crease. A run is completed once the two batsmen have crossed each other.\n\n- **Boundaries (Law 19):** A boundary four is scored if the ball hits or crosses the boundary rope after touching the ground. A boundary six is scored if the ball crosses the boundary rope without touching the ground.\n\n- **No Ball (Law 21):** A penalty of one run is given to the batting side, and the bowler must bowl an extra delivery. A no-ball can be called for various reasons, most commonly for overstepping the popping crease. Batsmen cannot be out Bowled, LBW, Caught, or Stumped off a no-ball.\n\n- **Wide Ball (Law 22):** A penalty of one run is given to the batting side, and the bowler must re-bowl the delivery. A wide is called if the umpire deems the ball to have been delivered too wide for the batsman to have a reasonable opportunity to score."
    },
    {
        value: "item-5",
        title: "Ways a Batsman Can Be Out (Dismissals)",
        content: "- **Bowled (Law 32):** The bowler's delivery hits the stumps and dislodges one or both bails.\n- **Caught (Law 33):** A fielder catches the ball on the full after the batsman has hit it with the bat or glove holding the bat.\n- **Leg Before Wicket (LBW) (Law 36):** The ball strikes the batsman's body before the bat, and the umpire judges that the ball would have gone on to hit the wickets.\n- **Run Out (Law 38):** A fielder removes the bails with the ball while the batsman is out of their crease and attempting a run.\n- **Stumped (Law 39):** The wicket-keeper removes the bails with the ball when the batsman is out of their crease and not attempting a run (the key difference from a run-out).\n- **Hit Wicket (Law 35):** The batsman dislodges their own stumps with their bat or body while playing a shot or setting off for a run.\n- **Obstructing the field (Law 37):** A batsman willfully attempts to obstruct or distract the fielding side by word or action.\n- **Hit the ball twice (Law 34):** A batsman intentionally hits the ball a second time, other than to protect their wicket.\n- **Timed out (Law 40):** A new batsman fails to be ready to face a delivery within 3 minutes of the previous wicket falling."
    },
    {
        value: "item-6",
        title: "Fielding & Restrictions",
        content: "- **The Wicket-keeper (Law 27):** The wicket-keeper is a specialist fielder who stands behind the batsman's wicket. They are the only fielder allowed to wear gloves and external leg guards.\n\n- **The Fielder (Law 28):** A fielder is any of the eleven cricketers from the bowling side who are on the field of play. A fielder may stop a ball with any part of his person, but if he willfully stops it otherwise, it is a dead ball and 5 penalty runs are awarded to the batting side.\n\n- **T20 Powerplay (Overs 1-6):** A maximum of two fielders are allowed outside the 30-yard circle.\n\n- **T20 Middle/Death Overs (Overs 7-20):** A maximum of five fielders are allowed outside the 30-yard circle."
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
