
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ShotData } from '@/lib/data';

interface WagonWheelProps {
    onShotSelect: (shot: { angle: number; distance: number }) => void;
    shots?: ShotData[];
    disabled?: boolean;
}

export function WagonWheel({ onShotSelect, shots = [], disabled }: WagonWheelProps) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const size = 300;
    const center = size / 2;
    const rings = [center * 0.35, center * 0.7, center];
    const sectors = 8;

    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (disabled || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const dx = x - center;
        const dy = y - center;

        // Calculate angle (0-360 degrees, 0 is to the right)
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) {
            angle += 360;
        }

        // Calculate distance as a ratio of the max radius
        const distance = Math.sqrt(dx * dx + dy * dy) / center;

        onShotSelect({ angle, distance: Math.min(distance, 1) });
    };

    const getShotColor = (runs: number) => {
        if (runs === 4) return "hsl(var(--chart-3))"; // blue
        if (runs === 6) return "hsl(var(--chart-4))"; // purple
        if (runs > 0) return "hsl(var(--chart-2))"; // yellow/orange
        return "hsl(var(--muted-foreground))"; // dot for 0 runs
    }

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
                
                {/* Rendered Shots */}
                {shots.map((shot, index) => {
                    const angleRad = shot.angle * (Math.PI / 180);
                    const endX = center + (shot.distance * center) * Math.cos(angleRad);
                    const endY = center + (shot.distance * center) * Math.sin(angleRad);
                    const color = getShotColor(shot.runs);

                    if (shot.runs === 0) {
                        return <circle key={index} cx={endX} cy={endY} r={3} fill={color} />;
                    }

                    return (
                        <line
                            key={index}
                            x1={center}
                            y1={center}
                            x2={endX}
                            y2={endY}
                            stroke={color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    );
                })}

                <circle cx={center} cy={center} r={3} fill="hsl(var(--primary))" />
            </svg>
            <p className="text-sm text-muted-foreground mt-2">Tap on the field to record a shot</p>
        </div>
    );
}
