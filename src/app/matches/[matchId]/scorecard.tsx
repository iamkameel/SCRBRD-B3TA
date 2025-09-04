

"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { Innings } from "@/lib/data";

export function Scorecard({ innings }: { innings: Innings }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">{innings.teamName} Innings</h3>
        <p className="text-4xl font-bold">{innings.totalRuns}-{innings.wickets} <span className="text-2xl font-normal text-muted-foreground">({innings.overs} Overs)</span></p>
      </div>
      <Separator />
      <div>
        <h4 className="font-bold text-lg mb-2">Batting</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Batsman</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">B</TableHead>
              <TableHead className="text-right">4s</TableHead>
              <TableHead className="text-right">6s</TableHead>
              <TableHead className="text-right">SR</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {innings.battingCard.map((batsman) => (
              <TableRow key={batsman.name}>
                <TableCell className="font-medium">{batsman.name}</TableCell>
                <TableCell>{batsman.status}</TableCell>
                <TableCell className="text-right">{batsman.runs}</TableCell>
                <TableCell className="text-right">{batsman.balls}</TableCell>
                <TableCell className="text-right">{batsman.fours}</TableCell>
                <TableCell className="text-right">{batsman.sixes}</TableCell>
                <TableCell className="text-right">{batsman.strikeRate.toFixed(2)}</TableCell>
                <TableCell className="text-right">{batsman.timeAtCrease ? `${batsman.timeAtCrease}m` : '-'}</TableCell>
              </TableRow>
            ))}
             <TableRow>
                <TableCell className="font-medium">Extras</TableCell>
                <TableCell colSpan={6}>{innings.extras.details}</TableCell>
                <TableCell className="text-right font-bold">{innings.extras.total}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell colSpan={6}>({innings.wickets} wkts; {innings.overs} overs)</TableCell>
                <TableCell className="text-right font-bold">{innings.totalRuns}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

       <div>
        <h4 className="font-bold text-lg mb-2">Fall of Wickets</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {innings.fallOfWickets.map((fow, index) => (
                <span key={index}>{fow.wicket}-{fow.runs} ({fow.batsmanName}, {fow.over})</span>
            ))}
        </div>
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
