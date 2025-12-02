'use client';

import * as React from 'react';
import PageShell from '@/components/page-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    // Auth guard logic removed as authentication is now disabled
    // and a mock user is always provided.
    return <PageShell>{children}</PageShell>;
}
