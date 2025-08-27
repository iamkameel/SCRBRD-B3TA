
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
    const infieldRadius = center * 0.55;

    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (disabled || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const dx = x - center;
        const dy = y - center;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) {
            angle += 360;
        }
        
        const distance = Math.sqrt(dx * dx + dy * dy) / center;

        onShotSelect({ angle, distance: Math.min(distance, 1) });
    };
    
    const getShotColor = (runs: number) => {
        if (runs === 6) return "#EF4444"; // Red
        if (runs === 4) return "#3B82F6"; // Blue
        if (runs > 0) return "#F97316"; // Orange
        return "hsl(var(--muted-foreground))";
    }

    const legendItems = [
        { label: '6 Runs', color: '#EF4444' },
        { label: '4 Runs', color: '#3B82F6' },
        { label: '1-3 Runs', color: '#F97316' },
        { label: 'Dot Ball', color: 'hsl(var(--muted-foreground))' },
    ];

    return (
        <div className="flex flex-col items-center">
            <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                onClick={handleClick}
                className={cn("bg-black rounded-full cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
            >
                {/* Checkered Infield Pattern */}
                <defs>
                    <pattern id="checkered" patternUnits="userSpaceOnUse" width="20" height="20">
                        <rect x="0" y="0" width="10" height="10" fill="#4CAF50" />
                        <rect x="10" y="0" width="10" height="10" fill="#43A047" />
                        <rect x="0" y="10" width="10" height="10" fill="#43A047" />
                        <rect x="10" y="10" width="10" height="10" fill="#4CAF50" />
                    </pattern>
                </defs>

                {/* Outfield */}
                <circle cx={center} cy={center} r={center} fill="#388E3C" />
                {/* Infield */}
                <circle cx={center} cy={center} r={infieldRadius} fill="url(#checkered)" />

                {/* Sector Lines */}
                {Array.from({ length: 4 }).map((_, i) => (
                     <line
                        key={`sector-${i}`}
                        x1={center + center * Math.cos(i * Math.PI / 4 + Math.PI / 8)}
                        y1={center + center * Math.sin(i * Math.PI / 4 + Math.PI / 8)}
                        x2={center - center * Math.cos(i * Math.PI / 4 + Math.PI / 8)}
                        y2={center - center * Math.sin(i * Math.PI / 4 + Math.PI / 8)}
                        stroke="white"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                    />
                ))}
                 <line x1={center} y1={0} x2={center} y2={size} stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
                 <line x1={0} y1={center} x2={size} y2={center} stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />


                {/* Pitch */}
                <rect x={center - 7} y={center - 50} width="14" height="100" fill="#BCA48C" />
                
                {/* Creases */}
                <line x1={center - 20} y1={center - 40} x2={center + 20} y2={center - 40} stroke="white" strokeWidth="1.5" />
                <line x1={center - 20} y1={center + 40} x2={center + 20} y2={center + 40} stroke="white" strokeWidth="1.5" />

                {/* Stumps */}
                <rect x={center - 4} y={center - 44} width="8" height="6" fill="white" />
                 <text x={center - 25} y={center + 5} fontSize="8" fill="white" className="font-sans font-bold">OFF</text>
                 <text x={center + 18} y={center + 5} fontSize="8" fill="white" className="font-sans font-bold">LEG</text>

                
                {/* Rendered Shots */}
                {shots.map((shot, index) => {
                    const angleRad = shot.angle * (Math.PI / 180);
                    // Start from the stumps area
                    const startX = center; 
                    const startY = center - 42; 
                    const endX = center + (shot.distance * center) * Math.cos(angleRad);
                    const endY = center + (shot.distance * center) * Math.sin(angleRad);
                    const color = getShotColor(shot.runs);

                    if (shot.runs === 0) {
                        return <circle key={index} cx={endX} cy={endY} r={3} fill={color} />;
                    }

                    return (
                        <line
                            key={index}
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke={color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    );
                })}
            </svg>
            <div className="flex items-center justify-center gap-4 mt-4">
                {legendItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Tap on the field to record a shot</p>
        </div>
    );
}
