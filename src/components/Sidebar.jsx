import React from 'react'
import {
  LayoutDashboard, Building2, PiggyBank, Settings, ChevronLeft,
  ChevronRight, Zap,
} from 'lucide-react'

const NAV = [
  { id: 'dashboard',    label: 'Financial Health',  icon: LayoutDashboard },
  { id: 'real-estate',  label: 'Real Estate',        icon: Building2 },
  { id: 'sinking-fund', label: 'Sinking Fund',       icon: PiggyBank },
  { id: 'profile',      label: 'Profile Setup',      icon: Settings },
]

export default function Sidebar({ activeView, setActiveView, open, setOpen }) {
  return (
    <aside
      className={`
        flex-shrink-0 flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out
        ${open ? 'w-56' : 'w-16'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${!open && 'justify-center px-0'}`}>
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" strokeWidth={2.5} />
        </div>
        {open && (
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-white truncate">Decision Engine</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Strategic Purchases</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`
                w-full flex items-center gap-3 rounded-xl transition-all duration-150 text-left
                ${open ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'}
                ${active
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
              title={!open ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {open && <span className="text-sm font-medium">{label}</span>}
              {open && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          m-2 flex items-center gap-2 rounded-xl text-slate-400 hover:text-white
          hover:bg-white/5 transition-colors duration-150
          ${open ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'}
        `}
      >
        {open ? (
          <>
            <ChevronLeft size={16} />
            <span className="text-xs">Collapse</span>
          </>
        ) : (
          <ChevronRight size={16} />
        )}
      </button>
    </aside>
  )
}
