
"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { Innings } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Scorecard({ innings }: { innings: Innings }) {
  const allPlayerNames = new Set(innings.battingCard.map(b => b.name));
  const battedPlayerNames = new Set(
    innings.battingCard
      .filter(b => b.status.toLowerCase() !== 'did not bat')
      .map(b => b.name)
  );

  const yetToBat = Array.from(allPlayerNames).filter(name => !battedPlayerNames.has(name));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">{innings.teamName} Innings</h3>
      </div>
      <Separator />
      <div>
        <h4 className="font-bold text-lg mb-2">Batting</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Batsman</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">B</TableHead>
              <TableHead className="text-right">4s</TableHead>
              <TableHead className="text-right">6s</TableHead>
              <TableHead className="text-right">S/R</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {innings.battingCard.filter(b => b.status.toLowerCase() !== 'did not bat').map((batsman) => (
              <TableRow key={batsman.name}>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            {/* In a real app, you'd have a mapping from name to image URL */}
                            <AvatarFallback>{batsman.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{batsman.name}</p>
                            <p className="text-xs text-muted-foreground">{batsman.status}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right">{batsman.runs}</TableCell>
                <TableCell className="text-right">{batsman.balls}</TableCell>
                <TableCell className="text-right">{batsman.fours}</TableCell>
                <TableCell className="text-right">{batsman.sixes}</TableCell>
                <TableCell className="text-right">{batsman.strikeRate.toFixed(2)}</TableCell>
              </TableRow>
            ))}
             <TableRow>
                <TableCell className="font-medium">Extras</TableCell>
                <TableCell colSpan={4} className="text-muted-foreground">{innings.extras.details}</TableCell>
                <TableCell className="text-right font-bold">{innings.extras.total}</TableCell>
            </TableRow>
            <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell colSpan={4}>({innings.wickets} wkts; {innings.overs} overs)</TableCell>
                <TableCell className="text-right">{innings.totalRuns}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {yetToBat.length > 0 && (
             <div className="mt-4">
                <h5 className="font-semibold text-sm">Yet to bat</h5>
                <p className="text-sm text-muted-foreground">{yetToBat.join(', ')}</p>
            </div>
        )}
      </div>
      
      <div>
        <h4 className="font-bold text-lg mb-2">Bowling</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Bowler</TableHead>
              <TableHead className="text-right">O</TableHead>
              <TableHead className="text-right">M</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">W</TableHead>
              <TableHead className="text-right">Econ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {innings.bowlingCard.map((bowler) => (
              <TableRow key={bowler.name}>
                <TableCell className="font-medium">{bowler.name}</TableCell>
                <TableCell className="text-right">{bowler.overs}</TableCell>
                <TableCell className="text-right">{bowler.maidens}</TableCell>
                <TableCell className="text-right">{bowler.runs}</TableCell>
                <TableCell className="text-right">{bowler.wickets}</TableCell>
                <TableCell className="text-right">{bowler.economy.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
