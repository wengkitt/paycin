import React, { useState, useMemo } from 'react';
import type { Group, Expense, Debt, ExpenseCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  TrendingUp,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
  Share2
} from 'lucide-react';
import {
  calculateMemberBalances,
  calculateSimplifiedDebts,
  calculateCategoryTotals
} from '../utils/splitCalculator';

// Categories config
const CATEGORIES: Record<ExpenseCategory, { label: string; bg: string; color: string; icon: string }> = {
  Food: { label: 'Food & Drinks', bg: 'bg-amber-50 border-amber-100', color: 'text-amber-600', icon: '🍔' },
  Transport: { label: 'Transport', bg: 'bg-blue-50 border-blue-100', color: 'text-blue-600', icon: '🚗' },
  Lodging: { label: 'Lodging', bg: 'bg-indigo-50 border-indigo-100', color: 'text-indigo-600', icon: '🏠' },
  Entertainment: { label: 'Entertainment', bg: 'bg-rose-50 border-rose-100', color: 'text-rose-600', icon: '🎬' },
  Utilities: { label: 'Utilities', bg: 'bg-yellow-50 border-yellow-100', color: 'text-yellow-600', icon: '⚡' },
  Shopping: { label: 'Shopping', bg: 'bg-emerald-50 border-emerald-100', color: 'text-emerald-600', icon: '🛍️' },
  Other: { label: 'Other', bg: 'bg-slate-50 border-slate-100', color: 'text-slate-600', icon: '📦' },
  Settlement: { label: 'Settle Up Payment', bg: 'bg-teal-50 border-teal-100', color: 'text-teal-600', icon: '🤝' },
};

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onRecordSettlement: (debt: Debt) => void;
  onUpdateGroup: (updatedGroup: Group) => void;
}

type TabType = 'overview' | 'expenses' | 'settle' | 'members';

export default function GroupDetail({
  group,
  onBack,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onRecordSettlement,
  onUpdateGroup
}: GroupDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Expenses search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New member inputs
  const [newMemberName, setNewMemberName] = useState('');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Settlement selection for mini modal
  const [settlementConfirm, setSettlementConfirm] = useState<Debt | null>(null);

  // Group stats calculations
  const balances = useMemo(() => calculateMemberBalances(group), [group]);
  const debts = useMemo(() => calculateSimplifiedDebts(group), [group]);
  const categorySpending = useMemo(() => calculateCategoryTotals(group.expenses), [group.expenses]);

  const totalSpend = useMemo(() => {
    return group.expenses
      .filter((e) => !e.isSettlement)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [group.expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return group.expenses
      .filter((e) => {
        const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (group.members.find((m) => m.id === e.paidById)?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || e.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [group.expenses, searchQuery, selectedCategory, group.members]);

  const getMemberName = (id: string) => {
    return group.members.find((m) => m.id === id)?.name || 'Unknown Member';
  };

  const handleAddMemberInline = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError(null);
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    if (group.members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setAddMemberError(`"${trimmed}" is already in this group.`);
      return;
    }

    const newMember = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
    };

    onUpdateGroup({
      ...group,
      members: [...group.members, newMember],
    });
    setNewMemberName('');
  };

  const handleSettleDebtConfirmed = () => {
    if (settlementConfirm) {
      onRecordSettlement(settlementConfirm);
      setSettlementConfirm(null);
    }
  };

  const handleShareDetails = () => {
    const summaryText = `📊 Split Summary for ${group.name}:\n` +
      `Total Spend: ${group.currency}${totalSpend.toFixed(2)}\n\n` +
      `💰 Pending Settlements:\n` +
      (debts.length > 0 
        ? debts.map(d => `- ${getMemberName(d.from)} owes ${getMemberName(d.to)} ${group.currency}${d.amount.toFixed(2)}`).join('\n')
        : '- All settled! 🎉');
    
    if (navigator.share) {
      navigator.share({
        title: group.name,
        text: summaryText,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(summaryText);
      alert('Split summary copied to clipboard! 📋');
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col justify-between font-sans relative">
      {/* Group Detail Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100/85 shadow-xs">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-all active:scale-90"
            >
              <ArrowLeft size={20} className="stroke-[2.5]" />
            </button>
            <div className="text-left">
              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-[10px] text-slate-400 font-bold line-clamp-1 max-w-[180px]">
                  {group.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareDetails}
              className="p-2.5 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-all active:scale-90"
              title="Share Split Summary"
            >
              <Share2 size={16} className="stroke-[2.5]" />
            </button>
            <button
              onClick={onAddExpense}
              className="bg-gradient-to-r from-[#6366f1] to-[#fb7185] hover:scale-105 active:scale-95 text-white px-3.5 py-2 rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-500/15 flex items-center gap-1 cursor-pointer border border-white/10"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Expense</span>
            </button>
          </div>
        </div>

        {/* Sliding Tab Menu with Vibrant Border */}
        <div className="flex px-4 border-t border-slate-100/80">
          {[
            { id: 'overview', label: 'Dashboard' },
            { id: 'expenses', label: 'Ledger' },
            { id: 'settle', label: 'Settle Up' },
            { id: 'members', label: 'Friends' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="flex-1 py-3 text-center text-xs font-black relative transition-colors cursor-pointer"
              style={{
                color: activeTab === tab.id ? '#6366f1' : '#64748b'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#6366f1] to-[#fb7185] rounded-full"
                />
              )}
              {tab.id === 'settle' && debts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#fb7185] text-white">
                  {debts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab View Box */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-gradient-to-tr from-[#6366f1] to-[#818cf8] text-white p-4.5 rounded-[24px] shadow-md border border-indigo-400/20 text-left">
                <span className="text-[9px] font-black text-indigo-100 uppercase tracking-widest block mb-1">
                  Total Spend
                </span>
                <span className="text-xl font-black tracking-tight leading-none">
                  {group.currency}{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-indigo-200/95 block mt-2 font-bold uppercase tracking-wider">
                  {group.expenses.filter(e => !e.isSettlement).length} Expenses
                </span>
              </div>

              <div className="bg-white border-2 border-slate-100 p-4.5 rounded-[24px] shadow-sm text-left flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Settlements Status
                </span>
                <span className={`text-xs font-black flex items-center gap-1.5 mt-0.5 ${
                  debts.length === 0 ? 'text-[#22c55e]' : 'text-amber-500'
                }`}>
                  {debts.length === 0 ? (
                    <>
                      <CheckCircle2 size={15} className="text-[#22c55e] stroke-[2.5]" />
                      <span>All Clear</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} className="animate-spin-slow text-amber-500 stroke-[2.5]" />
                      <span>{debts.length} Pending</span>
                    </>
                  )}
                </span>
                <span className="text-[9px] text-slate-400 block mt-2 font-black uppercase tracking-wider">
                  {group.members.length} Friends
                </span>
              </div>
            </div>

            {/* Individual Balances Box */}
            <div className="bg-white border-2 border-slate-100 rounded-[28px] p-5 shadow-xs space-y-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#fb7185] animate-pulse" />
                Member Balances
              </h2>

              <div className="divide-y divide-slate-100/70">
                {balances.map((bal) => {
                  const mName = getMemberName(bal.memberId);
                  const isPositive = bal.net > 0;
                  const isZero = Math.abs(bal.net) < 0.02;

                  return (
                    <div key={bal.memberId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs border-2 ${
                          isZero 
                            ? 'bg-slate-50 text-slate-500 border-slate-100' 
                            : isPositive 
                              ? 'bg-emerald-50 text-[#22c55e] border-emerald-100' 
                              : 'bg-rose-50 text-[#fb7185] border-rose-100'
                        }`}>
                          {mName.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-black text-slate-800 block leading-tight">
                            {mName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                            Paid {group.currency}{bal.paid.toFixed(2)} • Owed {group.currency}{bal.owed.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {isZero ? (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                            Settled
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-black ${
                              isPositive ? 'text-[#22c55e]' : 'text-[#fb7185]'
                            }`}>
                              {isPositive ? '+' : ''}{group.currency}{bal.net.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              {isPositive ? 'Is Owed' : 'Owes'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Category Spending Visual representation */}
            {categorySpending.length > 0 && (
              <div className="bg-white border-2 border-slate-100 rounded-[28px] p-5 shadow-xs space-y-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                  Category Breakdown
                </h2>

                <div className="space-y-4">
                  {categorySpending.map((item) => {
                    const catObj = CATEGORIES[item.category as ExpenseCategory] || CATEGORIES.Other;
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-black">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <span>{catObj.icon}</span>
                            <span>{catObj.label}</span>
                          </div>
                          <div className="text-slate-600 flex items-center gap-1">
                            <span>{group.currency}{item.amount.toFixed(2)}</span>
                            <span className="text-[10px] font-black text-[#6366f1] bg-indigo-50 px-1.5 py-0.5 rounded">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundImage: item.category === 'Food' ? 'linear-gradient(to right, #f59e0b, #fb7185)' :
                                             item.category === 'Transport' ? 'linear-gradient(to right, #3b82f6, #60a5fa)' :
                                             item.category === 'Lodging' ? 'linear-gradient(to right, #6366f1, #818cf8)' :
                                             item.category === 'Entertainment' ? 'linear-gradient(to right, #ec4899, #f472b6)' :
                                             item.category === 'Utilities' ? 'linear-gradient(to right, #eab308, #facc15)' :
                                             item.category === 'Shopping' ? 'linear-gradient(to right, #10b981, #34d399)' : 'linear-gradient(to right, #64748b, #94a3b8)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: EXPENSES (LEDGER) */}
        {activeTab === 'expenses' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.5]" />
                <input
                  type="text"
                  placeholder="Search expense title or payer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] shadow-xs text-left"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-sm'
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  All Expenses
                </button>
                {Object.entries(CATEGORIES).map(([catKey, catVal]) => {
                  // Hide settlement in ledger filter unless there are settlements in group
                  if (catKey === 'Settlement' && !group.expenses.some((e) => e.isSettlement)) return null;

                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-3.5 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === catKey
                          ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-sm'
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span>{catVal.icon}</span> <span className="ml-0.5">{catVal.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expenses List */}
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-2">
                  <Info size={28} className="text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">No expenses found</h3>
                  <p className="text-xs text-slate-400">
                    {searchQuery || selectedCategory !== 'all' 
                      ? "Try adjusting your filters or search term."
                      : "Create your first group expense by tapping the Expense button."}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredExpenses.map((expense) => {
                    const catInfo = CATEGORIES[expense.categoryId] || CATEGORIES.Other;
                    const payerName = getMemberName(expense.paidById);

                    return (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white border-2 border-slate-100 p-4 rounded-[22px] shadow-sm flex flex-col gap-3 group relative overflow-hidden text-left hover:border-indigo-100/80 transition-all"
                      >
                        {/* Upper row: Title, amount */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border-2 shadow-sm shrink-0 ${catInfo.bg}`}>
                              {catInfo.icon}
                            </span>
                            <div className="text-left">
                              <h4 className={`text-xs font-black leading-tight ${
                                expense.isSettlement ? 'text-indigo-950 font-black' : 'text-slate-800'
                              }`}>
                                {expense.title}
                              </h4>
                              
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-extrabold uppercase tracking-wide">
                                <span className="text-slate-600">{payerName}</span>
                                <span>paid</span>
                                <span className="text-slate-600">{group.currency}{expense.amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-sm font-black ${
                              expense.isSettlement ? 'text-[#22c55e]' : 'text-slate-900'
                            }`}>
                              {group.currency}{expense.amount.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-extrabold uppercase tracking-wider flex items-center gap-1 justify-end">
                              <Calendar size={10} className="stroke-[2.5]" />
                              <span>{expense.date}</span>
                            </span>
                          </div>
                        </div>

                        {/* Middle row: Split Info summary */}
                        {!expense.isSettlement && expense.splits.length > 0 && (
                          <div className="bg-slate-50 border border-slate-100/50 p-3 rounded-2xl text-[10px] text-slate-500 font-bold">
                            <span className="font-black text-slate-400 uppercase tracking-widest text-[8px] block mb-1.5">
                              Split breakdown
                            </span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                              {expense.splits.map((sp) => (
                                <div key={sp.memberId} className="flex items-center gap-1">
                                  <span className="text-slate-700 font-black">{getMemberName(sp.memberId)}:</span>
                                  <span className="text-slate-500">{group.currency}{sp.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {expense.notes && (
                          <p className="text-[10px] text-slate-500 italic font-medium bg-indigo-50/30 px-3 py-1.5 rounded-xl border border-indigo-100/10 text-left">
                            📝 {expense.notes}
                          </p>
                        )}

                        {/* Lower row: Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/60 mt-1">
                          <button
                            onClick={() => onEditExpense(expense)}
                            className="p-1.5 text-slate-400 hover:text-[#6366f1] rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            <Edit size={12} className="stroke-[2.5]" />
                            <span>Edit</span>
                          </button>
                          
                          <span className="text-slate-200">|</span>

                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this expense?')) {
                                onDeleteExpense(expense.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            <Trash2 size={12} className="stroke-[2.5]" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: SETTLE UP */}
        {activeTab === 'settle' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header info card */}
            <div className="bg-gradient-to-tr from-amber-50 to-orange-50/70 border-2 border-amber-100/80 p-4.5 rounded-[24px] flex items-start gap-3 shadow-sm text-amber-800 text-xs text-left">
              <TrendingUp size={20} className="shrink-0 text-amber-600 mt-0.5 stroke-[2.5]" />
              <div>
                <h4 className="font-black text-amber-900 mb-0.5 uppercase tracking-wide">Optimal Settlements Active</h4>
                <p className="font-bold text-amber-800/90 leading-normal">
                  Our system computes the absolute minimum number of transactions needed to completely balance all balances to zero. No redundant double transfers!
                </p>
              </div>
            </div>

            {/* Debts List */}
            <div className="space-y-3">
              {debts.length === 0 ? (
                <div className="text-center py-12 bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-6 space-y-3.5">
                  <span className="text-4xl block animate-bounce">🎉</span>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800">Everyone is fully settled!</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      All expenses and splits are perfectly balanced. There are no outstanding debts in this group.
                    </p>
                  </div>
                </div>
              ) : (
                debts.map((debt, index) => {
                  const debtorName = getMemberName(debt.from);
                  const creditorName = getMemberName(debt.to);

                  return (
                    <div
                      key={index}
                      className="bg-white border-2 border-slate-100 p-4 rounded-[22px] shadow-sm flex items-center justify-between gap-3 text-left hover:border-[#4ade80]/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-slate-800 flex items-center gap-1.5 leading-tight">
                            {debtorName}
                            <ArrowRight size={13} className="text-slate-400 stroke-[3]" />
                            {creditorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-extrabold mt-1.5 uppercase tracking-wider">
                            {debtorName} owes <span className="text-slate-700 font-black">{group.currency}{debt.amount.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSettlementConfirm(debt)}
                        className="bg-[#4ade80]/10 border border-[#4ade80]/20 hover:bg-[#4ade80]/25 text-[#1b4332] text-xs font-black px-4 py-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 size={13} className="stroke-[2.5]" />
                        <span>Settle</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: MEMBERS (FRIENDS) */}
        {activeTab === 'members' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Inline member add form */}
            <form onSubmit={handleAddMemberInline} className="bg-white border-2 border-slate-100 p-5 rounded-[28px] shadow-xs space-y-3.5 text-left">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-0.5">Add Friend to Group</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">Instantly include another friend in the splits ledger.</p>
              </div>

              {addMemberError && (
                <p className="text-xs text-rose-600 font-bold">{addMemberError}</p>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Friend's name (e.g. Liam)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1]"
                />
                <button
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className={`px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    newMemberName.trim()
                      ? 'bg-[#6366f1] text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={15} className="stroke-[3]" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Members ledger listing */}
            <div className="bg-white border-2 border-slate-100 rounded-[28px] overflow-hidden shadow-xs divide-y divide-slate-100/80">
              {group.members.map((member) => {
                const bal = balances.find((b) => b.memberId === member.id);
                const hasNegative = bal ? bal.net < 0 : false;
                const hasPositive = bal ? bal.net > 0 : false;

                return (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366f1]/10 to-[#fb7185]/10 text-[#6366f1] border-2 border-[#6366f1]/10 font-black text-sm flex items-center justify-center">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-slate-800 block leading-tight">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          Participated in {group.expenses.filter((e) => e.splits.some((s) => s.memberId === member.id)).length} splits
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {bal && (
                        <>
                          <span className={`text-sm font-black block leading-none ${
                            hasPositive ? 'text-[#22c55e]' : hasNegative ? 'text-[#fb7185]' : 'text-slate-400'
                          }`}>
                            {hasPositive ? '+' : ''}{group.currency}{bal.net.toFixed(2)}
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-1.5">
                            {hasPositive ? 'is owed' : hasNegative ? 'owes' : 'balanced'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Settlement confirmation drawer/modal */}
      <AnimatePresence>
        {settlementConfirm && (
          <div className="absolute inset-0 z-50 flex items-end justify-center p-0 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-white rounded-t-[36px] p-6 shadow-2xl space-y-4.5 text-center border-t-2 border-slate-100"
            >
              <div className="w-14 h-14 rounded-[20px] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto text-[#22c55e] shadow-xs">
                <CheckCircle2 size={28} className="stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-black text-slate-900 uppercase tracking-wide">Record Settlement</h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
                  Confirm a payment of{' '}
                  <span className="font-black text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {group.currency}{settlementConfirm.amount.toFixed(2)}
                  </span>{' '}
                  from <span className="font-black text-slate-800">{getMemberName(settlementConfirm.from)}</span>{' '}
                  to <span className="font-black text-slate-800">{getMemberName(settlementConfirm.to)}</span>.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setSettlementConfirm(null)}
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettleDebtConfirmed}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:brightness-105 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/10 transition-all cursor-pointer active:scale-95"
                >
                  Confirm Settle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
