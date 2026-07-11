import React, { useState, useRef } from 'react';
import type { Group } from '../types';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Download,
  Upload,
  Coins,
  Smile,
  Info,
  ListRestart
} from 'lucide-react';

interface GroupListProps {
  groups: Group[];
  onCreateGroup: () => void;
  onSelectGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onResetDemoData: () => void;
  onImportBackup: (backupJson: string) => boolean;
}

export default function GroupList({
  groups,
  onCreateGroup,
  onSelectGroup,
  onDeleteGroup,
  onResetDemoData,
  onImportBackup
}: GroupListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  // Trigger file selection for importing JSON backup
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const success = onImportBackup(content);
        if (success) {
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Invalid backup file structure.');
        }
      } catch {
        setImportError('Could not parse JSON. Make sure it is a valid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Export all groups to JSON
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groups, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `group_splits_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col justify-between font-sans relative">
      
      {/* App Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100/80 px-6 py-4.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] bg-[#6366f1]/10 text-[#6366f1] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest block w-fit mb-1">
            PayCin • 俾錢
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
            <Coins size={22} className="text-[#6366f1] animate-bounce" />
            PayCin
          </h1>
        </div>

        <button
          onClick={onCreateGroup}
          className="bg-[#6366f1] hover:bg-indigo-600 active:scale-95 text-white p-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-white/20"
          title="Create New Group"
        >
          <Plus size={20} className="stroke-[3]" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        
        {/* Onboarding / Welcome Hero Card with Vibrant Palette Gradient */}
        <div className="bg-gradient-to-tr from-[#6366f1] via-[#fb7185] to-[#4ade80] text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden">
          {/* Subtle abstract blobs */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-6 translate-y-6" />
          <div className="absolute left-1/4 top-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-6" />

          <div className="space-y-4.5 relative z-10 text-left">
            <div className="flex items-center gap-1.5">
              <span className="p-1.5 bg-white/20 rounded-xl">
                <Sparkles size={16} className="text-indigo-100 animate-pulse" />
              </span>
              <span className="text-xs font-black text-indigo-50 tracking-widest uppercase">
                "PayCin" (俾錢) = Give Money
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                No signups.<br />Just split & go.
              </h2>
              <p className="text-xs text-white/90 mt-2 leading-relaxed font-bold">
                The easiest way to split bills and pay money ("PayCin" 俾錢) with friends. No signups or logins required. Settle up in fewer clicks!
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={onCreateGroup}
                className="bg-white text-slate-900 hover:scale-105 active:scale-95 px-4.5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Create Group
              </button>
              <button
                onClick={onResetDemoData}
                className="bg-black/20 hover:bg-black/30 border border-white/20 text-white hover:scale-105 active:scale-95 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ListRestart size={13} className="stroke-[2.5]" />
                <span>Load Demos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Portability Alert */}
        {importError && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 shadow-sm">
            <Info size={14} className="shrink-0 text-rose-500" />
            <span>{importError}</span>
          </div>
        )}
        {importSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold flex items-center gap-2 shadow-sm">
            <Smile size={14} className="shrink-0 text-emerald-500" />
            <span>Backup imported successfully! 🎉</span>
          </div>
        )}

        {/* Groups Ledger Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Active Groups ({groups.length})
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12 bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-6 space-y-4.5">
              <span className="text-4xl block animate-bounce">🎒</span>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">No active groups</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Create a new group, import a JSON backup, or click "Load Demos" to load Skipper and Roommates trip demo.
                </p>
              </div>
              <button
                onClick={onCreateGroup}
                className="bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
              >
                + Create Group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                // Calculate stats for preview
                const spendTotal = group.expenses
                  .filter((e) => !e.isSettlement)
                  .reduce((sum, e) => sum + e.amount, 0);

                return (
                  <motion.div
                    key={group.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border-2 border-slate-100/80 rounded-[24px] shadow-sm hover:border-[#6366f1]/30 hover:shadow-md transition-all flex items-center justify-between group overflow-hidden cursor-pointer"
                  >
                    <div
                      onClick={() => onSelectGroup(group.id)}
                      className="flex-1 p-4.5 flex items-center gap-3.5"
                    >
                      {/* Avatar Icon */}
                      <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#6366f1]/10 to-[#fb7185]/10 text-[#6366f1] border-2 border-[#6366f1]/10 flex items-center justify-center text-sm font-black group-hover:from-[#6366f1] group-hover:to-[#fb7185] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        {group.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1 text-left">
                        <h3 className="text-sm font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <span>{group.members.length} members</span>
                          <span>•</span>
                          <span className="text-[#4ade80] font-black bg-[#4ade80]/10 px-2 py-0.5 rounded-lg">
                            {group.currency}{spendTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pr-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${group.name}" and all its records?`)) {
                            onDeleteGroup(group.id);
                          }
                        }}
                        className="p-2.5 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Group"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        onClick={() => onSelectGroup(group.id)}
                        className="p-1.5 text-slate-300 group-hover:text-indigo-600 transition-colors"
                      >
                        <ChevronRight size={20} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer utility bar with Vibrant branding */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            STORAGE LOCK
          </span>
          <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            Private local storage
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="p-2.5 bg-slate-50 border-2 border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            title="Import Backup JSON"
          >
            <Upload size={14} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Import</span>
          </button>
          
          <button
            onClick={handleExportBackup}
            disabled={groups.length === 0}
            className={`p-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all ${
              groups.length > 0
                ? 'bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                : 'bg-slate-50 border-2 border-slate-50 text-slate-300 cursor-not-allowed'
            }`}
            title="Export Backup JSON"
          >
            <Download size={14} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
