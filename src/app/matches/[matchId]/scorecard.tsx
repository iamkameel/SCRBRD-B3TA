

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

  const getRoleIndicator = (playerName: string) => {
    // This is a simplification. A real implementation might need richer player data.
    if (playerName.includes("(C)")) return " (C)";
    if (playerName.includes("(Wk)")) return " (Wk)";
    return "";
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold">{innings.teamName}</h3>
      </div>
      
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Batting</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">B</TableHead>
              <TableHead className="text-right">4s</TableHead>
              <TableHead className="text-right">6s</TableHead>
              <TableHead className="text-right">S/R</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {innings.battingCard.filter(b => b.status.toLowerCase() !== 'did not bat').map((batsman) => (
              <TableRow key={batsman.name} className="h-16">
                <TableCell className="font-medium align-top py-2">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{batsman.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{batsman.name.replace(/\s*\(C\)|\s*\(Wk\)/, '')}{getRoleIndicator(batsman.name)}</p>
                            <p className="text-xs text-muted-foreground">{batsman.status}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right align-top py-4">{batsman.runs}</TableCell>
                <TableCell className="text-right align-top py-4">{batsman.balls}</TableCell>
                <TableCell className="text-right align-top py-4">{batsman.fours}</TableCell>
                <TableCell className="text-right align-top py-4">{batsman.sixes}</TableCell>
                <TableCell className="text-right align-top py-4">{batsman.strikeRate.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator />

        <div className="flex justify-between p-4">
            <span className="font-semibold">Extras</span>
            <span className="font-semibold">{innings.extras.total} {innings.extras.details && `(${innings.extras.details})`}</span>
        </div>

        <Separator />
        
        <div className="flex justify-between p-4">
            <span className="font-bold text-lg">Total runs</span>
            <span className="font-bold text-lg">{innings.totalRuns} ({innings.wickets} wkts, {innings.overs} ov)</span>
        </div>

        {yetToBat.length > 0 && (
             <div className="px-4 pb-4">
                <Separator />
                <h5 className="font-semibold text-sm pt-4">Yet to bat</h5>
                <p className="text-sm text-muted-foreground">{yetToBat.join(', ')}</p>
            </div>
        )}
      </div>
      
      <div>
        <h4 className="font-bold text-lg mb-2 px-4">Bowling</h4>
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
