
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PageShell from '@/components/page-shell';
import DashboardSkeleton from '@/app/loading';

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/home');
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return <DashboardSkeleton />;
  }
  
  return <PageShell>{children}</PageShell>;
}
