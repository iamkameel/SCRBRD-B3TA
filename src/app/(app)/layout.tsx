'use client';

import * as React from 'react';
import PageShell from '@/components/page-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    // The PageShell provides the sidebar and header for the entire authenticated app.
    // It was incorrectly removed in a previous version, breaking the entire app layout.
    // Restoring it fixes the missing navigation.
    return <PageShell>{children}</PageShell>;
}
