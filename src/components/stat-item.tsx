
'use client';

import { cn } from "@/lib/utils";

export function StatItem({ label, value, className, size = 'default' }: { label: string; value: string | number; className?: string; size?: 'default' | 'small' }) {
    return (
        <div className={cn("flex flex-col text-center", className)}>
            <p className={cn("font-bold", size === 'default' ? 'text-2xl' : 'text-lg', value === 'N/A' || value === '-' ? 'text-muted-foreground' : 'text-primary' )}>{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    )
}
