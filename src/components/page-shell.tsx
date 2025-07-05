'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { Header } from './header';

const SHELL_DISABLED_ROUTES = ['/home', '/login', '/signup'];

export default function PageShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isShellDisabledRoute = SHELL_DISABLED_ROUTES.includes(pathname);

  React.useEffect(() => {
    if (!loading && !user && !isShellDisabledRoute) {
      router.push('/login');
    }
  }, [user, loading, isShellDisabledRoute, router, pathname]);

  if (loading && !isShellDisabledRoute) {
    return null; // The loading skeleton is already handled by AuthProvider for shell routes
  }
  
  if (isShellDisabledRoute) {
    return <>{children}</>;
  }
  
  if (user) {
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

  // If not logged in and trying to access a protected route,
  // the useEffect above will trigger a redirect.
  // We can show a skeleton or nothing while redirecting.
  return null;
}
