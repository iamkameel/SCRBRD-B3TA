import { Header } from '@/components/header';
import { MatchForm } from '@/components/match-form';
import { Suspense } from 'react';

function HomePageContent() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="text-center mb-12 animate-in fade-in-50 duration-500">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary font-headline">
            AI-Powered Match Summaries
          </h1>
          <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
            Instantly generate professional cricket match reports. Just enter the stats, and let our AI do the writing for you.
          </p>
        </section>
        <MatchForm />
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
