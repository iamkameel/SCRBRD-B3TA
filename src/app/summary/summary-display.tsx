'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Download, Newspaper } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SummaryDisplay({ summary, team1Name, team2Name, imageUrl }: { summary: string; team1Name?: string; team2Name?: string; imageUrl: string; }) {
  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = team1Name && team2Name 
      ? `${team1Name.replace(/ /g, '-')}-vs-${team2Name.replace(/ /g, '-')}-summary.txt` 
      : 'match-summary.txt';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardTitle = team1Name && team2Name ? `${team1Name} vs. ${team2Name}` : 'Match Summary';

  return (
    <Card className="max-w-4xl mx-auto animate-in fade-in-50 duration-500">
      <CardHeader>
        {imageUrl && (
          <div className="relative mb-4 overflow-hidden rounded-lg aspect-video">
             <Image 
              src={imageUrl} 
              alt={cardTitle} 
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}
        <CardTitle className="text-2xl flex items-center gap-3">
          <Newspaper className="h-6 w-6 text-primary flex-shrink-0" />
          <span>{cardTitle}</span>
        </CardTitle>
        <CardDescription>Here is the AI-generated summary and image of the match.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{summary}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleDownload} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download Summary
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/">Create Another Summary</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
