import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, DollarSign } from 'lucide-react'
import { fmt } from '../utils/formatters'
import { STATUS } from '../config/rubrics'
import { calcBudget } from '../utils/calculations'

function getVerdict(statuses) {
  if (statuses.some((s) => s === STATUS.FAIL))    return 'HIGH RISK'
  if (statuses.some((s) => s === STATUS.STRETCH)) return 'STRETCH'
  return 'SAFE'
}

const VERDICT_CONFIG = {
  SAFE: {
    icon:  CheckCircle,
    color: '#10b981',
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    text:  'text-emerald-800',
    label: 'Verdict: Safe',
    desc:  'All rubrics pass. This purchase aligns with your financial profile.',
  },
  STRETCH: {
    icon:  AlertTriangle,
    color: '#f59e0b',
    bg:    'bg-amber-50',
    border:'border-amber-200',
    text:  'text-amber-800',
    label: 'Verdict: Stretch',
    desc:  'Some metrics are outside guidelines. Proceed with a conservative cash buffer.',
  },
  'HIGH RISK': {
    icon:  XCircle,
    color: '#ef4444',
    bg:    'bg-red-50',
    border:'border-red-200',
    text:  'text-red-800',
    label: 'Verdict: High Risk',
    desc:  'One or more critical thresholds are breached. Reconsider or restructure this purchase.',
  },
}

export default function ProFormaSummary({ profile, purchase, pitiBreakdown, rubricResults }) {
  const statuses = rubricResults.map((r) => r.status).filter((s) => s !== STATUS.INFO)
  const verdict  = getVerdict(statuses)
  const vc       = VERDICT_CONFIG[verdict]
  const VIcon    = vc.icon

  const monthly  = profile.annualIncome / 12
  const budget   = calcBudget(monthly)
  const totalObligation = pitiBreakdown.total + profile.monthlyDebt
  const discretionary   = monthly - totalObligation - budget.needs * 0.5
  const passCount   = statuses.filter((s) => s === STATUS.PASS).length
  const totalCount  = statuses.length

  return (
    <div className={`rounded-2xl border ${vc.border} ${vc.bg} p-6 space-y-5 animate-slide-in`}>
      {/* Verdict header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: vc.color + '20' }}>
          <VIcon size={22} style={{ color: vc.color }} />
        </div>
        <div>
          <p className={`text-lg font-black ${vc.text}`}>{vc.label}</p>
          <p className={`text-sm ${vc.text} opacity-80`}>{vc.desc}</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`text-2xl font-black ${vc.text}`}>{passCount}/{totalCount}</p>
          <p className={`text-xs ${vc.text} opacity-70`}>rules passed</p>
        </div>
      </div>

      {/* PITI Breakdown */}
      <div className="bg-white/60 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Monthly Payment Breakdown (PITIA)
        </p>
        {[
          { label: 'Principal & Interest',          value: pitiBreakdown.pi },
          { label: 'Property Tax (est.)',            value: pitiBreakdown.tax },
          { label: "Homeowner's Insurance",          value: pitiBreakdown.insurance },
          pitiBreakdown.pmi  > 0 && { label: 'PMI',                          value: pitiBreakdown.pmi },
          pitiBreakdown.hoa  > 0 && { label: 'HOA Fees',                     value: pitiBreakdown.hoa },
          pitiBreakdown.fundingFee > 0 && { label: 'VA Funding Fee (financed)', value: pitiBreakdown.fundingFee / 360, note: 'amortized' },
        ].filter(Boolean).map(({ label, value, note }) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-slate-500">{label}{note && <span className="text-[10px] text-slate-400 ml-1">({note})</span>}</span>
            <span className="font-semibold text-slate-700">{fmt.currency(value)}/mo</span>
          </div>
        ))}
        <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
          <span className="font-bold text-slate-900">Total PITI</span>
          <span className="font-black text-slate-900 text-base">{fmt.currency(pitiBreakdown.total)}/mo</span>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="bg-white/60 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Estimated Monthly Cash Flow
        </p>
        {[
          { label: 'Gross Monthly Income',          value: monthly,               sign: '+', color: '#10b981' },
          { label: 'Housing (PITIA)',                value: -pitiBreakdown.total,  sign: '−', color: '#ef4444' },
          { label: 'Existing Debt Payments',         value: -profile.monthlyDebt,  sign: '−', color: '#ef4444' },
          { label: 'Living Expenses (est. 50%)',     value: -(budget.needs * 0.5), sign: '−', color: '#f59e0b' },
        ].map(({ label, value, sign, color }) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold" style={{ color }}>{sign} {fmt.currency(Math.abs(value))}</span>
          </div>
        ))}
        <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
          <span className="font-bold text-slate-900">Discretionary Remaining</span>
          <span
            className="font-black text-base"
            style={{ color: discretionary >= 500 ? '#10b981' : discretionary >= 0 ? '#f59e0b' : '#ef4444' }}
          >
            {fmt.currency(discretionary)}/mo
          </span>
        </div>
      </div>

      {/* Loan summary row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Loan Amount',   value: fmt.currency(pitiBreakdown.baseLoan) },
          { label: 'Down Payment',  value: fmt.currency(pitiBreakdown.downPayment) },
          { label: 'Total PITI',    value: fmt.currency(pitiBreakdown.total) + '/mo' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/60 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
