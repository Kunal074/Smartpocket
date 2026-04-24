/**
 * Calculates how an expense should be split among members.
 * 
 * @param {Object} expense 
 * @param {number} expense.amount - Total amount of the expense
 * @param {string} expense.split_type - 'equal', 'percentage', or 'custom'
 * @param {Array} expense.members - Array of members involved in the split
 *   - For 'equal': [{ user_id: 'uuid' }, ...]
 *   - For 'percentage': [{ user_id: 'uuid', percentage: 30 }, ...]
 *   - For 'custom': [{ user_id: 'uuid', amount: 50 }, ...]
 * 
 * @returns {Array} Array of calculated splits: [{ user_id, amount, percentage? }]
 */
export function calculateSplits({ amount, split_type, members }) {
  if (!members || members.length === 0) {
    throw new Error('Expense must have at least one member');
  }

  const splits = [];

  switch (split_type) {
    case 'equal': {
      // Split equally and handle rounding remainder
      const each = parseFloat((amount / members.length).toFixed(2));
      const totalAllocated = each * members.length;
      const remainder = parseFloat((amount - totalAllocated).toFixed(2));

      members.forEach((m, i) => {
        // Add the remainder (if any, like 0.01) to the first person's split
        const finalAmount = i === 0 ? each + remainder : each;
        splits.push({ 
          user_id: m.user_id, 
          amount: parseFloat(finalAmount.toFixed(2)) 
        });
      });
      break;
    }

    case 'percentage': {
      // Validate percentages sum to exactly 100
      const totalPercentage = members.reduce((sum, m) => sum + (m.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Percentages must sum to exactly 100');
      }

      let allocatedAmount = 0;
      members.forEach((m, i) => {
        if (i === members.length - 1) {
          // Last person gets the exact remainder to avoid 0.01 rounding loss
          const finalAmount = amount - allocatedAmount;
          splits.push({
            user_id: m.user_id,
            amount: parseFloat(finalAmount.toFixed(2)),
            percentage: m.percentage
          });
        } else {
          const splitAmount = parseFloat(((amount * m.percentage) / 100).toFixed(2));
          allocatedAmount += splitAmount;
          splits.push({
            user_id: m.user_id,
            amount: splitAmount,
            percentage: m.percentage
          });
        }
      });
      break;
    }

    case 'custom': {
      // Validate custom amounts sum exactly to the total amount
      const totalCustomAmount = members.reduce((sum, m) => sum + (m.amount || 0), 0);
      if (Math.abs(totalCustomAmount - amount) > 0.01) {
        throw new Error('Custom amounts must sum to the total expense amount');
      }

      members.forEach(m => {
        splits.push({
          user_id: m.user_id,
          amount: parseFloat((m.amount).toFixed(2))
        });
      });
      break;
    }

    default:
      throw new Error(`Unknown split type: ${split_type}`);
  }

  return splits;
}
