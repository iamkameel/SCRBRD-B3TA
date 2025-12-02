
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

  // Redirect unauthenticated users from protected routes
  React.useEffect(() => {
    if (!loading && !user && !isShellDisabledRoute) {
      router.push('/home');
    }
  }, [user, loading, isShellDisabledRoute, router, pathname]);

  // For public routes like /home, /login, /signup, don't render the shell.
  if (isShellDisabledRoute) {
    return <>{children}</>;
  }

  // If loading or the user is not yet available on a protected route, show a skeleton.
  // This prevents flashing content or "profile not found" errors.
  if (loading || !user) {
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
