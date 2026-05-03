import {
  calcPITI,
  calcClosingCosts,
  calcVAResidualIncome,
  calcVAFundingFee,
  VA_RESIDUAL_TABLE,
} from '../utils/calculations'

// ── Status helpers ──────────────────────────────────────────────────────────────
export const STATUS = { PASS: 'pass', STRETCH: 'stretch', FAIL: 'fail', INFO: 'info' }

export const STATUS_STYLES = {
  pass: {
    border:  'border-emerald-200',
    bg:      'bg-emerald-50',
    text:    'text-emerald-700',
    icon:    'text-emerald-600',
    badge:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    ring:    'ring-emerald-200',
    dot:     'bg-emerald-500',
    label:   'Pass',
  },
  stretch: {
    border:  'border-amber-200',
    bg:      'bg-amber-50',
    text:    'text-amber-700',
    icon:    'text-amber-600',
    badge:   'bg-amber-50 text-amber-700 border border-amber-200',
    ring:    'ring-amber-200',
    dot:     'bg-amber-500',
    label:   'Stretch',
  },
  fail: {
    border:  'border-red-200',
    bg:      'bg-red-50',
    text:    'text-red-700',
    icon:    'text-red-600',
    badge:   'bg-red-50 text-red-700 border border-red-200',
    ring:    'ring-red-200',
    dot:     'bg-red-500',
    label:   'High Risk',
  },
  info: {
    border:  'border-blue-200',
    bg:      'bg-blue-50',
    text:    'text-blue-700',
    icon:    'text-blue-600',
    badge:   'bg-blue-50 text-blue-700 border border-blue-200',
    ring:    'ring-blue-200',
    dot:     'bg-blue-500',
    label:   'Info',
  },
}

// ── Rubric: Front-End DTI ────────────────────────────────────────────────────────
const frontEndDTI = {
  id: 'front_end_dti',
  label: '28% Front-End DTI',
  category: 'Income Ratio',
  description: 'Monthly housing payment must be ≤ 28% of gross monthly income.',
  icon: 'Home',

  compute(profile, purchase) {
    const monthlyIncome = profile.annualIncome / 12
    const piti = calcPITI(purchase)
    const ratio = monthlyIncome > 0 ? (piti.total / monthlyIncome) * 100 : 0
    return { value: ratio, display: ratio.toFixed(1) + '%', benchmark: '≤ 28%', piti }
  },

  evaluate(result) {
    const v = result.value
    if (v <= 28) return STATUS.PASS
    if (v <= 32) return STATUS.STRETCH
    return STATUS.FAIL
  },

  advice: {
    pass:    'Housing payment is well within the 28% guideline. Strong position.',
    stretch: 'Slightly above guidelines. Acceptable with stable employment — avoid other new debts.',
    fail:    'Housing cost exceeds safe limits. Lower the price, raise the down payment, or boost income.',
  },
}

// ── Rubric: Back-End DTI ─────────────────────────────────────────────────────────
const backEndDTI = {
  id: 'back_end_dti',
  label: '36% Back-End DTI',
  category: 'Income Ratio',
  description: 'All debt obligations (housing + existing debts) must be ≤ 36% of gross income.',
  icon: 'CreditCard',

  compute(profile, purchase) {
    const monthlyIncome = profile.annualIncome / 12
    const piti = calcPITI(purchase)
    const totalDebt = piti.total + profile.monthlyDebt
    const ratio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0
    return { value: ratio, display: ratio.toFixed(1) + '%', benchmark: '≤ 36%' }
  },

  evaluate(result) {
    const v = result.value
    if (v <= 36) return STATUS.PASS
    if (v <= 43) return STATUS.STRETCH
    return STATUS.FAIL
  },

  advice: {
    pass:    'Total debt load is healthy and within conventional underwriting guidelines.',
    stretch: 'Total debt is elevated (36–43%). FHA may still approve, but prioritize paying down existing debts.',
    fail:    'Total debt burden exceeds safe thresholds. Eliminate existing debts before purchasing.',
  },
}

// ── Rubric: Price-to-Income ──────────────────────────────────────────────────────
const priceToIncome = {
  id: 'price_to_income',
  label: 'Price-to-Income Ratio',
  category: 'Affordability',
  description: 'Purchase price should be ≤ 4× your annual gross income.',
  icon: 'TrendingUp',

  compute(profile, purchase) {
    const ratio = profile.annualIncome > 0 ? purchase.purchasePrice / profile.annualIncome : 0
    return { value: ratio, display: ratio.toFixed(2) + '×', benchmark: '≤ 4.0×' }
  },

  evaluate(result) {
    const v = result.value
    if (v <= 3.5) return STATUS.PASS
    if (v <= 4.5) return STATUS.STRETCH
    return STATUS.FAIL
  },

  advice: {
    pass:    'Purchase price is within the safe 3.5× income ratio. Leaves room for financial flexibility.',
    stretch: 'Above the ideal range. Ensure income growth trajectory is strong and job security is high.',
    fail:    'Purchase price is excessive relative to income. This compresses all discretionary spending.',
  },
}

// ── Rubric: Post-Closing Liquidity ───────────────────────────────────────────────
const postClosingLiquidity = {
  id: 'post_closing_liquidity',
  label: 'Post-Closing Liquidity',
  category: 'Reserves',
  description: 'You should retain 3–6 months of living expenses in liquid reserves after closing.',
  icon: 'Shield',

  compute(profile, purchase) {
    const closingCosts = calcClosingCosts(purchase.purchasePrice)
    const downPayment  = purchase.purchasePrice * (purchase.downPaymentPct / 100)
    const cashOut      = downPayment + closingCosts
    const remaining    = profile.liquidSavings - cashOut
    const monthlyExp   = (profile.annualIncome / 12) * 0.50 + profile.monthlyDebt
    const months       = monthlyExp > 0 ? remaining / monthlyExp : 0
    return { value: months, display: Math.max(0, months).toFixed(1) + ' mo', benchmark: '≥ 3 months', remaining, cashOut }
  },

  evaluate(result) {
    const v = result.value
    if (v >= 6) return STATUS.PASS
    if (v >= 3) return STATUS.STRETCH
    return STATUS.FAIL
  },

  advice: {
    pass:    '6+ months of reserves post-close. Excellent protection against job loss or emergency repairs.',
    stretch: '3–6 months of reserves. Meets minimum guidelines — avoid major discretionary spending at close.',
    fail:    'Insufficient reserves after closing. Delay purchase and build savings, or reduce the down payment.',
  },
}

// ── Rubric: Down Payment ─────────────────────────────────────────────────────────
const downPayment = {
  id: 'down_payment',
  label: 'Down Payment Adequacy',
  category: 'Equity',
  description: 'A 20% down payment eliminates PMI and accelerates equity accumulation.',
  icon: 'PiggyBank',
  vaAdjustment: { optional: true, label: 'Waived — VA Benefit Active' },

  compute(_profile, purchase) {
    return {
      value: purchase.downPaymentPct,
      display: purchase.downPaymentPct.toFixed(1) + '%',
      benchmark: purchase.isVALoan ? '0% (VA)' : '≥ 20%',
    }
  },

  evaluate(result, _profile, purchase) {
    if (purchase.isVALoan) return STATUS.PASS
    const v = result.value
    if (v >= 20) return STATUS.PASS
    if (v >= 10) return STATUS.STRETCH
    return STATUS.FAIL
  },

  advice: {
    pass:    '20%+ down eliminates PMI and enters the property with meaningful equity.',
    stretch: 'PMI will apply until you reach 20% LTV, adding ~$100–$200/mo to your payment.',
    fail:    'Low down payment increases monthly costs and long-term interest paid.',
    va_pass: 'VA benefit waives the down payment requirement. No PMI required by lenders on VA loans.',
  },
}

// ── VA-Only Rubric: Funding Fee ──────────────────────────────────────────────────
const vaFundingFee = {
  id: 'va_funding_fee',
  label: 'VA Funding Fee',
  category: 'VA Specific',
  description: 'One-time fee (2.15% first use / 3.3% subsequent) — can be financed into the loan.',
  icon: 'Star',
  vaOnly: true,

  compute(_profile, purchase) {
    const baseLoan = purchase.purchasePrice * (1 - purchase.downPaymentPct / 100)
    const fee = calcVAFundingFee(baseLoan, purchase.downPaymentPct, purchase.isFirstVAUse !== false)
    const rate = purchase.isFirstVAUse !== false
      ? (purchase.downPaymentPct < 5 ? 2.15 : purchase.downPaymentPct < 10 ? 1.50 : 1.25)
      : (purchase.downPaymentPct < 5 ? 3.30 : purchase.downPaymentPct < 10 ? 1.50 : 1.25)
    return { value: fee, display: '$' + fee.toLocaleString('en-US', { maximumFractionDigits: 0 }), benchmark: 'Informational', rate: rate + '%' }
  },

  evaluate: () => STATUS.INFO,

  advice: {
    info: 'VA Funding Fee can be rolled into the loan or paid at closing. Veterans with service-connected disabilities rated ≥ 10% are exempt. Surviving spouses are also exempt.',
  },
}

// ── VA-Only Rubric: Residual Income ─────────────────────────────────────────────
const vaResidualIncome = {
  id: 'va_residual_income',
  label: 'VA Residual Income',
  category: 'VA Specific',
  description: "Net income after all obligations — VA's primary affordability metric.",
  icon: 'CheckCircle',
  vaOnly: true,

  compute(profile, purchase) {
    const monthlyGross = profile.annualIncome / 12
    const piti = calcPITI({ ...purchase, isVALoan: true })
    const residual  = calcVAResidualIncome(monthlyGross, piti.total, profile.monthlyDebt)
    const familySize = Math.min(5, Math.max(1, purchase.familySize || 4))
    const required   = VA_RESIDUAL_TABLE[familySize]
    return { value: residual, display: '$' + Math.round(residual).toLocaleString('en-US'), benchmark: `≥ $${required}/mo`, required, surplus: residual - required }
  },

  evaluate(result) {
    if (result.value >= result.required * 1.2) return STATUS.PASS
    if (result.value >= result.required) return STATUS.STRETCH
    return STATUS.FAIL
  },

  advice: {
    pass:    'Residual income exceeds VA thresholds by 20%+ — strong approval signal.',
    stretch: 'Meets minimum VA residual income requirements. Avoid adding new debts.',
    fail:    'Residual income falls below VA requirements. This will likely prevent VA loan approval.',
  },
}

// ── Exported rubric collections ──────────────────────────────────────────────────
export const REAL_ESTATE_RUBRICS   = [frontEndDTI, backEndDTI, priceToIncome, postClosingLiquidity, downPayment]
export const VA_RUBRICS            = [vaFundingFee, vaResidualIncome]
export const ALL_REAL_ESTATE_RUBRICS = [...REAL_ESTATE_RUBRICS, ...VA_RUBRICS]
