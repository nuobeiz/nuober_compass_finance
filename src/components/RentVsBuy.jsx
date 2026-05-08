import React, { useMemo } from 'react'
import { Scale, TrendingUp, Home, Info } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { fmt } from '../utils/formatters'
import { calcRentVsBuyData } from '../utils/calculations'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── Defaults ────────────────────────────────────────────────────────────────────

const DEFAULT_RE = {
  purchasePrice: 450000, downPaymentPct: 20, interestRate: 6.75,
  termYears: 30, isVALoan: false, isFirstVAUse: true, familySize: 4, hoaMonthly: 0,
}
const DEFAULT_SETTINGS = {
  monthlyRent:      2000,
  stockReturn:      10.0,   // historical S&P 500 nominal avg
  homeAppreciation: 4.0,    // historical US nominal avg
  timeHorizon:      30,
  maintenancePct:   1.0,
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function SettingsSlider({ label, value, onChange, min, max, step, format, note, accentColor = '#4f46e5' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold" style={{ color: accentColor }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={{ background: `linear-gradient(to right,${accentColor} ${pct}%,#e2e8f0 0%)` }}
      />
      {note && <p className="text-[10px] text-slate-400">{note}</p>}
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const buy   = payload.find(p => p.dataKey === 'buyerEquity')
  const rent  = payload.find(p => p.dataKey === 'renterPortfolio')
  const winner = (buy?.value ?? 0) >= (rent?.value ?? 0) ? 'Buying' : 'Renting'
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-sm min-w-[200px]">
      <p className="font-bold text-slate-700 mb-2">Year {label}</p>
      {buy && (
        <div className="flex justify-between gap-4">
          <span className="text-emerald-600 font-medium">🏠 Home Equity</span>
          <span className="font-bold text-emerald-700">{fmt.currency(buy.value)}</span>
        </div>
      )}
      {rent && (
        <div className="flex justify-between gap-4">
          <span className="text-indigo-600 font-medium">📈 Stock Portfolio</span>
          <span className="font-bold text-indigo-700">{fmt.currency(rent.value)}</span>
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        {winner} leads by {fmt.currency(Math.abs((buy?.value ?? 0) - (rent?.value ?? 0)))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium leading-tight">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: color + '18' }}>
            <Icon size={14} style={{ color }} />
          </div>
        )}
      </div>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────

export default function RentVsBuy({ profile }) {
  const [purchase]  = useLocalStorage('re-purchase', DEFAULT_RE)
  const [settings, setSettings] = useLocalStorage('rvb-settings', DEFAULT_SETTINGS)
  const set = key => val => setSettings(s => ({ ...s, [key]: val }))

  const results = useMemo(() => calcRentVsBuyData(purchase, settings), [purchase, settings])
  const { data, breakEvenYear, piti, maintenanceMonthly, closingCosts, initialInvestment, atHorizon, totalBuyCost } = results

  const buyWins   = atHorizon.buyerEquity >= atHorizon.renterPortfolio
  const gap       = Math.abs(atHorizon.buyerEquity - atHorizon.renterPortfolio)
  const monthlyCostDiff = totalBuyCost - settings.monthlyRent  // + means buying costs more

  // Slice data to avoid cluttered X-axis on long horizons
  const chartData = settings.timeHorizon > 20
    ? data.filter(d => d.year % 2 === 0 || d.year === 1)
    : data

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Scale size={20} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent vs. Buy Analyzer</h1>
          <p className="text-slate-500 text-sm">
            Compares building home equity against investing the down payment in the stock market.
          </p>
        </div>
      </div>

      {/* Verdict banner */}
      <div
        className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center gap-4 ${
          buyWins
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-indigo-50 border-indigo-200'
        }`}
      >
        <div className="text-3xl">{buyWins ? '🏠' : '📈'}</div>
        <div className="flex-1">
          <p className={`text-lg font-black ${buyWins ? 'text-emerald-800' : 'text-indigo-800'}`}>
            {buyWins
              ? `Buying wins at your ${settings.timeHorizon}-year horizon`
              : `Renting + investing wins at your ${settings.timeHorizon}-year horizon`}
          </p>
          <p className={`text-sm mt-0.5 ${buyWins ? 'text-emerald-700' : 'text-indigo-700'}`}>
            {buyWins
              ? `Home equity (${fmt.currency(atHorizon.buyerEquity)}) exceeds the stock portfolio (${fmt.currency(atHorizon.renterPortfolio)}) by ${fmt.currency(gap)}.`
              : `Stock portfolio (${fmt.currency(atHorizon.renterPortfolio)}) exceeds home equity (${fmt.currency(atHorizon.buyerEquity)}) by ${fmt.currency(gap)}.`}
          </p>
        </div>
        {breakEvenYear !== null && (
          <div className="text-center bg-white/70 rounded-xl px-5 py-3 flex-shrink-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Break-Even</p>
            <p className={`text-2xl font-black ${buyWins ? 'text-emerald-700' : 'text-indigo-700'}`}>
              Year {breakEvenYear}
            </p>
            <p className="text-xs text-slate-400">Buying overtakes renting</p>
          </div>
        )}
        {breakEvenYear === null && (
          <div className="text-center bg-white/70 rounded-xl px-5 py-3 flex-shrink-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Break-Even</p>
            <p className="text-sm font-bold text-slate-500">Beyond {settings.timeHorizon} yrs</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Settings ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Rent + horizon */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900">Rent & Time Horizon</h2>
            <SettingsSlider
              label="Monthly Rent"
              value={settings.monthlyRent}
              onChange={set('monthlyRent')}
              min={500} max={10000} step={50}
              format={fmt.currency}
              accentColor="#6366f1"
            />
            <SettingsSlider
              label="Time Horizon"
              value={settings.timeHorizon}
              onChange={set('timeHorizon')}
              min={5} max={30} step={1}
              format={v => `${v} years`}
              accentColor="#6366f1"
            />
          </div>

          {/* Return assumptions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900">Return Assumptions</h2>

            <SettingsSlider
              label="Stock Market Return"
              value={settings.stockReturn}
              onChange={set('stockReturn')}
              min={1} max={20} step={0.5}
              format={v => `${v.toFixed(1)}%/yr`}
              note="Historical S&P 500 nominal avg ≈ 10%/yr"
              accentColor="#6366f1"
            />
            <SettingsSlider
              label="Home Appreciation"
              value={settings.homeAppreciation}
              onChange={set('homeAppreciation')}
              min={0} max={10} step={0.5}
              format={v => `${v.toFixed(1)}%/yr`}
              note="US historical nominal avg ≈ 4%/yr"
              accentColor="#10b981"
            />
            <SettingsSlider
              label="Annual Maintenance"
              value={settings.maintenancePct}
              onChange={set('maintenancePct')}
              min={0.5} max={3} step={0.25}
              format={v => `${v.toFixed(2)}% of home`}
              note={`≈ ${fmt.currency(purchase.purchasePrice * settings.maintenancePct / 100 / 12)}/mo at current price`}
              accentColor="#f59e0b"
            />
          </div>

          {/* Source note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex gap-2.5">
            <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Purchase price, down payment, rate, HOA, and VA settings are pulled from your{' '}
              <strong>Real Estate module</strong>. Adjust them there to update this analysis.
            </p>
          </div>

          {/* Monthly cost comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Monthly Cost Comparison</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Principal & Interest', val: piti.pi,              color: '#6366f1' },
                { label: 'Property Tax',         val: piti.tax,             color: '#6366f1' },
                { label: 'Insurance',            val: piti.insurance,       color: '#6366f1' },
                ...(piti.pmi > 0 ? [{ label: 'PMI',       val: piti.pmi,  color: '#6366f1' }] : []),
                ...(piti.hoa > 0 ? [{ label: 'HOA Fees',  val: piti.hoa,  color: '#6366f1' }] : []),
                { label: 'Maintenance (est.)',   val: maintenanceMonthly,   color: '#f59e0b' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold" style={{ color }}>{fmt.currency(val)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total — Buying</span>
                <span>{fmt.currency(totalBuyCost)}/mo</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Monthly Rent</span>
                <span className="font-semibold">{fmt.currency(settings.monthlyRent)}/mo</span>
              </div>
              <div className={`flex justify-between font-bold text-sm pt-1 border-t border-slate-100 ${
                monthlyCostDiff > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}>
                <span>{monthlyCostDiff > 0 ? 'Buying costs extra' : 'Renting costs extra'}</span>
                <span>{fmt.currency(Math.abs(monthlyCostDiff))}/mo</span>
              </div>
              {monthlyCostDiff > 0 && (
                <p className="text-[10px] text-slate-400">
                  Renter invests this {fmt.currency(monthlyCostDiff)}/mo difference in stocks.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Chart + metrics ──────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Initial Investment (Renter Invests)"
              value={fmt.currency(initialInvestment)}
              sub="Down pmt + closing costs"
              color="#6366f1"
              icon={TrendingUp}
            />
            <MetricCard
              label={`Home Equity — Yr ${settings.timeHorizon}`}
              value={fmt.currency(atHorizon.buyerEquity)}
              sub={`Home val: ${fmt.currency(atHorizon.homeValue)}`}
              color="#10b981"
              icon={Home}
            />
            <MetricCard
              label={`Stock Portfolio — Yr ${settings.timeHorizon}`}
              value={fmt.currency(atHorizon.renterPortfolio)}
              sub={`At ${settings.stockReturn}%/yr return`}
              color="#6366f1"
              icon={TrendingUp}
            />
            <MetricCard
              label={buyWins ? 'Buying Advantage' : 'Renting Advantage'}
              value={fmt.currency(gap)}
              sub={`After ${settings.timeHorizon} years`}
              color={buyWins ? '#10b981' : '#6366f1'}
              icon={Scale}
            />
          </div>

          {/* Wealth trajectory chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">Wealth Trajectory</h2>
              <span className="text-xs text-slate-400">Home equity vs. invested portfolio</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Renter invests down payment + closing costs ({fmt.currency(initialInvestment)}) at {settings.stockReturn}%/yr,
              plus monthly savings when buying costs more.
            </p>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `Yr ${v}`}
                />
                <YAxis
                  tickFormatter={v => fmt.currencyShort(v)}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={v => v === 'buyerEquity' ? '🏠 Home Equity' : '📈 Stock Portfolio'}
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                {breakEvenYear !== null && (
                  <ReferenceLine
                    x={breakEvenYear}
                    stroke="#94a3b8"
                    strokeDasharray="4 3"
                    label={{ value: `Break-even yr ${breakEvenYear}`, fontSize: 10, fill: '#64748b', position: 'insideTopRight' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="buyerEquity"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="renterPortfolio"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Snapshot table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Milestone Snapshots</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">Year</th>
                    <th className="text-xs font-semibold text-emerald-600 uppercase tracking-wide pb-3 pr-4">Home Equity</th>
                    <th className="text-xs font-semibold text-indigo-600 uppercase tracking-wide pb-3 pr-4">Stock Portfolio</th>
                    <th className="text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3">Leader</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data
                    .filter(d => [1, 3, 5, 10, 15, 20, 25, 30].includes(d.year) && d.year <= settings.timeHorizon)
                    .map(({ year, buyerEquity, renterPortfolio }) => {
                      const buyLeads = buyerEquity >= renterPortfolio
                      return (
                        <tr key={year} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 pr-4 font-semibold text-slate-700">Year {year}</td>
                          <td className="py-2.5 pr-4 font-semibold text-emerald-700">{fmt.currency(buyerEquity)}</td>
                          <td className="py-2.5 pr-4 font-semibold text-indigo-700">{fmt.currency(renterPortfolio)}</td>
                          <td className="py-2.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              buyLeads
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {buyLeads ? '🏠 Buy' : '📈 Rent'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assumptions footnote */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex gap-2.5">
            <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Assumptions:</strong> Stock returns compound monthly. Home appreciation compounds annually.
              PMI is included until the mortgage is paid off (conservative). Mortgage interest tax deduction and
              renter's insurance are not modeled. Maintenance is fixed at {settings.maintenancePct}% of purchase price per year
              and is not inflation-adjusted. This is an educational tool — consult a financial advisor before making housing decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
