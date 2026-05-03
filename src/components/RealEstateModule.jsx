import React, { useMemo } from 'react'
import { Building2, Users } from 'lucide-react'
import { fmt } from '../utils/formatters'
import { calcPITI } from '../utils/calculations'
import { REAL_ESTATE_RUBRICS, VA_RUBRICS } from '../config/rubrics'
import { useLocalStorage } from '../hooks/useLocalStorage'
import RubricCard from './RubricCard'
import ProFormaSummary from './ProFormaSummary'
import DTIGauge from './charts/DTIGauge'

const DEFAULT_PURCHASE = {
  purchasePrice:  450000,
  downPaymentPct: 20,
  interestRate:   6.75,
  termYears:      30,
  isVALoan:       false,
  isFirstVAUse:   true,
  familySize:     4,
}

function Slider({ label, value, onChange, min, max, step, format, sublabel }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-indigo-600">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ background: `linear-gradient(to right,#4f46e5 ${pct}%,#e2e8f0 0%)` }}
      />
      {sublabel && <p className="text-[10px] text-slate-400">{sublabel}</p>}
    </div>
  )
}

function Toggle2({ label, checked, onChange, desc }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-blue-900">{label}</p>
        {desc && <p className="text-xs text-blue-600 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function RealEstateModule({ profile }) {
  const [purchase, setPurchase] = useLocalStorage('re-purchase', DEFAULT_PURCHASE)
  const set = (key) => (val) => setPurchase((p) => ({ ...p, [key]: val }))

  const pitiBreakdown = useMemo(() => calcPITI(purchase), [purchase])

  const activeRubrics = useMemo(() =>
    purchase.isVALoan
      ? [...REAL_ESTATE_RUBRICS, ...VA_RUBRICS]
      : REAL_ESTATE_RUBRICS,
    [purchase.isVALoan]
  )

  const rubricResults = useMemo(() =>
    activeRubrics.map((rubric) => {
      const result = rubric.compute(profile, purchase)
      const status = rubric.evaluate(result, profile, purchase)
      return { rubric, result, status }
    }),
    [activeRubrics, profile, purchase]
  )

  const monthly = profile.annualIncome / 12
  const frontDTI = monthly > 0 ? (pitiBreakdown.total / monthly) * 100 : 0
  const backDTI  = monthly > 0 ? ((pitiBreakdown.total + profile.monthlyDebt) / monthly) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Building2 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Real Estate Analyzer</h1>
          <p className="text-slate-500 text-sm">Stress-test any property against your financial profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left column: Sandbox ───────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          {/* VA Loan Toggle */}
          <Toggle2
            label="VA Loan Benefit"
            checked={purchase.isVALoan}
            onChange={set('isVALoan')}
            desc="Waives 20% down requirement & PMI. Adds funding fee."
          />

          {purchase.isVALoan && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 space-y-3 animate-slide-in">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">VA Settings</p>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">First-Time VA Use</label>
                <button
                  onClick={() => set('isFirstVAUse')(!purchase.isFirstVAUse)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${purchase.isFirstVAUse ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${purchase.isFirstVAUse ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Users size={13} className="text-slate-400" /> Family Size
                  </label>
                  <span className="text-sm font-bold text-indigo-600">{purchase.familySize}</span>
                </div>
                <input
                  type="range" min={1} max={5} step={1}
                  value={purchase.familySize}
                  onChange={(e) => set('familySize')(Number(e.target.value))}
                  className="w-full"
                  style={{ background: `linear-gradient(to right,#4f46e5 ${((purchase.familySize - 1) / 4) * 100}%,#e2e8f0 0%)` }}
                />
                <p className="text-[10px] text-slate-400">Affects VA residual income requirements</p>
              </div>
            </div>
          )}

          {/* Purchase Sandbox */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900">Purchase Sandbox</h2>

            <Slider
              label="Purchase Price"
              value={purchase.purchasePrice}
              onChange={set('purchasePrice')}
              min={100000} max={2000000} step={5000}
              format={fmt.currency}
            />
            <Slider
              label="Down Payment"
              value={purchase.downPaymentPct}
              onChange={set('downPaymentPct')}
              min={purchase.isVALoan ? 0 : 3}
              max={40}
              step={0.5}
              format={(v) => `${v.toFixed(1)}% — ${fmt.currency(purchase.purchasePrice * v / 100)}`}
              sublabel={purchase.isVALoan && purchase.downPaymentPct === 0 ? '0% allowed with VA benefit' : undefined}
            />
            <Slider
              label="Interest Rate"
              value={purchase.interestRate}
              onChange={set('interestRate')}
              min={2} max={12} step={0.125}
              format={(v) => `${v.toFixed(3)}%`}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Loan Term</label>
              <div className="flex gap-2">
                {[30, 20, 15].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => set('termYears')(yr)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      purchase.termYears === yr
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {yr} yr
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live PITI card */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Live PITI Estimate</p>
            {[
              { label: 'Principal & Interest', val: pitiBreakdown.pi },
              { label: 'Property Tax',         val: pitiBreakdown.tax },
              { label: 'Insurance',            val: pitiBreakdown.insurance },
              ...(pitiBreakdown.pmi > 0 ? [{ label: 'PMI', val: pitiBreakdown.pmi }] : []),
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold">{fmt.currency(val)}/mo</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-white">Total PITI</span>
              <span className="text-xl font-black text-indigo-300">{fmt.currency(pitiBreakdown.total)}/mo</span>
            </div>
          </div>

          {/* DTI mini gauges */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Projected DTI</h3>
            <p className="text-xs text-slate-400 mb-3">With this mortgage added to your profile</p>
            <DTIGauge frontEndDTI={frontDTI} backEndDTI={backDTI} />
          </div>
        </div>

        {/* ── Right columns: Rubric Grid + Verdict ──────────────────────── */}
        <div className="xl:col-span-2 space-y-5">
          {/* Rubric Grid */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Affordability Rubric Grid</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rubricResults.map(({ rubric, result, status }) => (
                <RubricCard
                  key={rubric.id}
                  rubric={rubric}
                  result={result}
                  status={status}
                  purchase={purchase}
                />
              ))}
            </div>
          </div>

          {/* Pro-Forma Verdict */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Pro-Forma Summary</h2>
            <ProFormaSummary
              profile={profile}
              purchase={purchase}
              pitiBreakdown={pitiBreakdown}
              rubricResults={rubricResults}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
