/**
 * Uses a Minimum Cash Flow algorithm to simplify debts in a group.
 * Instead of showing every individual expense split, it computes the 
 * minimum number of transactions needed to settle all balances.
 * 
 * @param {Object} balances 
 * A dictionary of net balances where key = user_id and value = net amount.
 * Positive amount = user is owed money
 * Negative amount = user owes money
 * Example: { 'alice_id': 900, 'bob_id': -300, 'charlie_id': -600 }
 * 
 * @returns {Array} 
 * Array of transactions to settle debts: 
 * [{ from: 'bob_id', to: 'alice_id', amount: 300 }, ...]
 */
export function simplifyDebts(balances) {
  const creditors = []; // People who are owed money
  const debtors = [];   // People who owe money

  // Separate into creditors and debtors
  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = parseFloat(Number(balance).toFixed(2));
    if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    }
  }

  // Sort descending by amount for efficiency (greedy approach)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  // Match largest debtor with largest creditor
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    
    // The amount to settle is the minimum of what debtor owes and creditor is owed
    const amountToSettle = Math.min(creditor.amount, debtor.amount);
    const roundedAmount = parseFloat(amountToSettle.toFixed(2));

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: roundedAmount,
    });

    // Update remaining balances
    creditor.amount = parseFloat((creditor.amount - roundedAmount).toFixed(2));
    debtor.amount = parseFloat((debtor.amount - roundedAmount).toFixed(2));

    // Remove from array if fully settled (less than 1 cent remaining)
    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }

  return transactions;
}
