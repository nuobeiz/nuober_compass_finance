import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const GAUGE_MAX = 50 // display up to 50% DTI

function Gauge({ value, threshold, label, sublabel }) {
  const capped = Math.min(value, GAUGE_MAX)
  const color = value <= threshold
    ? '#10b981'
    : value <= threshold * 1.15
    ? '#f59e0b'
    : '#ef4444'

  const data = [{ value: capped, fill: color }]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-36 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="85%"
            data={data}
            startAngle={225}
            endAngle={-45}
            barSize={10}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, GAUGE_MAX]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#e2e8f0' }}
              dataKey="value"
              cornerRadius={5}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold" style={{ color }}>
            {value.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
            DTI
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-xs text-slate-400">{sublabel}</p>
    </div>
  )
}

export default function DTIGauge({ frontEndDTI, backEndDTI }) {
  return (
    <div className="flex justify-around items-center py-4">
      <Gauge value={frontEndDTI} threshold={28} label="Front-End" sublabel="≤ 28% guideline" />
      <div className="w-px h-24 bg-slate-100" />
      <Gauge value={backEndDTI} threshold={36} label="Back-End" sublabel="≤ 36% guideline" />
    </div>
  )
}
