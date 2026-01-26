/**
 * Format a bigint value as a fixed-point number with the specified decimals.
 * Truncates to 4 significant digits and drops trailing zeros.
 */
export function formatFixedPoint(value: bigint, decimals = 18n): string {
  if (value === 0n) {
    return "0"
  }

  const divisor = 10n ** decimals
  const integerPart = value / divisor
  const fractionalPart = value % divisor

  if (integerPart >= 1000000n) {
    return Number(integerPart).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })
  }

  if (integerPart >= 1000n) {
    const decimal = Number(fractionalPart) / Number(divisor)
    const total = Number(integerPart) + decimal
    return total.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  if (integerPart >= 1n) {
    const decimal = Number(fractionalPart) / Number(divisor)
    const total = Number(integerPart) + decimal
    return total.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  const decimal = Number(value) / Number(divisor)
  if (decimal >= 0.0001) {
    return decimal.toLocaleString(undefined, { maximumFractionDigits: 6 })
  }
  if (decimal >= 0.00000001) {
    return decimal.toLocaleString(undefined, { maximumFractionDigits: 8 })
  }
  if (decimal > 0) {
    return decimal.toExponential(4)
  }

  return "<0.0001"
}

/**
 * Format a boost multiplier (stored as 18-decimal fixed-point) for display.
 */
export function formatBoostMultiplier(boost: bigint | undefined): string {
  if (boost === undefined) return "1.00x"
  const multiplier = Number(boost) / 1e18
  return `${multiplier.toFixed(2)}x`
}

/**
 * Format a number as a boost multiplier for display.
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}x`
}

/**
 * Format a token amount with appropriate precision based on magnitude.
 * Handles very small values properly without cutting them off.
 */
export function formatTokenAmount(amount: bigint, decimals = 18): string {
  if (amount === 0n) return "0"

  const divisor = BigInt(10 ** decimals)
  const value = Number(amount) / Number(divisor)

  if (value === 0) return "0"
  if (value >= 1000000)
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (value >= 1000)
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (value >= 1)
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  if (value >= 0.0001)
    return value.toLocaleString(undefined, { maximumFractionDigits: 6 })
  if (value >= 0.00000001)
    return value.toLocaleString(undefined, { maximumFractionDigits: 8 })
  // For extremely small values, use scientific notation
  return value.toExponential(4)
}
