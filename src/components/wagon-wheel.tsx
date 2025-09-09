
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ShotData } from '@/lib/data';

interface WagonWheelProps {
    shots?: ShotData[];
    size?: number;
    disabled?: boolean;
    onShotSelect: (shotData: { angle: number, distance: number }) => void;
}

export function WagonWheel({ shots = [], size = 300, disabled = false, onShotSelect }: WagonWheelProps) {
    const svgRef = React.useRef<SVGSVGElement>(null);

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (disabled || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        
        const svgSize = rect.width;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const centerX = svgSize / 2;
        const centerY = svgSize / 2;
        
        const deltaX = clickX - centerX;
        const deltaY = clickY - centerY;
        
        const distanceRatio = Math.sqrt(deltaX*deltaX + deltaY*deltaY) / (svgSize / 2);
        if (distanceRatio > 1) return;

        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        angle = (angle + 450) % 360; 

        onShotSelect({ angle, distance: distanceRatio });
    };

    const getShotColor = (runs: number) => {
        if (runs === 6) return "#ef4444"; // red-500
        if (runs === 4) return "#3b82f6"; // blue-500
        if (runs === 2) return "#a3e635"; // lime-500
        if (runs === 1) return "#ec4899"; // pink-500
        if (runs === 3) return "#f59e0b"; // amber-500
        return "hsl(var(--muted-foreground))"; // Dot ball
    };
    
    const center = size / 2;
    const radius = size / 2;

    const sectorLines = Array.from({ length: 4 }).map((_, i) => {
        const angle = i * 45;
        const startX = center;
        const startY = center;
        const endX = center + radius * Math.cos(angle * Math.PI / 180);
        const endY = center + radius * Math.sin(angle * Math.PI / 180);
        return { x1: startX, y1: startY, x2: endX, y2: endY };
    });
    
    return (
       <div className="flex flex-col items-center">
        <svg
            ref={svgRef}
            width="100%"
            height="auto"
            viewBox={`0 0 ${size} ${size}`}
            onClick={handleClick}
            className={cn("rounded-full", disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair")}
            style={{ backgroundColor: '#1e272e' }}
        >
            <defs>
                <pattern id="checkered" patternUnits="userSpaceOnUse" width="20" height="20">
                    <rect x="0" y="0" width="10" height="10" fill="#43A047" />
                    <rect x="10" y="0" width="10" height="10" fill="#4CAF50" />
                    <rect x="0" y="10" width="10" height="10" fill="#4CAF50" />
                    <rect x="10" y="10" width="10" height="10" fill="#43A047" />
                </pattern>
            </defs>

            {/* Outfield */}
            <circle cx={center} cy={center} r={radius} fill="#388E3C" />
            
            {/* Inner Circle (30-yard) */}
            <circle cx={center} cy={center} r={radius * 0.55} fill="url(#checkered)" />
            
            {/* Sector lines */}
            {sectorLines.map((line, i) => (
                <line key={i} {...line} stroke="white" strokeWidth="1" strokeOpacity="0.3" />
            ))}
            
            {/* Pitch */}
            <rect x={center - 7} y={center - 50} width="14" height="100" fill="#BCA48C" />
            
            {/* Creases */}
            <line x1={center - 20} y1={center - 40} x2={center + 20} y2={center - 40} stroke="white" strokeWidth="1.5" />
            <line x1={center - 20} y1={center + 40} x2={center + 20} y2={center + 40} stroke="white" strokeWidth="1.5" />
            
            {/* Stumps (simplified as small white bars on creases) */}
            <rect x={center - 4} y={center - 41} width="8" height="2" fill="white" />
            <rect x={center - 4} y={center + 39} width="8" height="2" fill="white" />

            {/* Labels */}
            <text x={center - 30} y={center + 5} fontSize="10" fill="white" className="font-sans font-bold uppercase" style={{ textShadow: '1px 1px 2px black' }}>OFF</text>
            <text x={center + 18} y={center + 5} fontSize="10" fill="white" className="font-sans font-bold uppercase" style={{ textShadow: '1px 1px 2px black' }}>LEG</text>

            {/* Shots */}
            {shots.map((shot, index) => {
                const angleRad = (shot.angle - 90) * (Math.PI / 180);
                const startRadius = 6; 
                const endRadius = radius * shot.distance;

                const startX = center + startRadius * Math.cos(angleRad);
                const startY = center + startRadius * Math.sin(angleRad);
                const endX = center + endRadius * Math.cos(angleRad);
                const endY = center + endRadius * Math.sin(angleRad);

                return (
                    <line
                        key={index}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={getShotColor(shot.runs)}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                );
            })}
        </svg>
       </div>
    );
}
