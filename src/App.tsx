import { useState, useEffect } from 'react';
import type { Group, Expense, Debt } from './types';
import { DEMO_GROUPS } from './utils/demoData';
import GroupList from './components/GroupList';
import GroupDetail from './components/GroupDetail';
import CreateGroup from './components/CreateGroup';
import AddExpenseModal from './components/AddExpenseModal';
import { AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'paycin_groups';
const LEGACY_LOCAL_STORAGE_KEY = 'group_expense_splitter_groups';

export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Modal states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Load initial groups
  useEffect(() => {
    let saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGroups(parsed);
        localStorage.setItem(LOCAL_STORAGE_KEY, saved);
      } catch (e) {
        console.error('Failed to parse saved groups. Falling back to demos.', e);
        setGroups(DEMO_GROUPS);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEMO_GROUPS));
      }
    } else {
      // Default to demo data so the app looks fantastic immediately
      setGroups(DEMO_GROUPS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEMO_GROUPS));
    }
  }, []);

  const saveGroups = (updatedGroups: Group[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedGroups));
  };

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || null;

  const getMemberName = (id: string) => {
    return activeGroup?.members.find((m) => m.id === id)?.name || 'Unknown';
  };

  // Group Management Handlers
  const handleSaveGroup = (groupToSave: Group) => {
    let updated: Group[];
    const exists = groups.some((g) => g.id === groupToSave.id);
    
    if (exists) {
      updated = groups.map((g) => (g.id === groupToSave.id ? groupToSave : g));
    } else {
      updated = [groupToSave, ...groups];
    }
    
    setGroups(updated);
    saveGroups(updated);
    setIsCreateGroupOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updated = groups.filter((g) => g.id !== groupId);
    setGroups(updated);
    saveGroups(updated);
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  };

  const handleResetDemoData = () => {
    if (confirm('This will restore the factory demo data. Any custom groups you added will be preserved alongside them if their names don\'t conflict.')) {
      // Merge: Add demos if they don't already exist, otherwise reset them.
      const demosFiltered = DEMO_GROUPS.filter(demo => !groups.some(g => g.id === demo.id));
      const updated = [...demosFiltered, ...groups];
      setGroups(updated);
      saveGroups(updated);
    }
  };

  const handleImportBackup = (backupJson: string): boolean => {
    try {
      const parsed = JSON.parse(backupJson);
      
      // Simple verification
      if (Array.isArray(parsed) && parsed.every(g => g.id && g.name && Array.isArray(g.members) && Array.isArray(g.expenses))) {
        setGroups(parsed);
        saveGroups(parsed);
        setSelectedGroupId(null);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Expense Management Handlers
  const handleSaveExpense = (savedExpense: Expense) => {
    if (!selectedGroupId) return;

    const updated = groups.map((g) => {
      if (g.id === selectedGroupId) {
        let updatedExpenses: Expense[];
        const expenseExists = g.expenses.some((e) => e.id === savedExpense.id);

        if (expenseExists) {
          updatedExpenses = g.expenses.map((e) => (e.id === savedExpense.id ? savedExpense : e));
        } else {
          updatedExpenses = [savedExpense, ...g.expenses];
        }

        return {
          ...g,
          expenses: updatedExpenses,
        };
      }
      return g;
    });

    setGroups(updated);
    saveGroups(updated);
    setIsAddExpenseOpen(false);
    setExpenseToEdit(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!selectedGroupId) return;

    const updated = groups.map((g) => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          expenses: g.expenses.filter((e) => e.id !== expenseId),
        };
      }
      return g;
    });

    setGroups(updated);
    saveGroups(updated);
  };

  // Quick Settle Handler
  const handleRecordSettlement = (debt: Debt) => {
    if (!selectedGroupId || !activeGroup) return;

    const settlementExpense: Expense = {
      id: 'settle-' + Math.random().toString(36).substring(2, 9),
      title: `Settle: ${getMemberName(debt.from)} → ${getMemberName(debt.to)} 🤝`,
      amount: debt.amount,
      date: new Date().toISOString().split('T')[0],
      paidById: debt.from, // Debtor pays
      categoryId: 'Settlement',
      splitType: 'equal',
      splits: [
        { memberId: debt.to, amount: debt.amount } // Creditor receives payment
      ],
      isSettlement: true,
      notes: `Settled via one-click Settle Up.`
    };

    const updated = groups.map((g) => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          expenses: [settlementExpense, ...g.expenses],
        };
      }
      return g;
    });

    setGroups(updated);
    saveGroups(updated);
  };

  return (
    <div className="w-full min-h-screen bg-[#6366f1] flex items-center justify-center relative overflow-x-hidden font-sans text-slate-900">
      {/* Vibrant Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[55%] bg-[#4ade80] rounded-full blur-[120px] opacity-35 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[55%] bg-[#fb7185] rounded-full blur-[120px] opacity-35 pointer-events-none"></div>

      {/* Hero Left Column (Hidden on Mobile) */}
      <div className="z-10 mr-16 hidden lg:block max-w-xs text-left select-none">
        <span className="text-xs bg-indigo-500/30 text-indigo-100 font-black px-3.5 py-1 rounded-full uppercase tracking-widest block w-fit mb-3 border border-indigo-400/20">
          PayCin • 俾錢 Edition
        </span>
        <h1 className="text-white text-5xl font-black leading-tight mb-4">
          Friends don't let friends stay in debt.
        </h1>
        <p className="text-indigo-100 text-xs font-bold opacity-90 mb-4 leading-relaxed">
          "PayCin" sounds like <strong>俾錢</strong> (béi chín) in Cantonese, which literally means "give money" or "pay money."
        </p>
        <p className="text-indigo-100 text-xs opacity-75 mb-8 leading-relaxed">
          The easiest way to track cabin trips, dinners, and group expenses with friends without the awkward money talks.
        </p>
        <div className="flex gap-3">
          <div className="h-11 px-4 bg-white/10 rounded-xl border border-white/15 flex items-center justify-center text-white text-xs font-black">
            Optimal Splits
          </div>
          <div className="h-11 px-4 bg-white/20 rounded-xl flex items-center justify-center text-white text-xs font-black">
            Instant Settle
          </div>
        </div>
      </div>

      {/* Main Responsive Phone Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 md:w-[390px] md:h-[820px] bg-white md:rounded-[48px] md:shadow-2xl relative flex flex-col overflow-hidden md:border-[10px] md:border-slate-900 shrink-0 z-10">
        <div className="flex-1 overflow-y-auto flex flex-col">
          <AnimatePresence mode="wait">
            {isCreateGroupOpen ? (
              <CreateGroup
                onSave={handleSaveGroup}
                onCancel={() => setIsCreateGroupOpen(false)}
              />
            ) : activeGroup ? (
              <GroupDetail
                group={activeGroup}
                onBack={() => setSelectedGroupId(null)}
                onAddExpense={() => {
                  setExpenseToEdit(null);
                  setIsAddExpenseOpen(true);
                }}
                onEditExpense={(expense) => {
                  setExpenseToEdit(expense);
                  setIsAddExpenseOpen(true);
                }}
                onDeleteExpense={handleDeleteExpense}
                onRecordSettlement={handleRecordSettlement}
                onUpdateGroup={handleSaveGroup}
              />
            ) : (
              <GroupList
                groups={groups}
                onCreateGroup={() => setIsCreateGroupOpen(true)}
                onSelectGroup={setSelectedGroupId}
                onDeleteGroup={handleDeleteGroup}
                onResetDemoData={handleResetDemoData}
                onImportBackup={handleImportBackup}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isAddExpenseOpen && activeGroup && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setExpenseToEdit(null);
          }}
          onSave={handleSaveExpense}
          group={activeGroup}
          expenseToEdit={expenseToEdit}
        />
      )}
    </div>
  );
}

