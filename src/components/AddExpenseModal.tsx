import React, { useState, useEffect } from 'react';
import type { Group, Expense, Member, ExpenseCategory, Split } from '../types';
import {
  X,
  Utensils,
  Car,
  Home,
  Film,
  Zap,
  ShoppingBag,
  CircleHelp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  group: Group;
  expenseToEdit?: Expense | null;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: any; color: string; bg: string }[] = [
  { value: 'Food', label: 'Food & Drinks', icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { value: 'Transport', label: 'Transport', icon: Car, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { value: 'Lodging', label: 'Lodging', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  { value: 'Entertainment', label: 'Entertainment', icon: Film, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  { value: 'Utilities', label: 'Utilities', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { value: 'Other', label: 'Other', icon: CircleHelp, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  group,
  expenseToEdit
}: AddExpenseModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidById, setPaidById] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [splitType, setSplitType] = useState<'equal' | 'unequal' | 'percentage' | 'shares'>('equal');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  // Equal split: mapping of memberId -> boolean (whether included)
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});

  // Unequal split: mapping of memberId -> manual amount string
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});

  // Percentage split: mapping of memberId -> percentage string
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  // Shares split: mapping of memberId -> shares string
  const [shares, setShares] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);

  // Initialize fields on load or when editing
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmountStr(expenseToEdit.amount.toString());
      setPaidById(expenseToEdit.paidById);
      setCategory(expenseToEdit.categoryId);
      setSplitType(expenseToEdit.splitType);
      setDate(expenseToEdit.date);
      setNotes(expenseToEdit.notes || '');

      // Initialize split states based on expenseToEdit
      const sel: Record<string, boolean> = {};
      const man: Record<string, string> = {};
      const pct: Record<string, string> = {};
      const shr: Record<string, string> = {};

      group.members.forEach((m) => {
        const existingSplit = expenseToEdit.splits.find((s) => s.memberId === m.id);
        
        sel[m.id] = !!existingSplit;
        man[m.id] = existingSplit ? existingSplit.amount.toString() : '0';
        
        if (expenseToEdit.splitType === 'percentage') {
          // Re-calculate percentages
          const percentVal = expenseToEdit.amount > 0 
            ? ((existingSplit?.amount || 0) / expenseToEdit.amount * 100)
            : 0;
          pct[m.id] = percentVal > 0 ? Number(percentVal.toFixed(1)).toString() : '0';
        } else {
          pct[m.id] = '0';
        }

        if (expenseToEdit.splitType === 'shares') {
          // For simplicity, we fallback to 1 share per member or use original split ratio
          shr[m.id] = existingSplit && existingSplit.amount > 0 ? '1' : '0';
        } else {
          shr[m.id] = '1';
        }
      });

      setSelectedMembers(sel);
      setManualAmounts(man);
      setPercentages(pct);
      setShares(shr);
    } else {
      // New expense setup
      setTitle('');
      setAmountStr('');
      setPaidById(group.members[0]?.id || '');
      setCategory('Food');
      setSplitType('equal');
      setDate(today);
      setNotes('');

      const sel: Record<string, boolean> = {};
      const man: Record<string, string> = {};
      const pct: Record<string, string> = {};
      const shr: Record<string, string> = {};

      group.members.forEach((m) => {
        sel[m.id] = true; // Default: include everyone
        man[m.id] = '';
        pct[m.id] = '';
        shr[m.id] = '1'; // Default: 1 share each
      });

      setSelectedMembers(sel);
      setManualAmounts(man);
      setPercentages(pct);
      setShares(shr);
    }
    setError(null);
  }, [expenseToEdit, group, isOpen]);

  const totalAmount = parseFloat(amountStr) || 0;

  // Real-time calculations of current splits
  const calculatedSplits: { memberId: string; name: string; amount: number; pct?: number; share?: number }[] = [];
  let currentSum = 0;

  if (totalAmount > 0) {
    if (splitType === 'equal') {
      const activeIds = Object.keys(selectedMembers).filter((id) => selectedMembers[id]);
      const count = activeIds.length;
      if (count > 0) {
        const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
        let remainder = Number((totalAmount - baseAmount * count).toFixed(2));

        group.members.forEach((m) => {
          if (selectedMembers[m.id]) {
            // Distribute the remainder cent by cent to members to make the total match exactly
            let amt = baseAmount;
            if (remainder > 0) {
              amt = Number((amt + 0.01).toFixed(2));
              remainder = Number((remainder - 0.01).toFixed(2));
            }
            calculatedSplits.push({ memberId: m.id, name: m.name, amount: amt });
            currentSum += amt;
          } else {
            calculatedSplits.push({ memberId: m.id, name: m.name, amount: 0 });
          }
        });
      }
    } else if (splitType === 'unequal') {
      group.members.forEach((m) => {
        const amt = parseFloat(manualAmounts[m.id]) || 0;
        calculatedSplits.push({ memberId: m.id, name: m.name, amount: Number(amt.toFixed(2)) });
        currentSum += amt;
      });
    } else if (splitType === 'percentage') {
      let totalPctInput = 0;
      group.members.forEach((m) => {
        const pctVal = parseFloat(percentages[m.id]) || 0;
        totalPctInput += pctVal;
      });

      group.members.forEach((m) => {
        const pctVal = parseFloat(percentages[m.id]) || 0;
        const calculatedAmt = Number(((totalAmount * pctVal) / 100).toFixed(2));
        calculatedSplits.push({
          memberId: m.id,
          name: m.name,
          amount: calculatedAmt,
          pct: pctVal
        });
        currentSum += calculatedAmt;
      });
    } else if (splitType === 'shares') {
      let totalSharesVal = 0;
      group.members.forEach((m) => {
        totalSharesVal += parseFloat(shares[m.id]) || 0;
      });

      if (totalSharesVal > 0) {
        const baseShareVal = totalAmount / totalSharesVal;
        let runningSum = 0;

        group.members.forEach((m, idx) => {
          const sh = parseFloat(shares[m.id]) || 0;
          let calculatedAmt = Number((baseShareVal * sh).toFixed(2));
          
          // Handle rounding adjustment on last member with shares
          if (idx === group.members.length - 1) {
            calculatedAmt = Number((totalAmount - runningSum).toFixed(2));
          } else {
            runningSum += calculatedAmt;
          }

          calculatedSplits.push({
            memberId: m.id,
            name: m.name,
            amount: calculatedAmt,
            share: sh
          });
          currentSum += calculatedAmt;
        });
      }
    }
  }

  // Calculate discrepancies
  const discrepancy = Number((totalAmount - currentSum).toFixed(2));
  const isValid = totalAmount > 0 && Math.abs(discrepancy) < 0.02;

  // Auto-distribute remaining amount helper for custom splits
  const handleAutoDistribute = () => {
    if (totalAmount <= 0) return;
    const count = group.members.length;
    const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
    let remainder = Number((totalAmount - baseAmount * count).toFixed(2));

    const newManuals: Record<string, string> = {};
    group.members.forEach((m) => {
      let amt = baseAmount;
      if (remainder > 0) {
        amt = Number((amt + 0.01).toFixed(2));
        remainder = Number((remainder - 0.01).toFixed(2));
      }
      newManuals[m.id] = amt.toString();
    });
    setManualAmounts(newManuals);
  };

  // Auto-distribute percentage evenly
  const handleEvenPercentages = () => {
    const count = group.members.length;
    const basePct = Math.floor((100 / count) * 10) / 10;
    let remainder = Number((100 - basePct * count).toFixed(1));

    const newPcts: Record<string, string> = {};
    group.members.forEach((m) => {
      let pct = basePct;
      if (remainder > 0) {
        pct = Number((pct + 0.1).toFixed(1));
        remainder = Number((remainder - 0.1).toFixed(1));
      }
      newPcts[m.id] = pct.toString();
    });
    setPercentages(newPcts);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a description or title for the expense.');
      return;
    }

    if (totalAmount <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }

    if (!paidById) {
      setError('Please specify who paid for this expense.');
      return;
    }

    if (splitType === 'equal') {
      const activeCount = Object.keys(selectedMembers).filter((id) => selectedMembers[id]).length;
      if (activeCount === 0) {
        setError('Please select at least one person to split the expense.');
        return;
      }
    }

    if (splitType === 'percentage') {
      let sumPct = 0;
      group.members.forEach((m) => {
        sumPct += parseFloat(percentages[m.id]) || 0;
      });
      if (Math.abs(sumPct - 100) > 0.1) {
        setError(`Percentages must add up to exactly 100%. Current total: ${sumPct}%`);
        return;
      }
    }

    if (splitType === 'unequal') {
      if (!isValid) {
        setError(`Individual shares do not add up to the total amount. Discrepancy: ${group.currency}${Math.abs(discrepancy).toFixed(2)}`);
        return;
      }
    }

    // Prepare final splits list
    const finalSplits: Split[] = calculatedSplits
      .filter((s) => s.amount > 0)
      .map((s) => ({
        memberId: s.memberId,
        amount: s.amount,
      }));

    const expenseData: Expense = {
      id: expenseToEdit?.id || 'exp-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      amount: totalAmount,
      date: date || new Date().toISOString().split('T')[0],
      paidById,
      categoryId: category,
      splitType,
      splits: finalSplits,
      notes: notes.trim() || undefined,
    };

    onSave(expenseData);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center p-0 bg-slate-950/40 backdrop-blur-xs animate-fade-in text-left">
      <div className="w-full bg-white rounded-t-[36px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border-t-2 border-slate-100 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-white">
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
            </h3>
            <p className="text-[10px] font-extrabold text-[#6366f1] uppercase tracking-wider mt-0.5">
              {group.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X size={18} className="stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-left">
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-bold animate-scale-in text-left">
              <AlertCircle size={15} className="shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount and Title Row */}
          <div className="grid grid-cols-1 gap-4.5 text-left">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Expense Description
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner, AirBnB, Gas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all text-xs font-bold shadow-xs text-left"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-left">
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Amount ({group.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    {group.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-8 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all text-xs font-bold text-left"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all text-xs font-bold text-left"
                />
              </div>
            </div>
          </div>

          {/* Paid By and Category */}
          <div className="grid grid-cols-2 gap-3.5 text-left">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Paid By
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all text-xs font-bold appearance-none text-left"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
              >
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all text-xs font-bold appearance-none text-left"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Category Pill Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-2 px-2 scrollbar-none text-left">
            {CATEGORIES.map((catItem) => {
              const Icon = catItem.icon;
              const isSelected = category === catItem.value;
              return (
                <button
                  type="button"
                  key={catItem.value}
                  onClick={() => setCategory(catItem.value)}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? `${catItem.bg} ${catItem.color} ring-2 ring-indigo-500/10`
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={12} className="stroke-[2.5]" />
                  <span>{catItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Split Method Tabs */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Split Option
            </label>
            <div className="grid grid-cols-4 p-1.5 bg-slate-100 rounded-2xl">
              {[
                { type: 'equal', label: 'Equally' },
                { type: 'unequal', label: 'Custom' },
                { type: 'percentage', label: '%' },
                { type: 'shares', label: 'Shares' },
              ].map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setSplitType(tab.type as any)}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    splitType === tab.type
                      ? 'bg-white text-[#6366f1] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Split Config Lists */}
          <div className="bg-slate-50 border-2 border-slate-100 rounded-[28px] p-4.5 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {splitType === 'equal' && 'Who is included?'}
                {splitType === 'unequal' && 'Specify exact amounts'}
                {splitType === 'percentage' && 'Assign percentages'}
                {splitType === 'shares' && 'Assign share units'}
              </span>
              
              {/* Quick Actions */}
              {splitType === 'equal' && (
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => {
                      const updated: Record<string, boolean> = {};
                      group.members.forEach((m) => { updated[m.id] = true; });
                      setSelectedMembers(updated);
                    }}
                    className="text-[#6366f1] hover:underline cursor-pointer"
                  >
                    All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMembers({});
                    }}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {splitType === 'unequal' && (
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className="text-[10px] font-black uppercase tracking-wider text-[#6366f1] hover:underline cursor-pointer"
                >
                  Split Evenly
                </button>
              )}

              {splitType === 'percentage' && (
                <button
                  type="button"
                  onClick={handleEvenPercentages}
                  className="text-[10px] font-black uppercase tracking-wider text-[#6366f1] hover:underline cursor-pointer"
                >
                  Split Evenly
                </button>
              )}
            </div>

            {/* Split Members Row */}
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {group.members.map((member) => {
                const currentCalc = calculatedSplits.find((s) => s.memberId === member.id);
                const calculatedAmt = currentCalc ? currentCalc.amount : 0;

                return (
                  <div key={member.id} className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-slate-100 text-left">
                    <div className="flex items-center gap-2.5">
                      {splitType === 'equal' ? (
                        <input
                          type="checkbox"
                          id={`chk-${member.id}`}
                          checked={!!selectedMembers[member.id]}
                          onChange={(e) => {
                            setSelectedMembers((prev) => ({
                              ...prev,
                              [member.id]: e.target.checked
                            }));
                          }}
                          className="w-5 h-5 text-[#6366f1] border-slate-300 rounded focus:ring-[#6366f1]"
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      )}
                      <label htmlFor={`chk-${member.id}`} className="text-xs font-black text-slate-800 cursor-pointer flex items-center gap-1.5">
                        {member.name}
                        {paidById === member.id && (
                          <span className="text-[9px] bg-indigo-50 text-[#6366f1] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border border-indigo-100/55">
                            Payer
                          </span>
                        )}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Inputs depending on split method */}
                      {splitType === 'unequal' && (
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            {group.currency}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={manualAmounts[member.id] || ''}
                            onChange={(e) => {
                              setManualAmounts((prev) => ({
                                ...prev,
                                [member.id]: e.target.value
                              }));
                            }}
                            className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-right text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {splitType === 'percentage' && (
                        <div className="relative w-20 flex items-center gap-1.5">
                          <input
                            type="number"
                            placeholder="0"
                            value={percentages[member.id] || ''}
                            onChange={(e) => {
                              setPercentages((prev) => ({
                                ...prev,
                                [member.id]: e.target.value
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-right text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-black text-slate-400">%</span>
                        </div>
                      )}

                      {splitType === 'shares' && (
                        <div className="relative w-20 flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="1"
                            value={shares[member.id] || ''}
                            onChange={(e) => {
                              setShares((prev) => ({
                                ...prev,
                                [member.id]: e.target.value
                              }));
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-400">sh</span>
                        </div>
                      )}

                      {/* Output Preview */}
                      {splitType !== 'unequal' && totalAmount > 0 && (
                        <span className="text-xs font-black text-slate-600 min-w-[50px] text-right">
                          {group.currency}{calculatedAmt.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split validation footer */}
            {totalAmount > 0 && (
              <div className="mt-3.5 pt-3.5 border-t-2 border-slate-100/80 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-left">
                <span className="text-slate-400">
                  {splitType === 'unequal' && 'Sum of Shares:'}
                  {splitType === 'percentage' && 'Sum of Percent:'}
                  {splitType === 'shares' && 'Total Shares:'}
                  {splitType === 'equal' && 'Split Sum:'}
                </span>

                <div className="flex items-center gap-2 text-left">
                  {splitType === 'percentage' && (
                    <span className={`px-2 py-0.5 rounded-lg ${
                      Math.abs(calculatedSplits.reduce((acc, curr) => acc + (curr.pct || 0), 0) - 100) < 0.1
                        ? 'bg-emerald-50 text-[#22c55e]'
                        : 'bg-amber-50 text-amber-500'
                    }`}>
                      {calculatedSplits.reduce((acc, curr) => acc + (curr.pct || 0), 0).toFixed(1)}%
                    </span>
                  )}

                  <span className={`flex items-center gap-1 ${
                    isValid ? 'text-[#22c55e]' : 'text-[#fb7185]'
                  }`}>
                    {isValid ? (
                      <>
                        <CheckCircle size={14} className="stroke-[2.5]" />
                        <span>Split balanced</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="stroke-[2.5]" />
                        <span>
                          {discrepancy > 0 ? 'Under' : 'Over'} {group.currency}{Math.abs(discrepancy).toFixed(2)}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Notes / Memo (Optional)
            </label>
            <textarea
              placeholder="e.g. Flight ticket reference, booking link"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-xs font-bold resize-none text-left"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t-2 border-slate-100 flex gap-3 z-30">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={totalAmount <= 0 || !title.trim()}
            className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
              totalAmount > 0 && title.trim()
                ? 'bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#4ade80] hover:brightness-105 text-white shadow-indigo-500/10'
                : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
            }`}
          >
            {expenseToEdit ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
