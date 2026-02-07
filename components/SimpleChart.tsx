
import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  data: DataPoint[];
  color?: string;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({ data, color = '#34C759' }) => {
  if (data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data yet</div>;

  const maxValue = Math.max(...data.map(d => d.value)) || 1;
  const padding = 20;
  const height = 160;
  const width = 300;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length > 1 ? data.length - 1 : 1)) * (width - 2 * padding),
    y: height - padding - (d.value / maxValue) * (height - 2 * padding)
  }));

  const pathD = points.length > 1 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.5, 1].map((v, i) => (
          <line 
            key={i}
            x1={padding} y1={height - padding - v * (height - 2 * padding)} 
            x2={width - padding} y2={height - padding - v * (height - 2 * padding)} 
            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4"
          />
        ))}
        
        {/* Line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
        ))}

        {/* Labels (First and Last) */}
        {data.length > 0 && (
          <>
            <text x={points[0].x} y={height - 5} fontSize="8" fill="#9ca3af" textAnchor="start">{data[0].label}</text>
            {data.length > 1 && (
              <text x={points[points.length-1].x} y={height - 5} fontSize="8" fill="#9ca3af" textAnchor="end">{data[data.length-1].label}</text>
            )}
            <text x={width - 5} y={padding} fontSize="8" fill="#34C759" textAnchor="end" fontWeight="bold">{Math.round(maxValue)} max</text>
          </>
        )}
      </svg>
    </div>
  );
};
