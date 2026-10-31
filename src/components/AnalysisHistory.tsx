import React, { useState } from 'react';
import { History, Trash2, ChevronRight, Search } from 'lucide-react';
import { AnalysisHistoryItem, AppSettings } from '../types';

interface AnalysisHistoryProps {
  history: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
  onClear: () => void;
  settings: AppSettings;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  history,
  onSelect,
  onClear,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SCAM' | 'SUSPICIOUS' | 'SAFE'>('ALL');
  const [search, setSearch] = useState('');

  if (history.length === 0) {
    return null;
  }

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.verdict === filter;
    const matchesSearch = !search || item.message.toLowerCase().includes(search.toLowerCase()) || item.summary.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getVerdictDot = (verdict: string) => {
    switch (verdict) {
      case 'SCAM':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-900/50';
      case 'SUSPICIOUS':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-900/50';
      case 'SAFE':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs p-5 sm:p-6 transition-colors space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="font-bold text-slate-900 dark:text-[#F1F5F9] text-sm tracking-tight">
            Session History ({history.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 self-start sm:self-center"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear session</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#202C40] rounded-lg">
          {(['ALL', 'SCAM', 'SUSPICIOUS', 'SAFE'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === tab
                  ? 'bg-white dark:bg-[#192234] text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2A3854] bg-white dark:bg-[#202C40] text-slate-900 dark:text-[#F1F5F9] w-full sm:w-48 focus:outline-hidden focus:border-[#4263eb] dark:focus:border-[#7c9aff]"
          />
        </div>
      </div>

      {/* History Items List */}
      <div className="divide-y divide-slate-100 dark:divide-[#2A3854] max-h-64 overflow-y-auto">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#202C40]/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
          >
            <div className="flex items-start space-x-2.5 overflow-hidden">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase shrink-0 ${getVerdictDot(item.verdict)}`}>
                {item.verdict}
              </span>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-950 dark:group-hover:text-white">
                  {item.summary}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-sm">
                  &quot;{item.message}&quot;
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 text-slate-400">
              <span className="text-[10px] font-mono tabular-nums">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
