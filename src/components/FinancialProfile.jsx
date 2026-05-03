import React from 'react'
import { DollarSign, CreditCard, Landmark, BarChart2, CheckCircle } from 'lucide-react'
import { fmt } from '../utils/formatters'

const CREDIT_BANDS = [
  { min: 800, label: 'Exceptional', color: '#10b981' },
  { min: 740, label: 'Very Good',   color: '#6366f1' },
  { min: 670, label: 'Good',        color: '#3b82f6' },
  { min: 580, label: 'Fair',        color: '#f59e0b' },
  { min: 0,   label: 'Poor',        color: '#ef4444' },
]

function creditBand(score) {
  return CREDIT_BANDS.find((b) => score >= b.min) || CREDIT_BANDS[CREDIT_BANDS.length - 1]
}

function Field({ icon: Icon, label, value, onChange, min, max, step, prefix, format }) {
  const display = format ? format(value) : value
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Icon size={15} className="text-slate-400" />
          {label}
        </label>
        <span className="text-sm font-bold text-slate-900">
          {prefix}{display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #4f46e5 ${((value - min) / (max - min)) * 100}%, #e2e8f0 0%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{prefix}{format ? format(min) : min}</span>
        <span>{prefix}{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

export default function FinancialProfile({ profile, setProfile }) {
  const set = (key) => (val) => setProfile((p) => ({ ...p, [key]: val }))
  const band = creditBand(profile.creditScore)
  const monthlyIncome = profile.annualIncome / 12

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Profile</h1>
        <p className="text-slate-500 mt-1">
          This data powers every rubric across all modules. Changes apply instantly.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Annual Income',    value: fmt.currency(profile.annualIncome) },
          { label: 'Monthly Income',   value: fmt.currency(monthlyIncome) },
          { label: 'Monthly Debt',     value: fmt.currency(profile.monthlyDebt) },
          { label: 'Liquid Savings',   value: fmt.currency(profile.liquidSavings) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-400 font-medium">{label}</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Sliders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <DollarSign size={15} className="text-indigo-500" /> Income & Debt
          </h2>
          <div className="space-y-7">
            <Field
              icon={DollarSign}
              label="Annual Gross Income"
              value={profile.annualIncome}
              onChange={set('annualIncome')}
              min={20000} max={500000} step={5000}
              format={(v) => fmt.currency(v)}
            />
            <Field
              icon={CreditCard}
              label="Existing Monthly Debt Payments"
              value={profile.monthlyDebt}
              onChange={set('monthlyDebt')}
              min={0} max={5000} step={50}
              format={(v) => fmt.currency(v)}
            />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Landmark size={15} className="text-emerald-500" /> Assets & Credit
          </h2>
          <div className="space-y-7">
            <Field
              icon={Landmark}
              label="Liquid Savings (Checking + HYSA)"
              value={profile.liquidSavings}
              onChange={set('liquidSavings')}
              min={0} max={500000} step={1000}
              format={(v) => fmt.currency(v)}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <BarChart2 size={15} className="text-slate-400" />
                  Credit Score (FICO)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{profile.creditScore}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: band.color, background: band.color + '18' }}
                  >
                    {band.label}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={300} max={850} step={5}
                value={profile.creditScore}
                onChange={(e) => set('creditScore')(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, ${band.color} ${((profile.creditScore - 300) / (850 - 300)) * 100}%, #e2e8f0 0%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>300 — Poor</span>
                <span>579 — Fair</span>
                <span>740 — Very Good</span>
                <span>850 — Exceptional</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
        <CheckCircle size={15} className="text-indigo-500 flex-shrink-0" />
        All data is stored locally in your browser — nothing is transmitted externally.
      </div>
    </div>
  )
}
