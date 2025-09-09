

'use client';

import * as React from 'react';
import type { RunMapData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Pie, PieChart, Cell } from 'recharts';

interface RunMapProps {
    data: RunMapData;
}

const COLORS = {
  fineLeg: '#ef4444', // red
  squareLeg: '#f97316', // orange
  midWicket: '#eab308', // yellow
  longOn: '#84cc16', // lime
  longOff: '#22c55e', // green
  cover: '#14b8a6', // teal
  point: '#3b82f6', // blue
  thirdMan: '#8b5cf6', // violet
};

const SECTORS = [
  { name: 'Cover', dataKey: 'cover', color: COLORS.cover },
  { name: 'Long Off', dataKey: 'longOff', color: COLORS.longOff },
  { name: 'Long On', dataKey: 'longOn', color: COLORS.longOn },
  { name: 'Mid-Wicket', dataKey: 'midWicket', color: COLORS.midWicket },
  { name: 'Square Leg', dataKey: 'squareLeg', color: COLORS.squareLeg },
  { name: 'Fine Leg', dataKey: 'fineLeg', color: COLORS.fineLeg },
  { name: 'Third Man', dataKey: 'thirdMan', color: COLORS.thirdMan },
  { name: 'Point', dataKey: 'point', color: COLORS.point },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function RunMap({ data }: RunMapProps) {
    const size = 300;
    const center = size / 2;

    const chartData = SECTORS.map(sector => ({
        name: sector.name,
        value: data[sector.dataKey as keyof RunMapData],
    }));

    return (
        <div className="relative w-full aspect-square" style={{ maxWidth: `${size}px` }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
                {/* Field */}
                <circle cx={center} cy={center} r={center} fill="#4CAF50" />
                <circle cx={center} cy={center} r={center * 0.95} fill="#388E3C" />
                <circle cx={center} cy={center} r={center * 0.5} stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />
                {/* Pitch */}
                <rect x={center - 7} y={center - 50} width="14" height="100" fill="#BCA48C" />
            </svg>
             <PieChart width={size} height={size}>
                <Pie
                    data={chartData}
                    cx={center}
                    cy={center}
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={center * 0.95}
                    innerRadius={center * 0.4}
                    dataKey="value"
                    startAngle={-22.5}
                    endAngle={337.5}
                    stroke="white"
                    strokeWidth={2}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SECTORS[index].color} />
                    ))}
                </Pie>
            </PieChart>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-background/50 backdrop-blur-sm rounded-full p-4">
                    <p className="text-sm font-bold text-center text-foreground">Scoring</p>
                    <p className="text-xs text-center text-muted-foreground">Areas</p>
                </div>
            </div>
        </div>
    );
}
