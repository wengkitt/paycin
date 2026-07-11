import type { Group, Expense, Debt, MemberBalance } from '../types';

/**
 * Calculates how much each member paid, how much they owe, and their net balance.
 */
export function calculateMemberBalances(group: Group): MemberBalance[] {
  const { members, expenses } = group;
  
  // Initialize balances for each member
  const balancesMap: Record<string, { paid: number; owed: number }> = {};
  members.forEach((m) => {
    balancesMap[m.id] = { paid: 0, owed: 0 };
  });

  // Accumulate from expenses
  expenses.forEach((expense) => {
    const { paidById, amount, splits } = expense;

    // Accumulate amount paid
    if (balancesMap[paidById]) {
      balancesMap[paidById].paid += amount;
    }

    // Accumulate amount owed from splits
    splits.forEach((split) => {
      if (balancesMap[split.memberId]) {
        balancesMap[split.memberId].owed += split.amount;
      }
    });
  });

  // Convert to MemberBalance array
  return members.map((member) => {
    const bal = balancesMap[member.id] || { paid: 0, owed: 0 };
    return {
      memberId: member.id,
      paid: Number(bal.paid.toFixed(2)),
      owed: Number(bal.owed.toFixed(2)),
      net: Number((bal.paid - bal.owed).toFixed(2)),
    };
  });
}

/**
 * Simplifies debts between members to minimize the number of transactions.
 * Returns a list of debts (who pays whom how much).
 */
export function calculateSimplifiedDebts(group: Group): Debt[] {
  const balances = calculateMemberBalances(group);
  
  // Create mutable copies of net balances
  const nets = balances.map((b) => ({
    memberId: b.memberId,
    net: b.net,
  }));

  const debts: Debt[] = [];
  const epsilon = 0.01; // Avoid floating point inaccuracies

  while (true) {
    // Find biggest debtor (most negative net) and biggest creditor (most positive net)
    let maxDebtorIdx = -1;
    let maxCreditorIdx = -1;
    let minNet = epsilon;
    let maxNet = -epsilon;

    for (let i = 0; i < nets.length; i++) {
      if (nets[i].net < minNet) {
        minNet = nets[i].net;
        maxDebtorIdx = i;
      }
      if (nets[i].net > maxNet) {
        maxNet = nets[i].net;
        maxCreditorIdx = i;
      }
    }

    // If we can't find debtors or creditors with significant balances, we're done
    if (maxDebtorIdx === -1 || maxCreditorIdx === -1) {
      break;
    }

    const debtor = nets[maxDebtorIdx];
    const creditor = nets[maxCreditorIdx];

    // The transaction amount is the minimum of what debtor owes and what creditor is owed
    const debitAmount = Math.abs(debtor.net);
    const creditAmount = creditor.net;
    const amountToSettle = Number(Math.min(debitAmount, creditAmount).toFixed(2));

    if (amountToSettle > 0) {
      debts.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: amountToSettle,
      });

      // Update their balances
      nets[maxDebtorIdx].net = Number((debtor.net + amountToSettle).toFixed(2));
      nets[maxCreditorIdx].net = Number((creditor.net - amountToSettle).toFixed(2));
    } else {
      break;
    }
  }

  return debts;
}

/**
 * Computes category-wise totals for visual spend charts.
 */
export function calculateCategoryTotals(expenses: Expense[]): { category: string; amount: number; percentage: number }[] {
  const totals: Record<string, number> = {};
  let overallTotal = 0;

  expenses.forEach((expense) => {
    // Exclude settlements from category spending totals
    if (expense.isSettlement) return;
    
    const cat = expense.categoryId;
    totals[cat] = (totals[cat] || 0) + expense.amount;
    overallTotal += expense.amount;
  });

  if (overallTotal === 0) return [];

  return Object.entries(totals).map(([category, amount]) => ({
    category,
    amount: Number(amount.toFixed(2)),
    percentage: Number(((amount / overallTotal) * 100).toFixed(1)),
  })).sort((a, b) => b.amount - a.amount);
}
