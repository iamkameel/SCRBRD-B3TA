

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
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const centerX = size / 2;
        const centerY = size * 0.9;
        
        const deltaX = clickX - centerX;
        const deltaY = clickY - centerY;
        
        const distanceRatio = Math.sqrt(deltaX*deltaX + deltaY*deltaY) / (size * 0.45);
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
    
    const runCounts = React.useMemo(() => {
        const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 6: 0 };
        shots.forEach(shot => {
            if (shot.runs in counts) {
                counts[shot.runs as keyof typeof counts]++;
            }
        });
        return counts;
    }, [shots]);

     const legendItems = [
        { label: '6', runs: 6, color: '#ef4444' },
        { label: '4', runs: 4, color: '#3b82f6' },
        { label: '2', runs: 2, color: '#a3e635' },
        { label: '1', runs: 1, color: '#ec4899' },
    ];


    const center = { x: size / 2, y: size * 0.9 };
    const ellipse = { rx: size / 2, ry: size / 4 };

    return (
       <div className="flex flex-col items-center">
        <svg
            ref={svgRef}
            width="100%"
            height="auto"
            viewBox={`0 0 ${size} ${size * 0.8}`}
            onClick={handleClick}
            className={cn("bg-transparent", disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair")}
        >
            {/* Background and field markings */}
            <ellipse cx={center.x} cy={center.y} rx={ellipse.rx} ry={ellipse.ry} fill="#006400" />
            <ellipse cx={center.x} cy={center.y} rx={ellipse.rx * 0.95} ry={ellipse.ry * 0.95} fill="#008000" />
            <ellipse cx={center.x} cy={center.y} rx={ellipse.rx * 0.6} ry={ellipse.ry * 0.6} stroke="white" strokeWidth="1" strokeDasharray="3 3" fill="none" strokeOpacity="0.5" />
            
            {/* Pitch */}
            <path d={`M ${center.x - 8} ${center.y - 70} L ${center.x - 8} ${center.y + 15} L ${center.x + 8} ${center.y + 15} L ${center.x + 8} ${center.y - 70} Z`} fill="#BCA48C" />
            <line x1={center.x - 20} y1={center.y - 65} x2={center.x + 20} y2={center.y - 65} stroke="white" strokeWidth="1.5" />
            <line x1={center.x - 4} y1={center.y - 68} x2={center.x + 4} y2={center.y - 68} stroke="white" strokeWidth="2.5" />
            
            {/* Shots */}
            {shots.map((shot, index) => {
                const angleRad = (shot.angle - 90) * (Math.PI / 180);
                const endX = center.x + (ellipse.rx * shot.distance) * Math.cos(angleRad);
                const endY = center.y + (ellipse.ry * shot.distance) * Math.sin(angleRad);

                return (
                    <line
                        key={index}
                        x1={center.x}
                        y1={center.y - 66}
                        x2={endX}
                        y2={endY}
                        stroke={getShotColor(shot.runs)}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                );
            })}
        </svg>
        <div className="flex items-center justify-center gap-x-6 gap-y-2 mt-4 flex-wrap">
            {legendItems.map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-white">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label} x {runCounts[item.runs as keyof typeof runCounts]} = <strong>{item.runs * runCounts[item.runs as keyof typeof runCounts]}</strong></span>
                </div>
            ))}
        </div>
       </div>
    );
}
