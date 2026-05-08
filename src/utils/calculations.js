// ── Mortgage Core ──────────────────────────────────────────────────────────────

export function calcMonthlyPI(loanAmount, annualRate, termYears) {
  if (loanAmount <= 0) return 0
  if (annualRate === 0) return loanAmount / (termYears * 12)
  const r = annualRate / 100 / 12
  const n = termYears * 12
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function calcPropertyTax(price) { return (price * 0.011) / 12 }
export function calcInsurance(price)   { return (price * 0.005) / 12 }
export function calcClosingCosts(price){ return price * 0.03 }

export function calcPMI(loanAmount, downPaymentPct) {
  return downPaymentPct >= 20 ? 0 : (loanAmount * 0.007) / 12
}

// VA Funding Fee rates (first-use)
const VA_FEE_TABLE = { first: [0.0215, 0.015, 0.0125], subsequent: [0.033, 0.015, 0.0125] }
export function calcVAFundingFee(loanAmount, downPct, isFirstUse = true) {
  const table = isFirstUse ? VA_FEE_TABLE.first : VA_FEE_TABLE.subsequent
  const rate = downPct < 5 ? table[0] : downPct < 10 ? table[1] : table[2]
  return loanAmount * rate
}

// Full PITI + HOA breakdown
export function calcPITI({ purchasePrice, downPaymentPct, interestRate, termYears, isVALoan, isFirstVAUse, hoaMonthly = 0 }) {
  const downPayment = purchasePrice * (downPaymentPct / 100)
  let baseLoan = purchasePrice - downPayment
  let fundingFee = 0

  if (isVALoan) {
    fundingFee = calcVAFundingFee(baseLoan, downPaymentPct, isFirstVAUse !== false)
    baseLoan += fundingFee // financed into loan
  }

  const pi        = calcMonthlyPI(baseLoan, interestRate, termYears)
  const tax       = calcPropertyTax(purchasePrice)
  const insurance = calcInsurance(purchasePrice)
  const pmi       = isVALoan ? 0 : calcPMI(baseLoan, downPaymentPct)
  const hoa       = hoaMonthly
  const total     = pi + tax + insurance + pmi + hoa

  return { pi, tax, insurance, pmi, hoa, total, baseLoan, downPayment, fundingFee }
}

// Remaining mortgage balance after `paymentsMade` monthly payments
export function calcRemainingBalance(loanAmount, annualRate, termYears, paymentsMade) {
  if (paymentsMade >= termYears * 12) return 0
  if (annualRate === 0) return loanAmount * (1 - paymentsMade / (termYears * 12))
  const r = annualRate / 100 / 12
  const n = termYears * 12
  const p = paymentsMade
  return loanAmount * (Math.pow(1 + r, n) - Math.pow(1 + r, p)) / (Math.pow(1 + r, n) - 1)
}

// ── Rent vs. Buy Simulator ──────────────────────────────────────────────────────
// Model: renter invests (down payment + closing costs) in stocks at t=0.
// Each month the net contribution to the renter's portfolio is:
//   (total buy cost) − (monthly rent)
// Positive → renter invests the savings; Negative → renter draws portfolio to cover extra rent.
// Buyer's wealth = home equity (appreciated value − remaining mortgage).
export function calcRentVsBuyData(purchase, settings) {
  const { monthlyRent, stockReturn, homeAppreciation, timeHorizon, maintenancePct } = settings

  const piti = calcPITI(purchase)
  const maintenanceMonthly = purchase.purchasePrice * (maintenancePct / 100) / 12
  const closingCosts       = calcClosingCosts(purchase.purchasePrice)
  const initialInvestment  = piti.downPayment + closingCosts

  const r = stockReturn / 100 / 12   // monthly stock rate
  let renterPortfolio = initialInvestment
  const data = []

  for (let month = 1; month <= timeHorizon * 12; month++) {
    renterPortfolio *= (1 + r)

    const isPaidOff = month > purchase.termYears * 12
    // Post-payoff: no more P&I or PMI; tax + insurance + HOA + maintenance remain
    const monthlyBuyCost = isPaidOff
      ? piti.tax + piti.insurance + piti.hoa + maintenanceMonthly
      : piti.total + maintenanceMonthly

    renterPortfolio += monthlyBuyCost - monthlyRent
    renterPortfolio = Math.max(0, renterPortfolio)

    if (month % 12 === 0) {
      const year          = month / 12
      const homeValue     = purchase.purchasePrice * Math.pow(1 + homeAppreciation / 100, year)
      const remainingBal  = calcRemainingBalance(piti.baseLoan, purchase.interestRate, purchase.termYears, month)
      const buyerEquity   = Math.max(0, homeValue - remainingBal)
      data.push({ year, buyerEquity, renterPortfolio, homeValue, remainingBal })
    }
  }

  const breakEvenYear = data.find(d => d.buyerEquity >= d.renterPortfolio)?.year ?? null
  const atHorizon     = data[data.length - 1] ?? { buyerEquity: 0, renterPortfolio: 0 }

  return {
    data,
    breakEvenYear,
    piti,
    maintenanceMonthly,
    closingCosts,
    initialInvestment,
    atHorizon,
    totalBuyCost: piti.total + maintenanceMonthly,
  }
}

// ── Budget & Ratios ─────────────────────────────────────────────────────────────

export function calcBudget(monthlyGross) {
  return {
    needs:   monthlyGross * 0.50,
    wants:   monthlyGross * 0.30,
    savings: monthlyGross * 0.20,
  }
}

// Rough net income (effective ~22% tax rate for mid-income earners)
export function calcNetMonthly(monthlyGross) { return monthlyGross * 0.78 }

// ── VA Residual Income ──────────────────────────────────────────────────────────

// VA Table 41A — South/Midwest (most common): families of 1–5+
export const VA_RESIDUAL_TABLE = { 1: 441, 2: 738, 3: 889, 4: 1025, 5: 1062 }

export function calcVAResidualIncome(monthlyGross, totalPITI, otherDebts) {
  return calcNetMonthly(monthlyGross) - totalPITI - otherDebts
}

// ── Financial Health Score ──────────────────────────────────────────────────────

export function calcHealthScore({ annualIncome, monthlyDebt, liquidSavings, creditScore }) {
  const monthly  = annualIncome / 12
  const dti      = (monthlyDebt / monthly) * 100
  const emgMonths = liquidSavings / (monthly * 0.5)
  let score = 0

  // Credit score → 0–30
  score += creditScore >= 780 ? 30 : creditScore >= 740 ? 25 : creditScore >= 700 ? 20
         : creditScore >= 660 ? 14 : creditScore >= 620 ? 8 : 3

  // DTI → 0–30
  score += dti <= 20 ? 30 : dti <= 28 ? 24 : dti <= 36 ? 17 : dti <= 43 ? 8 : 0

  // Emergency fund → 0–25
  score += emgMonths >= 6 ? 25 : emgMonths >= 3 ? 18 : emgMonths >= 1 ? 9 : 0

  // Savings rate → 0–15
  const savingsRate = (liquidSavings / annualIncome) * 100
  score += savingsRate >= 20 ? 15 : savingsRate >= 10 ? 10 : savingsRate >= 5 ? 5 : 0

  return Math.min(100, score)
}
