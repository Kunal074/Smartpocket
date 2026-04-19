/**
 * Format a number as Indian Rupees (₹).
 * @param {number} amount
 * @param {{ compact?: boolean }} options
 * @returns {string}
 */
export function formatINR(amount, options = {}) {
  if (options.compact) {
    if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
    if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000)       return `₹${(amount / 1_000).toFixed(1)}k`;
  }
  return (
    '₹' +
    amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

/**
 * Returns "YYYY-MM" string for a given date (defaults to today).
 * @param {Date | string} [date]
 * @returns {string}
 */
export function monthKey(date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Returns the current month key e.g. "2025-04" */
export function currentMonthKey() {
  return monthKey(new Date());
}
