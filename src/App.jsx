import React, { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import RealEstateModule from './components/RealEstateModule'
import RentVsBuy from './components/RentVsBuy'
import SinkingFundCalculator from './components/SinkingFundCalculator'
import FinancialProfile from './components/FinancialProfile'
import { fmt } from './utils/formatters'

const DEFAULT_PROFILE = {
  annualIncome:  95000,
  monthlyDebt:   650,
  liquidSavings: 45000,
  creditScore:   740,
}

const VIEW_LABELS = {
  dashboard:     'Financial Health',
  'real-estate': 'Real Estate Analyzer',
  'rent-vs-buy': 'Rent vs. Buy Analyzer',
  'sinking-fund':'Sinking Fund',
  profile:       'Profile Setup',
}

export default function App() {
  const [profile, setProfile]   = useLocalStorage('financial-profile', DEFAULT_PROFILE)
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const monthly = profile.annualIncome / 12

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <h2 className="font-semibold text-slate-900 text-sm">
            {VIEW_LABELS[activeView]}
          </h2>
          <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Income: <strong className="text-slate-700">{fmt.currency(monthly)}/mo</strong>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              Savings: <strong className="text-slate-700">{fmt.currency(profile.liquidSavings)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              FICO: <strong className="text-slate-700">{profile.creditScore}</strong>
            </span>
            <button
              onClick={() => setActiveView('profile')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {activeView === 'dashboard' && (
            <Dashboard profile={profile} />
          )}
          {activeView === 'real-estate' && (
            <RealEstateModule profile={profile} />
          )}
          {activeView === 'rent-vs-buy' && (
            <RentVsBuy profile={profile} />
          )}
          {activeView === 'sinking-fund' && (
            <SinkingFundCalculator profile={profile} />
          )}
          {activeView === 'profile' && (
            <FinancialProfile profile={profile} setProfile={setProfile} />
          )}
        </main>
      </div>
    </div>
  )
}
