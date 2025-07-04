'use client';

import { cn } from "@/lib/utils";

export function StatItem({ label, value, className, size = 'default' }: { label: string; value: string | number; className?: string; size?: 'default' | 'small' }) {
    return (
        <div className={cn("text-center", className)}>
            <p className={cn("font-semibold text-foreground", size === 'default' ? 'text-xl' : 'text-base', value === 'N/A' || value === '-' ? 'text-muted-foreground' : '' )}>{value}</p>
            <p className={cn("text-muted-foreground uppercase tracking-wider", size === 'default' ? 'text-xs' : 'text-[10px]')}>{label}</p>
        </div>
    )
}
