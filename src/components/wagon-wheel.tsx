
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ShotData } from '@/lib/data';

interface WagonWheelProps {
    shots?: ShotData[];
    size?: number;
    disabled?: boolean;
}

export function WagonWheel({ shots = [], size = 300, disabled = false }: WagonWheelProps) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [visibleRuns, setVisibleRuns] = React.useState<Set<number>>(new Set([0, 1, 2, 3, 4, 6]));

    const center = { x: size / 2, y: size * 0.9 };
    const ellipse = { rx: size / 2, ry: size / 4 };

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

    const toggleRunVisibility = (run: number) => {
        setVisibleRuns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(run)) {
                newSet.delete(run);
            } else {
                newSet.add(run);
            }
            return newSet;
        });
    };

    return (
        <div className="flex flex-col items-center">
            <svg
                ref={svgRef}
                width="100%"
                height="auto"
                viewBox={`0 0 ${size} ${size * 0.8}`}
                className={cn("bg-transparent", disabled && "cursor-not-allowed opacity-70")}
            >
                {/* Background and field markings */}
                <ellipse cx={center.x} cy={center.y} rx={ellipse.rx} ry={ellipse.ry} fill="#006400" />
                <ellipse cx={center.x} cy={center.y} rx={ellipse.rx * 0.95} ry={ellipse.ry * 0.95} fill="#008000" />
                <ellipse cx={center.x} cy={center.y} rx={ellipse.rx * 0.6} ry={ellipse.ry * 0.6} stroke="#fff" strokeWidth="1" strokeDasharray="3 3" fill="none" strokeOpacity="0.5" />
                
                {/* Side Labels */}
                <text x={center.x - 90} y={center.y + 10} fontSize="12" fill="white" opacity="0.6" className="font-sans font-bold uppercase">OFF-SIDE</text>
                <text x={center.x + 50} y={center.y + 10} fontSize="12" fill="white" opacity="0.6" className="font-sans font-bold uppercase">LEG-SIDE</text>

                {/* Pitch */}
                <path d={`M ${center.x - 8} ${center.y - 70} L ${center.x - 8} ${center.y + 15} L ${center.x + 8} ${center.y + 15} L ${center.x + 8} ${center.y - 70} Z`} fill="#BCA48C" />
                <line x1={center.x - 20} y1={center.y - 65} x2={center.x + 20} y2={center.y - 65} stroke="white" strokeWidth="1.5" />
                <line x1={center.x - 4} y1={center.y - 68} x2={center.x + 4} y2={center.y - 68} stroke="white" strokeWidth="2.5" />
                
                {/* Shots */}
                {shots.filter(shot => visibleRuns.has(shot.runs)).map((shot, index) => {
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
                    <button
                        key={item.label}
                        onClick={() => toggleRunVisibility(item.runs)}
                        className={cn(
                            "flex items-center gap-1.5 transition-opacity text-xs",
                            !visibleRuns.has(item.runs) && "opacity-40"
                        )}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.label} x {runCounts[item.runs as keyof typeof runCounts]} = <strong>{item.runs * runCounts[item.runs as keyof typeof runCounts]}</strong></span>
                    </button>
                ))}
            </div>
        </div>
    );
}
