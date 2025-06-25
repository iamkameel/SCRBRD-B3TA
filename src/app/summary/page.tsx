import { Header } from '@/components/header';
import { SummaryDisplay } from './summary-display';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

function SummaryPageContent({ summary, team1Name, team2Name, imageUrl }: { summary: string, team1Name?: string, team2Name?: string, imageUrl: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <SummaryDisplay summary={summary} team1Name={team1Name} team2Name={team2Name} imageUrl={imageUrl} />
      </main>
    </div>
  );
}

export default function SummaryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const summary = searchParams?.summary;
  const team1Name = searchParams?.team1Name;
  const team2Name = searchParams?.team2Name;
  const imageUrl = searchParams?.imageUrl;


  if (typeof summary !== 'string' || !summary || typeof imageUrl !== 'string' || !imageUrl) {
    redirect('/');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SummaryPageContent 
        summary={summary}
        imageUrl={imageUrl}
        team1Name={typeof team1Name === 'string' ? team1Name : undefined}
        team2Name={typeof team2Name === 'string' ? team2Name : undefined}
      />
    </Suspense>
  );
}
