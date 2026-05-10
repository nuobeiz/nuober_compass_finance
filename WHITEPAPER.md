# Compass Finance — Strategic Purchase & Decision Engine
## Technical Whitepaper

**Version:** 1.0  
**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · Recharts 2 · Lucide React  
**Author:** Nuobei Zhang  
**AI Collaborator:** Claude Sonnet 4.6 (Anthropic)

---

## Abstract

Compass Finance is a browser-based financial decision engine that stress-tests major purchases — primarily real estate — against a user's live financial profile. The system is built around a **JSON-driven rubric architecture**: all financial rules are defined as configuration objects rather than hard-coded conditional logic, making the engine extensible to any purchase category. All state persists in `localStorage` so no data is lost between sessions. This paper documents the mathematical models, market assumptions, regulatory standards, and historical data underlying each module.

---

## 1. System Architecture

### 1.1 JSON-Driven Rubric Engine

Every financial rule is a plain JavaScript object conforming to this contract:

```ts
interface Rubric {
  id:          string
  label:       string
  category:    string
  description: string
  icon:        string

  // Computes the raw metric from live profile + purchase inputs
  compute(profile: FinancialProfile, purchase: PurchaseState): RubricResult

  // Classifies the result as pass | stretch | fail | info
  evaluate(result: RubricResult, profile: FinancialProfile, purchase: PurchaseState): Status

  // Contextual guidance per outcome
  advice: Record<Status, string>
}
```

Adding a new purchase category (auto, education, luxury goods) requires only a new array of rubric objects — zero UI changes.

### 1.2 Global Financial Profile

A single `FinancialProfile` object is the source of truth for all modules:

| Field | Type | Description |
|---|---|---|
| `annualIncome` | number | Gross annual income (pre-tax) |
| `monthlyDebt` | number | Existing monthly debt service obligations |
| `liquidSavings` | number | Checking + high-yield savings (liquid only) |
| `creditScore` | number | FICO score (300–850) |

This object is stored under `localStorage` key `financial-profile` and passed as a prop to every module. A change in the profile panel propagates to every rubric across all views instantly.

### 1.3 Persistent State Keys

| Key | Module | Contents |
|---|---|---|
| `financial-profile` | Global | Income, debt, savings, credit score |
| `re-purchase` | Real Estate | Price, rate, down payment, HOA, VA settings |
| `rvb-settings` | Rent vs. Buy | Rent, stock return, appreciation, horizon |
| `sinking-goals` | Sinking Fund | Array of goal objects |
| `proforma-living-expenses` | Pro-Forma | User-overridden living expense figure |

### 1.4 Post-Tax Income Approximation

The app uses a simplified effective tax rate of **22%** to approximate take-home pay, consistent with the IRS Statistics of Income data for median filers in the $50,000–$150,000 gross income range:

```
Net Monthly Income = (Annual Income / 12) × 0.78
```

This is used in the Pro-Forma cash-flow waterfall and VA Residual Income calculations. It is a national approximation; state income taxes vary significantly.

---

## 2. Financial Health Dashboard

### 2.1 Financial Health Score (0–100)

A composite score across four dimensions, scored independently then summed:

#### Credit Score Component (max 30 pts)

| FICO Range | Points |
|---|---|
| ≥ 780 (Exceptional) | 30 |
| ≥ 740 (Very Good) | 25 |
| ≥ 700 (Good) | 20 |
| ≥ 660 (Fair+) | 14 |
| ≥ 620 (Fair) | 8 |
| < 620 (Poor) | 3 |

*Source: FICO score tier classifications used by Fannie Mae, Freddie Mac, and major retail lenders.*

#### Debt-to-Income Component (max 30 pts)

| Current DTI | Points |
|---|---|
| ≤ 20% | 30 |
| ≤ 28% | 24 |
| ≤ 36% | 17 |
| ≤ 43% | 8 |
| > 43% | 0 |

#### Emergency Fund Component (max 25 pts)

```
Emergency Coverage = Liquid Savings / (Monthly Gross Income × 0.50)
```

| Coverage | Points |
|---|---|
| ≥ 6 months | 25 |
| ≥ 3 months | 18 |
| ≥ 1 month | 9 |
| < 1 month | 0 |

*The 3–6 month emergency fund target is the standard recommendation from the Consumer Financial Protection Bureau (CFPB) and certified financial planners.*

#### Savings Rate Component (max 15 pts)

```
Savings Rate = (Liquid Savings / Annual Income) × 100
```

| Rate | Points |
|---|---|
| ≥ 20% | 15 |
| ≥ 10% | 10 |
| ≥ 5% | 5 |
| < 5% | 0 |

### 2.2 50/30/20 Budget Rule

```
Needs   = Monthly Gross Income × 0.50
Wants   = Monthly Gross Income × 0.30
Savings = Monthly Gross Income × 0.20
```

*Origin: Popularized by Senator Elizabeth Warren in "All Your Worth" (2005). Widely adopted as a baseline framework by the CFPB, NerdWallet, and major financial institutions. The 30% "Wants" bucket serves as the fuel for the Sinking Fund Calculator.*

---

## 3. Real Estate Analyzer

### 3.1 Monthly Mortgage Payment (Principal & Interest)

Standard amortization formula:

```
M = P × [r(1 + r)^n] / [(1 + r)^n − 1]
```

| Variable | Definition |
|---|---|
| `M` | Monthly P&I payment |
| `P` | Loan amount (purchase price − down payment, ± VA funding fee) |
| `r` | Monthly interest rate = Annual Rate / 12 |
| `n` | Total payments = Term (years) × 12 |

*Edge case: when `r = 0`, the formula reduces to `M = P / n`.*

### 3.2 Remaining Mortgage Balance

Used by the Rent vs. Buy simulator to track equity accumulation:

```
B(p) = P × [(1 + r)^n − (1 + r)^p] / [(1 + r)^n − 1]
```

| Variable | Definition |
|---|---|
| `B(p)` | Remaining balance after `p` payments |
| `p` | Number of payments already made |
| `n` | Total payments (term × 12) |

Verification: at `p = 0`, `B(0) = P` (full original balance). At `p = n`, `B(n) = 0` (fully paid off).

### 3.3 PITIA Monthly Breakdown

**PITIA = Principal + Interest + Taxes + Insurance + (HOA)**

```
P&I      = calcMonthlyPI(loanAmount, rate, term)
Tax      = Purchase Price × 0.011 / 12     [national avg ~1.1% annually]
Insurance= Purchase Price × 0.005 / 12     [national avg ~0.5% annually]
PMI      = Loan Amount   × 0.007 / 12      [if LTV > 80%; avg ~0.7% annually]
HOA      = user-supplied monthly figure
────────────────────────────────────────
Total    = sum of applicable components
```

**Property Tax Rate (1.1%):** National average per ATTOM Data Solutions (2023). Ranges from ~0.3% (Hawaii) to ~2.5% (New Jersey). Users in high-tax states should override via the profile.

**Homeowner's Insurance (0.5%):** National average per NAIC (2022 data). Equivalent to roughly $200–$250/mo on a $400k–$500k home in most markets.

**PMI Rate (0.7%):** Midpoint of the typical 0.5%–1.5% range per Urban Institute and Freddie Mac guidelines. Exact rate depends on LTV ratio and credit score tier. PMI is automatically removed when the down payment equals or exceeds 20% (LTV ≤ 80%).

**Closing Costs (3%):** Applied in the Post-Closing Liquidity and Rent vs. Buy calculations as a fixed 3% estimate of purchase price. CFPB guidelines state typical range is 2%–5%.

### 3.4 Affordability Rubrics

#### Rule 1 — 28% Front-End DTI

```
Front-End DTI = (PITIA / Gross Monthly Income) × 100

Thresholds:
  ≤ 28%  → Pass
  28–32% → Stretch
  > 32%  → Fail
```

*Source: Fannie Mae/Freddie Mac Selling Guide. The 28% front-end limit has been the standard conventional underwriting guideline since the 1970s. FHA permits up to 31% with compensating factors.*

#### Rule 2 — 36% Back-End DTI

```
Back-End DTI = ((PITIA + All Other Monthly Debts) / Gross Monthly Income) × 100

Thresholds:
  ≤ 36%  → Pass
  36–43% → Stretch (FHA territory)
  > 43%  → Fail
```

*Source: Fannie Mae conventional limit is 36% (45% with compensating factors). FHA allows up to 43%. The CFPB "Qualified Mortgage" rule historically used 43% as the hard ceiling.*

#### Rule 3 — Price-to-Income Ratio

```
Price-to-Income = Purchase Price / Annual Gross Income

Thresholds:
  ≤ 3.5× → Pass
  ≤ 4.5× → Stretch
  > 4.5× → Fail
```

*Source: Rule of thumb widely cited by financial planners and economists (Harvard Joint Center for Housing Studies). The 3×–4× range reflects historical affordability norms; the ratio has climbed above 5× in major metros following post-2020 appreciation.*

#### Rule 4 — Post-Closing Liquidity

```
Cash Required at Close = Down Payment + (Purchase Price × 0.03)
Remaining Liquid Cash  = Liquid Savings − Cash Required at Close
Monthly Expenses       = PITIA + Existing Monthly Debts
Emergency Coverage     = Remaining Liquid Cash / Monthly Expenses

Thresholds:
  ≥ 6 months → Pass
  ≥ 3 months → Stretch
  < 3 months → Fail
```

*Source: CFPB and HUD guidance. Maintaining 3–6 months of reserves post-close protects against job loss, major repairs, and market disruptions — particularly critical in the first 12 months of homeownership.*

#### Rule 5 — Down Payment Adequacy

```
Threshold: ≥ 20% of purchase price

  ≥ 20%  → Pass (no PMI)
  10–20% → Stretch (PMI applies)
  < 10%  → Fail (high PMI + low equity cushion)
```

*When VA Loan is active, this rule is reclassified as "Pass" with the label "Waived — VA Benefit Active." No down payment is legally required for a VA-backed loan.*

### 3.5 VA Loan Specialization

#### VA Funding Fee

A one-time fee charged by the Department of Veterans Affairs, typically financed into the loan:

| Use | Down Payment | Fee Rate |
|---|---|---|
| First use | < 5% | **2.15%** of loan |
| First use | 5–10% | **1.50%** of loan |
| First use | ≥ 10% | **1.25%** of loan |
| Subsequent | < 5% | **3.30%** of loan |
| Subsequent | 5–10% | **1.50%** of loan |
| Subsequent | ≥ 10% | **1.25%** of loan |

*Exemptions: Veterans with service-connected disability ratings ≥ 10%, surviving spouses of veterans who died in service.*

*Source: 38 CFR § 36.4312; VA Lenders Handbook Chapter 8.*

#### VA Residual Income Requirement

The VA's primary affordability metric — income remaining after all obligations:

```
Residual Income = Net Monthly Income − PITIA − All Other Monthly Debts

Net Monthly Income = Gross Monthly Income × 0.78  [22% effective tax estimate]
```

Required minimums per VA Table 41A (South/Midwest region, used as app default):

| Family Size | Required Residual/mo |
|---|---|
| 1 | $441 |
| 2 | $738 |
| 3 | $889 |
| 4 | **$1,025** |
| 5+ | $1,062 |

Regional adjustments: Northeast +$9–$22/mo; West +$50–$96/mo.

*Source: 38 CFR § 36.4340; VA Lenders Handbook Chapter 4, Table 41A.*

```
Status thresholds:
  Residual ≥ Required × 1.20 → Pass    (20% buffer above minimum)
  Residual ≥ Required         → Stretch
  Residual < Required         → Fail
```

### 3.6 Pro-Forma Cash Flow

```
Post-Tax Monthly Income  = Gross Monthly Income × 0.78
− Housing (PITIA)
− Existing Debt Payments
− Living Expenses         [user-editable; default = Net Income × 0.35]
─────────────────────────────────────────────────────
= Discretionary Remaining
```

Color coding: ≥ $500 → Emerald · ≥ $0 → Amber · < $0 → Red.

---

## 4. Rent vs. Buy Analyzer

### 4.1 Conceptual Framework

The analyzer models the **opportunity cost of the down payment**: instead of locking capital in a down payment, could the renter invest those funds in the stock market and accumulate more wealth over the same period?

**Two parallel wealth paths are simulated:**

**Buyer's net worth** = Home equity (appreciated home value minus remaining mortgage)

**Renter's net worth** = Stock portfolio (down payment + closing costs invested, plus/minus monthly savings differential)

### 4.2 Month-by-Month Simulation

The simulation computes month by month for accuracy (especially important when the mortgage term is shorter than the time horizon):

```
For each month m from 1 to (timeHorizon × 12):

  1. Grow renter portfolio by stock return:
     portfolio(m) = portfolio(m−1) × (1 + r_monthly)

  2. Calculate buyer's total monthly housing cost:
     If m ≤ termYears × 12:
       buyCost(m) = PITIA + maintenance
     Else (mortgage paid off):
       buyCost(m) = Tax + Insurance + HOA + maintenance

  3. Net monthly contribution to renter's portfolio:
     netContribution = buyCost(m) − monthlyRent
       + if positive: buying costs more → renter invests the saving
       − if negative: renting costs more → portfolio is depleted by the difference

  4. Apply contribution:
     portfolio(m) = portfolio(m) + netContribution
     portfolio(m) = max(0, portfolio(m))    [floor at zero]

  5. Record at each year-end:
     homeValue(y)  = purchasePrice × (1 + homeAppRate)^y
     remaining(m)  = B(m) [remaining balance formula]
     buyerEquity   = max(0, homeValue − remaining)
```

**Initial portfolio seed:**
```
initialInvestment = Down Payment + Closing Costs (3%)
```

### 4.3 Break-Even Year

```
breakEvenYear = first year y where buyerEquity(y) ≥ renterPortfolio(y)
```

If no break-even occurs within the time horizon, the result is displayed as "Beyond N years."

### 4.4 Default Market Assumptions

| Parameter | Default | Basis |
|---|---|---|
| Stock market return | **10.0% / yr** | S&P 500 nominal avg since 1928 |
| Home appreciation | **4.0% / yr** | US Case-Shiller national avg (nominal) |
| Annual maintenance | **1.0% of price** | "1% Rule" standard in personal finance |
| Closing costs | **3.0% of price** | CFPB midpoint estimate |

---

## 5. Sinking Fund Calculator

### 5.1 Discretionary Budget

```
Monthly Wants Budget = (Annual Income / 12) × 0.30
```

Drawn directly from the "Wants" bucket of the 50/30/20 rule, giving the module a live connection to the financial profile.

### 5.2 Time-to-Goal

```
Monthly Contribution = Monthly Wants Budget × (Allocation % / 100)
Months to Goal       = Target Amount / Monthly Contribution
Target Date          = Today + Months to Goal
```

Multiple goals compete for the same wants budget. The total allocation percentage is tracked and flagged when it exceeds 100%.

---

## 6. Historical Data & Market Assumptions

### 6.1 S&P 500 Equity Returns

| Period | Nominal Annual Return | Real (Inflation-Adjusted) |
|---|---|---|
| 1928–2023 (full period) | ~10.0% | ~6.8% |
| 1973–2023 (50-year) | ~10.7% | ~6.4% |
| 2000–2023 (including two crashes) | ~7.6% | ~5.1% |

*Sources: Robert Shiller's Irrational Exuberance dataset (Yale); JP Morgan Asset Management Guide to the Markets; Vanguard research.*

The app defaults to **10%** (long-run nominal). For conservative planning, users should input 7% (long-run real) or 6–7% (blended for a diversified 60/40 portfolio).

> **Disclaimer:** Past returns do not guarantee future performance. The 10% figure represents a long historical average that includes multiple severe drawdowns (1929, 1973, 2000, 2008, 2020). Sequence-of-returns risk is not modeled.

### 6.2 US Home Price Appreciation

| Index | Nominal Avg (Annual) | Real Avg (Annual) |
|---|---|---|
| Case-Shiller National HPI (1987–2023) | ~4.3% | ~1.5% |
| Case-Shiller 10-City (1987–2023) | ~4.8% | ~2.0% |
| FHFA HPI (1991–2023) | ~4.2% | ~1.4% |

*Sources: S&P CoreLogic Case-Shiller Index; Federal Housing Finance Agency (FHFA) House Price Index; Federal Reserve Economic Data (FRED).*

The app defaults to **4%** (nominal). This represents the national average — coastal metros (San Francisco, New York, Miami) have historically appreciated at 5–7% nominally; Midwest markets often track 2–3%.

> **Disclaimer:** Home appreciation is highly localized and cyclical. The 2020–2022 period saw abnormal appreciation of 15–40% in many markets, followed by correction. The 4% default should be viewed as a long-run mean-reversion assumption.

### 6.3 Property Carrying Cost Rates

| Cost Item | Rate Used | Source | Typical Range |
|---|---|---|---|
| Property Tax | 1.1% of value/yr | ATTOM Data Solutions (2023 national avg) | 0.3%–2.5% |
| Homeowner's Insurance | 0.5% of value/yr | NAIC (2022) | 0.25%–1.5% |
| PMI | 0.7% of loan/yr | Urban Institute; Freddie Mac | 0.5%–1.5% |
| Closing Costs | 3% of purchase price | CFPB | 2%–5% |
| Annual Maintenance | 1% of value/yr | "1% Rule" (Bankrate, NerdWallet) | 0.5%–3% |

### 6.4 Mortgage Underwriting Standards

| Guideline | Standard | Source |
|---|---|---|
| Front-End DTI limit | 28% | Fannie Mae / Freddie Mac Selling Guide |
| Back-End DTI limit | 36% (conv.) / 43% (FHA) | Fannie Mae; FHA Handbook 4000.1 |
| Qualified Mortgage DTI cap | 43% | CFPB 12 CFR Part 1026 |
| Conventional down payment | ≥ 20% (no PMI) | Fannie Mae standard |
| FHA down payment | 3.5% (≥ 580 FICO) | HUD Mortgagee Letter |
| VA down payment | 0% | 38 CFR § 36.4306 |
| Price-to-Income guidance | ≤ 3–4× | Harvard JCHS; CFP Board |
| Emergency reserves (post-close) | 2–6 months | Fannie Mae B3-4.3-04; CFPB |
| VA Residual Income | See Table 41A | 38 CFR § 36.4340 |
| VA Funding Fee (first use, 0% down) | 2.15% | 38 CFR § 36.4312 |

---

## 7. Limitations & Disclosures

1. **Tax simplification.** The 22% effective rate is a national approximation. State income taxes, SALT deductions, and marginal-rate effects are not modeled.

2. **PMI duration.** PMI is modeled as present until loan payoff (conservative). In practice, borrowers can request PMI removal once equity reaches 20% (HPA 1998 Act).

3. **Inflation not modeled.** All figures are nominal. Real purchasing power of future values will be lower.

4. **Rent not inflation-adjusted.** Monthly rent is held constant over the time horizon, understating the long-run cost of renting in inflationary environments.

5. **Tax deductibility not modeled.** Mortgage interest deduction and property tax deductibility (SALT-capped at $10k) are omitted. These benefit buyers and would pull the break-even year earlier.

6. **Maintenance not inflation-adjusted.** Held at a fixed percentage of the original purchase price.

7. **HOA special assessments.** HOA is modeled as a constant monthly fee. One-time special assessments are not included.

8. **VA regional tables.** The South/Midwest table values are used as defaults (most common region). Northeast and West Coast borrowers will have slightly higher VA residual income requirements.

9. **Educational purpose only.** This tool is not a substitute for advice from a licensed financial advisor, mortgage broker, or CFP.

---

## 8. References

- **Fannie Mae Selling Guide** — B3-6-02 (DTI Ratios), B3-4.3-04 (Asset Requirements)
- **FHA Single Family Housing Policy Handbook 4000.1** — Section II.A.4 (DTI)
- **VA Lenders Handbook** — Chapter 4 (Residual Income), Chapter 8 (Funding Fee), 38 CFR §§ 36.4306–36.4340
- **CFPB Ability-to-Repay / Qualified Mortgage Rule** — 12 CFR Part 1026
- **S&P CoreLogic Case-Shiller Home Price Index** — spglobal.com
- **FHFA House Price Index** — fhfa.gov
- **Robert Shiller Data** — Irrational Exuberance, 3rd Ed.; shillerdata.com
- **JP Morgan Asset Management** — Guide to the Markets, Q1 2024
- **ATTOM Data Solutions** — 2023 Property Tax Analysis
- **NAIC** — 2022 Homeowners Insurance Report
- **Tax Foundation / IRS Statistics of Income** — Effective tax rate data
- **Harvard Joint Center for Housing Studies** — The State of the Nation's Housing (annual)
- **Warren & Tyagi** — *All Your Worth: The Ultimate Lifetime Money Plan* (2005)
- **HPA 1998** — Homeowners Protection Act (PMI cancellation rights)
