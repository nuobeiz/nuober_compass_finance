export const fmt = {
  currency: (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n ?? 0),

  currencyShort: (n) => {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return fmt.currency(n)
  },

  percent: (n, decimals = 1) => `${(n ?? 0).toFixed(decimals)}%`,

  multiple: (n, decimals = 2) => `${(n ?? 0).toFixed(decimals)}×`,

  months: (n) => {
    const m = Math.max(0, n ?? 0)
    if (m === 0) return '< 1 mo'
    if (m >= 12) return `${(m / 12).toFixed(1)} yrs`
    return `${m.toFixed(1)} mo`
  },

  number: (n) => new Intl.NumberFormat('en-US').format(Math.round(n ?? 0)),
}
