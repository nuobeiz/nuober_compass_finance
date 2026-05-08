# Compass Finance — Strategic Purchase & Decision Engine

A high-performance financial decision tool that stress-tests major purchases against your personal financial profile in real time. Built with a configuration-driven rubric architecture so every rule is data — not hard-coded logic.

## Live Demo

> Deployed on Vercel — link here once live

---

## Features

### Financial Health Dashboard
- **Financial Scorecard** (0–100) — composite score across DTI, credit, savings rate, and emergency fund
- **DTI RadialBar Gauges** — front-end (28%) and back-end (36%) debt-to-income in real time
- **Savings vs. Target** — bar chart comparing liquid savings against 3-month and 6-month emergency fund targets
- **50/30/20 Budget Breakdown** — donut chart showing needs, wants, and savings allocation from gross income

### Real Estate Analyzer
- Live sliders for **purchase price**, **down payment**, **interest rate** (0.125% steps), and **loan term** (15/20/30 yr)
- **VA Loan toggle** — waives down payment requirement, removes PMI, activates funding fee (2.15% first use / 3.3% subsequent) and residual income rubric
- **Rubric Grid** with color-coded pass/stretch/fail cards:
  - 28% Front-End DTI
  - 36% Back-End DTI
  - Price-to-Income Ratio (≤ 4×)
  - Post-Closing Liquidity (3–6 months of expenses)
  - Down Payment Adequacy
  - VA Funding Fee Assessment *(VA only)*
  - VA Residual Income Requirements *(VA only, by family size)*
- **Pro-Forma Summary** — full PITI breakdown, monthly cash-flow waterfall, and a `Safe / Stretch / High Risk` verdict

### Sinking Fund Calculator
- Pulls the **30% discretionary budget** automatically from your financial profile
- Per-goal sliders for target amount and wants-budget allocation percentage
- **Timeline chart** showing months-to-goal with projected completion date
- 6 one-click presets: Vacation, New Car, Home Reno, Wedding, Emergency Top-up, Tech

### Financial Profile Setup
- Global sliders for Annual Income, Monthly Debt, Liquid Savings, and FICO score (300–850)
- Changes propagate instantly to every module and rubric across the app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| State | Custom `useLocalStorage` hook |

---

## Architecture

### JSON-Driven Rubric Engine

All financial rules live in `src/config/rubrics.js` as plain config objects — no hard-coded if/else chains in the UI. Each rule follows this contract:

```js
{
  id:          'front_end_dti',
  label:       '28% Front-End DTI',
  category:    'Income Ratio',
  description: 'Monthly housing payment must be ≤ 28% of gross monthly income.',
  icon:        'Home',

  compute(profile, purchase) {
    // returns { value, display, benchmark, ...extras }
  },

  evaluate(result, profile, purchase) {
    // returns 'pass' | 'stretch' | 'fail' | 'info'
  },

  advice: {
    pass:    '...',
    stretch: '...',
    fail:    '...',
  },
}
```

Adding a new purchase category (auto, luxury goods, etc.) means adding a new array of rule objects and a module component — the rubric card UI is fully generic.

### Global Financial Profile

A single `FinancialProfile` object is stored via `useLocalStorage` and passed as a prop into every module. No context provider, no prop drilling through layers — every rubric's `compute()` receives the live profile directly.

### Persistent State

Three localStorage keys:
- `financial-profile` — global income, debt, savings, credit score
- `re-purchase` — real estate sandbox values
- `sinking-goals` — array of sinking fund goals

---

## Getting Started

```bash
# Clone
git clone https://github.com/nuobeiz/Compass_Finance.git
cd Compass_Finance

# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

Requires Node 18+.

---

## Project Structure

```
src/
├── App.jsx                        # Root layout, global state, view routing
├── index.css                      # Tailwind directives + range input styles
│
├── hooks/
│   └── useLocalStorage.js         # Generic persistent state hook
│
├── utils/
│   ├── calculations.js            # Pure financial math (PITI, VA fee, health score)
│   └── formatters.js              # Currency, percent, month display helpers
│
├── config/
│   └── rubrics.js                 # All rule definitions — the decision engine core
│
└── components/
    ├── Sidebar.jsx                # Collapsible dark nav
    ├── Dashboard.jsx              # Financial Health Command Center
    ├── RealEstateModule.jsx       # RE sandbox + rubric grid + verdict
    ├── FinancialProfile.jsx       # Global profile sliders
    ├── SinkingFundCalculator.jsx  # Goal-based saving planner
    ├── RubricCard.jsx             # Generic pass/stretch/fail card
    ├── ProFormaSummary.jsx        # PITI breakdown + cash-flow + verdict
    └── charts/
        ├── DTIGauge.jsx           # RadialBar semicircle gauges
        ├── SavingsChart.jsx       # Emergency fund bar chart
        └── BudgetChart.jsx        # 50/30/20 donut chart
```

---

## Roadmap

- [ ] Auto / Vehicle purchase rubric (20% rule, total transport ≤ 15% income)
- [ ] Rent vs. Buy analyzer with opportunity cost modeling
- [ ] Amortization schedule with equity curve
- [ ] Credit score optimizer (shows which thresholds unlock better rates)
- [ ] PDF export of Pro-Forma Summary

---

## License

MIT
