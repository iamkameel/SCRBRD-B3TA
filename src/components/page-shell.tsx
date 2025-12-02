
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import DashboardSkeleton from '@/app/loading';

const SHELL_DISABLED_ROUTES = ['/home', '/login', '/signup'];

export default function PageShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isShellDisabledRoute = SHELL_DISABLED_ROUTES.some(path => pathname.startsWith(path));

  React.useEffect(() => {
    if (!loading && !user && !isShellDisabledRoute) {
      router.push('/home');
    }
  }, [user, loading, isShellDisabledRoute, router, pathname]);

  if (isShellDisabledRoute) {
    return <>{children}</>;
  }

  // Always show a skeleton during the initial loading phase.
  if (loading) {
    return <DashboardSkeleton />;
  }

  // If loading is complete but there's still no user, it means the redirect is pending.
  // Continue showing the skeleton to avoid a flash of an empty/error state.
  if (!user) {
    return <DashboardSkeleton />;
  }
  
  // If the user is logged in, render the main app layout.
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
