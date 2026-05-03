import React, { useMemo } from 'react'
import { PiggyBank, Plus, Trash2, Target } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { fmt } from '../utils/formatters'
import { calcBudget } from '../utils/calculations'
import { useLocalStorage } from '../hooks/useLocalStorage'

const PRESETS = [
  { label: 'Vacation',       emoji: '✈️',  goal: 5000  },
  { label: 'New Car',        emoji: '🚗',  goal: 25000 },
  { label: 'Home Reno',      emoji: '🏠',  goal: 15000 },
  { label: 'Wedding',        emoji: '💍',  goal: 20000 },
  { label: 'Emergency Top-up', emoji: '🛡️', goal: 10000 },
  { label: 'Tech / Gadgets', emoji: '💻',  goal: 2500  },
]

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6']

const DEFAULT_GOALS = [
  { id: 1, label: 'Vacation', emoji: '✈️', goal: 5000, allocationPct: 30 },
]

function GoalCard({ goal, onUpdate, onDelete, discretionary, idx }) {
  const monthly  = discretionary * (goal.allocationPct / 100)
  const months   = monthly > 0 ? goal.goal / monthly : Infinity
  const color    = COLORS[idx % COLORS.length]
  const pct      = ((goal.allocationPct) / 100)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{goal.emoji}</span>
          <input
            value={goal.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="font-semibold text-slate-900 bg-transparent border-none outline-none text-sm w-28 focus:ring-1 focus:ring-indigo-300 rounded px-1"
          />
        </div>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Goal amount */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-slate-500">Target Amount</label>
          <span className="text-sm font-bold" style={{ color }}>{fmt.currency(goal.goal)}</span>
        </div>
        <input
          type="range" min={500} max={100000} step={500}
          value={goal.goal}
          onChange={(e) => onUpdate({ goal: Number(e.target.value) })}
          className="w-full"
          style={{ background: `linear-gradient(to right,${color} ${((goal.goal - 500) / 99500) * 100}%,#e2e8f0 0%)` }}
        />
      </div>

      {/* Allocation */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-slate-500">Wants Budget Allocation</label>
          <span className="text-sm font-bold" style={{ color }}>{goal.allocationPct}%</span>
        </div>
        <input
          type="range" min={5} max={100} step={5}
          value={goal.allocationPct}
          onChange={(e) => onUpdate({ allocationPct: Number(e.target.value) })}
          className="w-full"
          style={{ background: `linear-gradient(to right,${color} ${((goal.allocationPct - 5) / 95) * 100}%,#e2e8f0 0%)` }}
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Saving {fmt.currency(monthly)}/mo</span>
          <span>{100 - goal.allocationPct}% for other wants</span>
        </div>
      </div>

      {/* Result */}
      <div className="bg-slate-50 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1">Time to Goal</p>
        {isFinite(months) ? (
          <>
            <p className="text-2xl font-black" style={{ color }}>
              {months < 1 ? '< 1 month' : `${months.toFixed(1)} months`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              by {new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </>
        ) : (
          <p className="text-sm text-red-500 font-semibold">Allocate more to start saving</p>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">{fmt.months(payload[0].value)}</p>
    </div>
  )
}

export default function SinkingFundCalculator({ profile }) {
  const [goals, setGoals] = useLocalStorage('sinking-goals', DEFAULT_GOALS)
  const budget      = calcBudget(profile.annualIncome / 12)
  const discretionary = budget.wants

  const updateGoal = (id, patch) =>
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const deleteGoal = (id) => setGoals((gs) => gs.filter((g) => g.id !== id))
  const addGoal = (preset) => {
    const id = Date.now()
    setGoals((gs) => [...gs, { id, label: preset.label, emoji: preset.emoji, goal: preset.goal, allocationPct: 30 }])
  }
  const addCustom = () => addGoal({ label: 'Custom Goal', emoji: '🎯', goal: 5000 })

  const totalAlloc = goals.reduce((s, g) => s + g.allocationPct, 0)

  const chartData = useMemo(() =>
    goals
      .map((g, i) => {
        const monthly = discretionary * (g.allocationPct / 100)
        return {
          name: g.label,
          months: monthly > 0 ? g.goal / monthly : 0,
          color: COLORS[i % COLORS.length],
        }
      })
      .sort((a, b) => a.months - b.months),
    [goals, discretionary]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <PiggyBank size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sinking Fund Calculator</h1>
          <p className="text-slate-500 text-sm">Plan future purchases from your 30% discretionary budget.</p>
        </div>
      </div>

      {/* Budget strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Monthly Wants Budget (30%)',        value: fmt.currency(discretionary),  color: '#f59e0b' },
          { label: 'Allocated to Goals',                value: fmt.percent(Math.min(totalAlloc, 100)),  color: totalAlloc > 100 ? '#ef4444' : '#6366f1' },
          { label: 'Remaining Discretionary',           value: fmt.currency(discretionary * (1 - Math.min(totalAlloc, 100) / 100)), color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
            <p className="text-xl font-black mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {totalAlloc > 100 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          ⚠️ Total allocation ({totalAlloc}%) exceeds 100% of your discretionary budget. Reduce allocations to stay on track.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Your Goals ({goals.length})</h2>
            <button
              onClick={addCustom}
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus size={14} /> Add Goal
            </button>
          </div>

          {goals.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No goals yet</p>
              <p className="text-sm">Add a goal or pick a preset →</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((g, i) => (
              <GoalCard
                key={g.id}
                goal={g}
                idx={i}
                onUpdate={(patch) => updateGoal(g.id, patch)}
                onDelete={() => deleteGoal(g.id)}
                discretionary={discretionary}
              />
            ))}
          </div>
        </div>

        {/* Right panel: presets + chart */}
        <div className="space-y-4">
          {/* Presets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick-Add Presets</h3>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => addGoal(p)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className="font-medium text-slate-700">{p.label}</span>
                  </span>
                  <span className="text-slate-400 font-semibold">{fmt.currency(p.goal)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Goal Timeline</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}mo`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="months" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
