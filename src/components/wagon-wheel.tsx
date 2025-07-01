
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface WagonWheelProps {
    onShotSelect: () => void;
    disabled?: boolean;
}

export function WagonWheel({ onShotSelect, disabled }: WagonWheelProps) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const
    size = 300;
    const center = size / 2;
    const rings = [center * 0.35, center * 0.7, center];
    const sectors = 8;

    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (disabled) return;
        // In a real implementation, we would calculate angle and radius here.
        // For this step, we just need to trigger the dialog.
        onShotSelect();
    };

    return (
        <div className="flex flex-col items-center">
            <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                onClick={handleClick}
                className={cn("bg-green-100 dark:bg-green-900/20 rounded-full cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
            >
                {/* Rings */}
                {rings.map((radius, i) => (
                    <circle
                        key={`ring-${i}`}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="hsla(var(--primary), 0.3)"
                        strokeWidth="1"
                    />
                ))}
                
                {/* Pitch */}
                <rect x={center - 5} y={center-40} width="10" height="80" fill="hsla(var(--primary), 0.4)" />

                {/* Sectors */}
                {Array.from({ length: sectors / 2 }).map((_, i) => (
                    <line
                        key={`sector-${i}`}
                        x1={center}
                        y1={center}
                        x2={center + center * Math.cos(i * Math.PI / (sectors / 2))}
                        y2={center + center * Math.sin(i * Math.PI / (sectors / 2))}
                        stroke="hsla(var(--primary), 0.3)"
                        strokeWidth="1"
                    />
                ))}
                <circle cx={center} cy={center} r={3} fill="hsl(var(--primary))" />
            </svg>
            <p className="text-sm text-muted-foreground mt-2">Tap on the field to record a shot</p>
        </div>
    );
}
