
'use client';

import * as React from 'react';
import type { RunMapData, ShotData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Pie, PieChart, Cell } from 'recharts';

interface RunMapProps {
    shots: ShotData[];
    size?: number;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
  '#22c55e', // green-500
  '#84cc16', // lime-500
  '#eab308', // yellow-500
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
];

const SECTORS = [
  { name: 'Point', angle: 0 },
  { name: 'Cover', angle: 45 },
  { name: 'Long Off', angle: 90 },
  { name: 'Long On', angle: 135 },
  { name: 'Mid-Wicket', angle: 180 },
  { name: 'Square Leg', angle: 225 },
  { name: 'Fine Leg', angle: 270 },
  { name: 'Third Man', angle: 315 },
];

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, value, name }: any) => {
    if (value === 0) return null;
    const radius = outerRadius * 0.7;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none drop-shadow-md">
            {value}%
        </text>
    );
};

const calculateRunMapData = (shots: ShotData[]): { name: string; value: number }[] => {
    const runMap: Record<string, number> = {
        'Point': 0, 'Cover': 0, 'Long Off': 0, 'Long On': 0,
        'Mid-Wicket': 0, 'Square Leg': 0, 'Fine Leg': 0, 'Third Man': 0
    };
    let totalRuns = 0;

    shots.forEach(shot => {
        if(shot.runs > 0) {
            totalRuns += shot.runs;
            const angle = shot.angle;

            if (angle >= 337.5 || angle < 22.5) runMap.Point += shot.runs;
            else if (angle >= 22.5 && angle < 67.5) runMap.Cover += shot.runs;
            else if (angle >= 67.5 && angle < 112.5) runMap['Long Off'] += shot.runs;
            else if (angle >= 112.5 && angle < 157.5) runMap['Long On'] += shot.runs;
            else if (angle >= 157.5 && angle < 202.5) runMap['Mid-Wicket'] += shot.runs;
            else if (angle >= 202.5 && angle < 247.5) runMap['Square Leg'] += shot.runs;
            else if (angle >= 247.5 && angle < 292.5) runMap['Fine Leg'] += shot.runs;
            else if (angle >= 292.5 && angle < 337.5) runMap['Third Man'] += shot.runs;
        }
    });

    const data = SECTORS.map(sector => ({
        name: sector.name,
        value: totalRuns > 0 ? Math.round((runMap[sector.name] / totalRuns) * 100) : 0,
    }));
    
    // Ensure percentages add up to 100
    const currentTotal = data.reduce((sum, item) => sum + item.value, 0);
    if (totalRuns > 0 && currentTotal !== 100) {
        const diff = 100 - currentTotal;
        const maxValIndex = data.reduce((maxIndex, item, index, arr) => item.value > arr[maxIndex].value ? index : maxIndex, 0);
        data[maxValIndex].value += diff;
    }

    return data;
};

export function RunMap({ shots, size = 300 }: RunMapProps) {
    const center = size / 2;
    const chartData = calculateRunMapData(shots);

    return (
        <div className="relative w-full aspect-square" style={{ maxWidth: `${size}px` }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
                <defs>
                    <pattern id="checkered" patternUnits="userSpaceOnUse" width="20" height="20">
                        <rect x="0" y="0" width="10" height="10" fill="#43A047" />
                        <rect x="10" y="0" width="10" height="10" fill="#4CAF50" />
                        <rect x="0" y="10" width="10" height="10" fill="#4CAF50" />
                        <rect x="10" y="10" width="10" height="10" fill="#43A047" />
                    </pattern>
                </defs>

                {/* Main field background */}
                <circle cx={center} cy={center} r={center} fill="#388E3C" />
                {/* Checkered inner circle */}
                <circle cx={center} cy={center} r={center * 0.55} fill="url(#checkered)" />
                
                {/* Outfield sector lines */}
                 {SECTORS.map((sector, index) => {
                    const angle = sector.angle - 22.5; // Start angle for each sector
                    const endX = center + center * Math.cos(angle * Math.PI / 180);
                    const endY = center + center * Math.sin(angle * Math.PI / 180);
                    return <line key={index} x1={center} y1={center} x2={endX} y2={endY} stroke="white" strokeWidth="1" strokeOpacity="0.5" />;
                })}
                
                {/* 30-yard circle */}
                <circle cx={center} cy={center} r={center * 0.55} stroke="white" strokeWidth="1" strokeDasharray="3 3" fill="none" />

                {/* Pitch */}
                <rect x={center - 7} y={center - 50} width="14" height="100" fill="#BCA48C" />
                
                {/* Creases */}
                <line x1={center - 20} y1={center - 40} x2={center + 20} y2={center - 40} stroke="white" strokeWidth="1.5" />
                <line x1={center - 20} y1={center + 40} x2={center + 20} y2={center + 40} stroke="white" strokeWidth="1.5" />
                
                {/* Stumps */}
                <rect x={center - 4} y={center - 44} width="8" height="6" fill="white" />
                <rect x={center - 4} y={center + 38} width="8" height="6" fill="white" />
                
            </svg>
             <PieChart width={size} height={size}>
                <Pie
                    data={chartData}
                    cx={center}
                    cy={center}
                    labelLine={false}
                    outerRadius={center * 0.9}
                    innerRadius={center * 0.4}
                    dataKey="value"
                    startAngle={22.5}
                    endAngle={382.5}
                    stroke="white"
                    strokeWidth={0.5}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} fillOpacity={0.5} />
                    ))}
                </Pie>
            </PieChart>
             <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 pointer-events-none">
                 {/* Sector Labels */}
                {chartData.map((entry, index) => {
                    const midAngle = (SECTORS[index].angle) * Math.PI / 180;
                    const nameRadius = center * 0.9;
                    const valueRadius = center * 0.65;
                    
                    const nameX = center + nameRadius * Math.cos(-midAngle);
                    const nameY = center + nameRadius * Math.sin(-midAngle);
                    const valueX = center + valueRadius * Math.cos(-midAngle);
                    const valueY = center + valueRadius * Math.sin(-midAngle);
                    
                    return (
                        <g key={index}>
                             <text x={nameX} y={nameY} fill="white" fontSize="8" textAnchor="middle" dominantBaseline="middle" className="font-sans uppercase font-bold" style={{textShadow: '1px 1px 2px black' }}>
                                {entry.name}
                            </text>
                            {entry.value > 0 && (
                                <text x={valueX} y={valueY} fill="white" fontSize="12" textAnchor="middle" dominantBaseline="middle" className="font-sans font-bold" style={{textShadow: '1px 1px 2px black'}}>
                                    {entry.value}%
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
