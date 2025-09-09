
'use client';

import * as React from 'react';
import type { RunMapData } from '@/lib/data';
import { cn } from '@/lib/utils';

interface RunMapProps {
    data: RunMapData;
}

export function RunMap({ data }: RunMapProps) {
    const size = 300;
    const center = size / 2;
    
    // Simplified sectors for display
    const displaySectors = [
        { name: 'Fine Leg', percentage: data.fineLeg, x: 0.25, y: 0.25 },
        { name: 'Square Leg', percentage: data.squareLeg, x: 0.25, y: 0.75 },
        { name: 'Cover', percentage: data.cover, x: 0.75, y: 0.25 },
        { name: 'Point', percentage: data.point, x: 0.75, y: 0.75 },
    ];


    return (
        <div className="relative w-full aspect-square" style={{ maxWidth: `${size}px` }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
                {/* Field */}
                <circle cx={center} cy={center} r={center} fill="#4CAF50" />
                <circle cx={center} cy={center} r={center * 0.95} fill="#388E3C" />
                <circle cx={center} cy={center} r={center * 0.5} stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />

                {/* Pitch */}
                <rect x={center - 7} y={center - 50} width="14" height="100" fill="#BCA48C" />
                
                {/* Dividing Lines */}
                <line x1="0" y1={center} x2={size} y2={center} stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                <line x1={center} y1="0" x2={center} y2={size} stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                
                {/* Text Labels */}
                <text x={center - 30} y={center - 5} fill="white" fontSize="10" textAnchor="end" className="font-sans">LEG-SIDE</text>
                <text x={center + 30} y={center - 5} fill="white" fontSize="10" textAnchor="start" className="font-sans">OFF-SIDE</text>
            </svg>
            
            {/* Percentage Overlays */}
            {displaySectors.map((sector) => (
                <div
                    key={sector.name}
                    className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${sector.x * 100}%`,
                        top: `${sector.y * 100}%`,
                    }}
                >
                    <span className="text-white text-3xl font-bold drop-shadow-lg">{sector.percentage}%</span>
                </div>
            ))}
        </div>
    );
}
