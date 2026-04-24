'use client';

import { useEffect } from 'react';
import { ArrowRight, User, Wallet, CheckCircle2 } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';

export default function BalanceSheet({ groupId }) {
  const { user } = useAuth();
  const { groupBalances, fetchGroupBalances, isLoading } = useGroups();
  const { addSettlement } = useGroupExpenses();

  useEffect(() => {
    fetchGroupBalances(groupId);
  }, [groupId, fetchGroupBalances]);

  const handleSettleUp = async (debt) => {
    const isPaying = debt.from.id === user?.id;
    if (!isPaying) {
      toast.error('Only the person who owes money can record a settlement');
      return;
    }

    if (debt.to.upi_id) {
      // Generate UPI Intent Link
      // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
      const upiUrl = `upi://pay?pa=${debt.to.upi_id}&pn=${encodeURIComponent(debt.to.name)}&am=${debt.amount}&cu=INR`;
      
      // Try to open UPI app
      window.location.href = upiUrl;
      
      // Then ask for confirmation
      setTimeout(() => {
        if (confirm(`Did you successfully pay ₹${debt.amount} to ${debt.to.name}?`)) {
          recordSettlement(debt.to.id, debt.amount);
        }
      }, 2000);
    } else {
      // No UPI ID, just record manual settlement
      if (confirm(`Record a cash settlement of ₹${debt.amount} to ${debt.to.name}?`)) {
        recordSettlement(debt.to.id, debt.amount);
      }
    }
  };

  const recordSettlement = async (paidTo, amount) => {
    try {
      await addSettlement({
        group_id: groupId,
        paid_to: paidTo,
        amount: amount,
        payment_method: 'upi'
      });
      // Refresh balances
      fetchGroupBalances(groupId);
    } catch (e) {
      // hook handles error
    }
  };

  if (isLoading && !groupBalances) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Calculating balances...</div>;
  }

  if (!groupBalances) return null;

  const { netBalances, simplifiedDebts } = groupBalances;

  return (
    <div className="space-y-8">
      {/* Individual Net Balances */}
      <div>
        <h3 className="font-display text-lg font-bold">Net Balances</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {netBalances.map((item) => (
            <div key={item.user.id} className="glass flex items-center justify-between rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {item.user.id === user?.id ? 'You' : item.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.balance === 0 ? 'Settled up' : item.balance > 0 ? 'Gets back' : 'Owes'}
                  </p>
                </div>
              </div>
              <div className={`font-bold ${item.balance > 0 ? 'text-emerald-500' : item.balance < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                {item.balance > 0 ? '+' : item.balance < 0 ? '-' : ''}₹{Math.abs(item.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Debts to Settle */}
      <div className="pt-4 border-t border-border/50">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <Wallet className="h-5 w-5 text-primary" /> Suggested Settlements
        </h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          The minimum number of transactions needed to settle all debts.
        </p>

        {simplifiedDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-medium">You are all settled up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {simplifiedDebts.map((debt, index) => {
              const isPayer = debt.from.id === user?.id;
              
              return (
                <div key={index} className="glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">{isPayer ? 'You' : debt.from.name}</span>
                    </div>
                    <div className="flex flex-col items-center text-muted-foreground">
                      <span className="text-[10px] font-medium uppercase tracking-wider">₹{debt.amount}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">{debt.to.id === user?.id ? 'You' : debt.to.name}</span>
                    </div>
                  </div>

                  {isPayer && (
                    <button
                      onClick={() => handleSettleUp(debt)}
                      className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {debt.to.upi_id ? 'Pay via UPI' : 'Record Payment'}
                    </button>
                  )}
                  
                  {!isPayer && debt.to.id === user?.id && (
                    <div className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                      Awaiting payment
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
