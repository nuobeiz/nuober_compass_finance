import React from 'react'
import { TrendingUp, Shield, CreditCard, Landmark, Award } from 'lucide-react'
import { fmt } from '../utils/formatters'
import { calcHealthScore, calcBudget } from '../utils/calculations'
import DTIGauge from './charts/DTIGauge'
import SavingsChart from './charts/SavingsChart'
import BudgetChart from './charts/BudgetChart'

const SCORE_CONFIG = [
  { min: 85, label: 'Exceptional',  color: '#10b981', bg: 'bg-emerald-500' },
  { min: 70, label: 'Strong',       color: '#6366f1', bg: 'bg-indigo-500' },
  { min: 55, label: 'Adequate',     color: '#3b82f6', bg: 'bg-blue-500' },
  { min: 40, label: 'Fair',         color: '#f59e0b', bg: 'bg-amber-500' },
  { min: 0,  label: 'Needs Work',   color: '#ef4444', bg: 'bg-red-500' },
]

function scoreConf(n) {
  return SCORE_CONFIG.find((s) => n >= s.min) || SCORE_CONFIG[SCORE_CONFIG.length - 1]
}

function StatCard({ icon: Icon, label, value, sub, color = '#6366f1' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ profile }) {
  const monthly     = profile.annualIncome / 12
  const dti         = monthly > 0 ? (profile.monthlyDebt / monthly) * 100 : 0
  const monthlyExp  = monthly * 0.50
  const budget      = calcBudget(monthly)
  const score       = calcHealthScore(profile)
  const conf        = scoreConf(score)
  const emgCoverage = monthlyExp > 0 ? profile.liquidSavings / monthlyExp : 0

  // Hypothetical front-end if spending full needs budget on housing
  const hypotheticalFE = monthly > 0 ? (budget.needs / monthly) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Health</h1>
        <p className="text-slate-500 mt-1">Your holistic financial command center.</p>
      </div>

      {/* Health Score Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, #6366f1, transparent)' }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Score ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#334155" strokeWidth="8" />
              <circle
                cx="48" cy="48" r="40" fill="none"
                stroke={conf.color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black">{score}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">/ 100</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Financial Scorecard</p>
            <h2 className="text-3xl font-black mb-1" style={{ color: conf.color }}>{conf.label}</h2>
            <p className="text-slate-400 text-sm">
              Based on your DTI, emergency reserves, credit score, and savings rate.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              { label: 'Annual Income',  val: fmt.currencyShort(profile.annualIncome) },
              { label: 'Credit Score',   val: profile.creditScore },
              { label: 'Monthly Debt',   val: fmt.currency(profile.monthlyDebt) },
              { label: 'Liquid Savings', val: fmt.currencyShort(profile.liquidSavings) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/5 rounded-xl px-3 py-2">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-white">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Current DTI"
          value={fmt.percent(dti)}
          sub={dti <= 36 ? 'Healthy level' : 'Above target'}
          color={dti <= 28 ? '#10b981' : dti <= 36 ? '#f59e0b' : '#ef4444'}
        />
        <StatCard
          icon={Shield}
          label="Emergency Fund"
          value={fmt.months(emgCoverage)}
          sub={emgCoverage >= 6 ? 'Fully funded' : emgCoverage >= 3 ? 'Partially funded' : 'Underfunded'}
          color={emgCoverage >= 6 ? '#10b981' : emgCoverage >= 3 ? '#f59e0b' : '#ef4444'}
        />
        <StatCard
          icon={CreditCard}
          label="Monthly Obligations"
          value={fmt.currency(profile.monthlyDebt)}
          sub="Existing debt payments"
          color="#6366f1"
        />
        <StatCard
          icon={Award}
          label="Credit Score"
          value={profile.creditScore}
          sub={profile.creditScore >= 740 ? 'Best rate tier' : profile.creditScore >= 700 ? 'Good rates' : 'Shop carefully'}
          color={profile.creditScore >= 740 ? '#10b981' : profile.creditScore >= 670 ? '#6366f1' : '#f59e0b'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* DTI Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Debt-to-Income Gauges</h3>
          <p className="text-xs text-slate-400 mb-3">Current profile (without a mortgage)</p>
          <DTIGauge frontEndDTI={dti} backEndDTI={dti} />
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Add a real estate purchase to see your projected DTI.
          </p>
        </div>

        {/* Savings Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Savings vs. Emergency Targets</h3>
          <SavingsChart
            liquidSavings={profile.liquidSavings}
            monthlyExpenses={monthlyExp}
          />
        </div>

        {/* 50/30/20 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">50/30/20 Budget Breakdown</h3>
          <p className="text-xs text-slate-400 mb-3">Based on {fmt.currency(monthly)}/mo gross</p>
          <BudgetChart monthlyGross={monthly} />
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Discretionary Budget',
            value: fmt.currency(budget.wants),
            desc: '30% of gross income — your sinking fund fuel.',
            color: '#f59e0b',
          },
          {
            title: 'Max Safe Housing Payment',
            value: fmt.currency(monthly * 0.28),
            desc: 'At 28% front-end DTI — use the Real Estate module to test a property.',
            color: '#6366f1',
          },
          {
            title: 'Target Emergency Fund',
            value: fmt.currency(monthlyExp * 6),
            desc: '6 months of estimated living expenses.',
            color: '#10b981',
          },
        ].map(({ title, value, desc, color }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{title}</p>
            <p className="text-xl font-bold mt-1 mb-2" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
