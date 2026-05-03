import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { fmt } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.name}: {fmt.currency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function SavingsChart({ liquidSavings, monthlyExpenses }) {
  const target3 = monthlyExpenses * 3
  const target6 = monthlyExpenses * 6
  const coverage = monthlyExpenses > 0 ? liquidSavings / monthlyExpenses : 0

  const data = [
    { label: '3-Month\nTarget', target: target3, current: Math.min(liquidSavings, target3) },
    { label: '6-Month\nTarget', target: target6, current: Math.min(liquidSavings, target6) },
  ]

  const barColor = coverage >= 6 ? '#10b981' : coverage >= 3 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Emergency Coverage
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {fmt.months(coverage)}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full border"
          style={{
            color: barColor,
            borderColor: barColor + '55',
            background: barColor + '15',
          }}
        >
          {coverage >= 6 ? 'Excellent' : coverage >= 3 ? 'Adequate' : 'Underfunded'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => fmt.currencyShort(v)}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="current" name="Your Savings" radius={[4, 4, 0, 0]} fill={barColor} />
          <Bar dataKey="target"  name="Target"       radius={[4, 4, 0, 0]} fill="#e2e8f0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
