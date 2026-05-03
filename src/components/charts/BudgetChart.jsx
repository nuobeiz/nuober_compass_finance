import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt } from '../../utils/formatters'

const SEGMENTS = [
  { key: 'needs',   label: 'Needs',       color: '#6366f1', pct: 50, hint: 'Housing, food, utilities, transport' },
  { key: 'wants',   label: 'Wants',       color: '#f59e0b', pct: 30, hint: 'Dining, travel, entertainment' },
  { key: 'savings', label: 'Save & Invest', color: '#10b981', pct: 20, hint: 'Emergency fund, 401k, investments' },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700">{name}</p>
      <p className="font-bold" style={{ color: p.color }}>{fmt.currency(value)}/mo</p>
      <p className="text-slate-400 text-xs">{p.hint}</p>
    </div>
  )
}

export default function BudgetChart({ monthlyGross }) {
  const data = SEGMENTS.map((s) => ({
    ...s,
    name: s.label,
    value: monthlyGross * (s.pct / 100),
  }))

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            dataKey="value"
            strokeWidth={2}
            stroke="#f8fafc"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {data.map((seg) => (
          <div key={seg.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
              <span className="text-sm text-slate-600">{seg.label} ({seg.pct}%)</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">{fmt.currency(seg.value)}/mo</span>
          </div>
        ))}
      </div>
    </div>
  )
}
