/**
 * Centralized Currency Formatting Utility for OrderlyQR
 * Formats all numeric monetary amounts into Pakistani Rupees (PKR).
 * 
 * Example usage:
 * formatCurrency(2700) => "PKR 2,700"
 * formatCurrency(4650.5) => "PKR 4,651"
 */

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'PKR 0'
  }

  const numericValue = Math.round(Number(amount))

  // Format using Pakistani / English locale with comma separators
  const formattedNumber = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numericValue)

  return `PKR ${formattedNumber}`
}

/**
 * Helper to format raw price change or modifier deltas
 * Example: formatCurrencyDelta(400) => "+PKR 400"
 */
export function formatCurrencyDelta(amount: number | string): string {
  const numericValue = Number(amount)
  if (numericValue > 0) {
    return `+${formatCurrency(numericValue)}`
  }
  return formatCurrency(numericValue)
}
