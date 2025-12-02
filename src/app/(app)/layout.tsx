
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PageShell from '@/components/page-shell';
import DashboardSkeleton from '@/app/loading';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
             <div className="flex min-h-screen w-full">
                <aside className="w-64 flex-col fixed inset-y-0 z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex" />
                <div className="flex flex-col flex-1 md:pl-64">
                    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-primary px-4 lg:h-[60px] lg:px-6" />
                    <main className="flex-1 p-4 md:p-8">
                       <DashboardSkeleton />
                    </main>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <PageShell>{children}</PageShell>;
}
