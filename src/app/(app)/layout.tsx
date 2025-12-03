'use client';

import * as React from 'react';
import PageShell from '@/components/page-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    // This is the correct layout for the main application.
    // It wraps all authenticated pages with the PageShell, which provides
    // the sidebar and header. This was previously missing.
    return <PageShell>{children}</PageShell>;
}
