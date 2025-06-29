
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from '@/components/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SCRBRD - Cricket Scorer',
  description: 'A modern cricket scoring and management tool.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // In a real app, this would get the logged-in user's identity
  // For this demo, we'll fetch the hardcoded admin user
  const userId = getUserId();
  const user = userId ? await getPerson(userId) : null;

  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="flex min-h-screen w-full">
                <Sidebar user={user} />
                <div className="flex flex-col flex-1 md:pl-64">
                    <Header user={user} />
                    <main className="flex-1 bg-background p-4 md:p-8">
                    {children}
                    </main>
                </div>
            </div>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
