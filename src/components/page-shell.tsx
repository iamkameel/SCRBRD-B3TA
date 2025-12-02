
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAuth } from '@/lib/auth-context';
import DashboardSkeleton from '@/app/loading';

export default function PageShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      // Redirect to a public page if not logged in
      router.replace('/home');
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-col flex-1 md:pl-64">
            <Header />
            <main className="flex-1 bg-background p-4 md:p-8">
            {children}
            </main>
        </div>
    </div>
  );
}
