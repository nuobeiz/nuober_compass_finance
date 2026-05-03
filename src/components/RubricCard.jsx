import React, { useState } from 'react'
import {
  Home, CreditCard, TrendingUp, Shield, PiggyBank,
  Star, CheckCircle, ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { STATUS_STYLES } from '../config/rubrics'

const ICONS = { Home, CreditCard, TrendingUp, Shield, PiggyBank, Star, CheckCircle }

const STATUS_LABEL = {
  pass:    'Pass',
  stretch: 'Stretch',
  fail:    'High Risk',
  info:    'Info',
}

const CHECK_ICON = {
  pass:    '✓',
  stretch: '~',
  fail:    '✕',
  info:    'ℹ',
}

export default function RubricCard({ rubric, result, status, purchase }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICONS[rubric.icon] || Info
  const s = STATUS_STYLES[status] || STATUS_STYLES.info

  // Down payment special case for VA
  let advice = rubric.advice?.[status]
  if (rubric.id === 'down_payment' && purchase?.isVALoan && status === 'pass') {
    advice = rubric.advice?.va_pass || advice
  }
  if (rubric.id === 'va_funding_fee') {
    advice = rubric.advice?.info
  }

  return (
    <div
      className={`
        bg-white rounded-2xl border shadow-sm overflow-hidden
        transition-all duration-200 hover:shadow-md
        ${s.border}
      `}
    >
      {/* Top color bar */}
      <div className={`h-1 ${s.dot}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <Icon size={15} className={s.icon} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{rubric.label}</p>
                {rubric.vaOnly && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wide">
                    VA
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{rubric.category}</p>
            </div>
          </div>

          <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>
            {CHECK_ICON[status]} {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Value + benchmark */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className={`text-2xl font-black ${s.icon}`}>{result?.display ?? '—'}</p>
            {result?.rate && (
              <p className="text-xs text-slate-400 mt-0.5">Rate: {result.rate}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Target</p>
            <p className="text-sm font-semibold text-slate-600">{result?.benchmark ?? '—'}</p>
          </div>
        </div>

        {/* Advice */}
        {advice && (
          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            {advice}
          </p>
        )}

        {/* Extra details toggle */}
        {(result?.remaining !== undefined || result?.surplus !== undefined || result?.cashOut !== undefined) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Show'} details
          </button>
        )}

        {expanded && (
          <div className="mt-3 bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs animate-slide-in">
            {result?.cashOut !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Cash required at close</span>
                <span className="font-semibold text-slate-700">
                  ${Math.round(result.cashOut).toLocaleString()}
                </span>
              </div>
            )}
            {result?.remaining !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining liquid cash</span>
                <span className="font-semibold text-slate-700">
                  ${Math.max(0, Math.round(result.remaining)).toLocaleString()}
                </span>
              </div>
            )}
            {result?.required !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">VA required minimum</span>
                <span className="font-semibold text-slate-700">${result.required}/mo</span>
              </div>
            )}
            {result?.surplus !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Surplus / deficit</span>
                <span className={`font-semibold ${result.surplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.surplus >= 0 ? '+' : ''}{Math.round(result.surplus).toLocaleString()}/mo
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
