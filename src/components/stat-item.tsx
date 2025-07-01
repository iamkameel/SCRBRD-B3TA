
'use client';

import { cn } from "@/lib/utils";

export function StatItem({ label, value, className }: { label: string, value: string | number, className?: string }) {
    return (
        <div className={cn("flex flex-col items-center text-center", className)}>
            <p className="font-bold text-2xl text-primary">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    )
}
