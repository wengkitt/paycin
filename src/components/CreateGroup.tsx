import React, { useState } from 'react';
import type { Group, Member } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, ArrowLeft, Users, Landmark, FileText, Check } from 'lucide-react';

interface CreateGroupProps {
  onSave: (group: Group) => void;
  onCancel: () => void;
  groupToEdit?: Group | null;
}

const CURRENCIES = [
  { symbol: '$', label: 'USD / Dollar ($)' },
  { symbol: '€', label: 'EUR / Euro (€)' },
  { symbol: '£', label: 'GBP / Pound (£)' },
  { symbol: '¥', label: 'JPY / Yen (¥)' },
  { symbol: '₹', label: 'INR / Rupee (₹)' },
];

const SUGGESTED_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Casey', 'Jamie', 'Charlie'];

export default function CreateGroup({ onSave, onCancel, groupToEdit }: CreateGroupProps) {
  const [name, setName] = useState(groupToEdit?.name || '');
  const [description, setDescription] = useState(groupToEdit?.description || '');
  const [currency, setCurrency] = useState(groupToEdit?.currency || '$');
  const [newMemberName, setNewMemberName] = useState('');
  const [members, setMembers] = useState<Member[]>(groupToEdit?.members || [
    { id: 'm-me', name: 'You' } // Start with "You" as default
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    
    // Check if duplicate
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in the group.`);
      return;
    }

    const newMember: Member = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
    };

    setMembers([...members, newMember]);
    setNewMemberName('');
    setError(null);
  };

  const handleRemoveMember = (id: string) => {
    // If editing, and member has expenses, prevent or warn (optional for simplicity we just filter)
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    if (members.length < 2) {
      setError('A group must have at least 2 members to split expenses.');
      return;
    }

    const groupData: Group = {
      id: groupToEdit?.id || 'group-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      description: description.trim() || undefined,
      currency,
      members,
      expenses: groupToEdit?.expenses || [],
      createdAt: groupToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(groupData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x-2 border-slate-100/80"
    >
      {/* Top Navigation Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-100/80 px-4 py-4 flex items-center justify-between shadow-xs">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} className="stroke-[3]" />
        </button>
        <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center">
          {groupToEdit ? 'Edit Group Settings' : 'Create New Group'}
        </h1>
        <div className="w-9" /> {/* Spacer to align title */}
      </div>

      {/* Main Form Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-left">
        {error && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-start gap-2.5 animate-scale-in">
            <X size={15} className="shrink-0 mt-0.5 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        {/* Group Name & Description */}
        <div className="space-y-4.5">
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Landmark size={14} className="text-[#6366f1]" />
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Road Trip, Roommates, Dinner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all font-bold text-xs shadow-xs text-left"
              maxLength={40}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={14} className="text-[#fb7185]" />
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fb7185]/10 focus:border-[#fb7185] transition-all text-xs font-bold shadow-xs text-left"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Base Currency
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.symbol}
                  type="button"
                  onClick={() => setCurrency(curr.symbol)}
                  className={`py-2.5 px-1 rounded-2xl border-2 text-sm font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    currency === curr.symbol
                      ? 'bg-gradient-to-tr from-[#6366f1] to-[#818cf8] border-transparent text-white shadow-md shadow-indigo-500/15'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={curr.label}
                >
                  <span className="text-base">{curr.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Member Adding Section */}
        <div className="space-y-4.5 pt-5 border-t-2 border-slate-100/80">
          <div className="text-left space-y-1.5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={14} className="text-[#4ade80]" />
              Group Friends
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              Add at least one more friend to start splitting expenses.
            </p>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Enter friend's name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember(newMemberName);
                  }
                }}
                className="flex-1 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all text-xs font-bold shadow-xs text-left"
                maxLength={25}
              />
              <button
                type="button"
                onClick={() => handleAddMember(newMemberName)}
                className="bg-[#6366f1] hover:bg-indigo-600 text-white p-3 rounded-2xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Plus size={18} className="stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Quick Add Suggestions */}
          <div className="text-left space-y-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Suggested Friends:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_NAMES.map((nameSuggestion) => {
                const isAdded = members.some((m) => m.name.toLowerCase() === nameSuggestion.toLowerCase());
                return (
                  <button
                    key={nameSuggestion}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddMember(nameSuggestion)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-1 ${
                      isAdded
                        ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 cursor-pointer active:scale-95'
                    }`}
                  >
                    {isAdded ? <Check size={10} className="stroke-[3]" /> : <Plus size={10} className="stroke-[3]" />}
                    <span>{nameSuggestion}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Members List */}
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              Active Friends ({members.length})
            </span>
            
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-2xl border-2 border-slate-100 shadow-xs overflow-hidden text-left"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <span className="w-5.5 h-5.5 rounded-lg bg-indigo-50 border border-indigo-100/50 text-[#6366f1] flex items-center justify-center text-[10px] font-black">
                        {index + 1}
                      </span>
                      <span className="text-xs font-black text-slate-700">
                        {member.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={member.id === 'm-me'} // "You" must stay as primary creator
                      onClick={() => handleRemoveMember(member.id)}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                        member.id === 'm-me' 
                          ? 'text-slate-300 cursor-not-allowed opacity-40' 
                          : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <X size={14} className="stroke-[2.5]" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white border-t-2 border-slate-100 p-4 space-y-2.5 sticky bottom-0 z-30">
        <button
          onClick={handleSubmit}
          className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            name.trim() && members.length >= 2
              ? 'bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#4ade80] hover:brightness-105 text-white shadow-indigo-500/10'
              : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
          }`}
          disabled={!name.trim() || members.length < 2}
        >
          {groupToEdit ? 'Save Changes' : 'Create Group'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-wider hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
