import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { BENCHMARK_MESSAGES } from '../data/benchmarkData';
import { analyzeMessageClientSide } from '../utils/localChecker';
import { AnalysisResponse, AppSettings, BenchmarkMessage } from '../types';

interface EvaluationViewProps {
  settings: AppSettings;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ settings }) => {
  const [selectedSet, setSelectedSet] = useState<'all' | 'handwritten-24' | 'public-examples-7' | 'inbox-genuine-3'>('all');
  const [items, setItems] = useState<BenchmarkMessage[]>(BENCHMARK_MESSAGES);
  const [isRunning, setIsRunning] = useState(false);
  const [filterResult, setFilterResult] = useState<'all' | 'correct' | 'false_alarm' | 'missed_scam'>('all');

  const filteredItems = items.filter(item => {
    if (selectedSet !== 'all' && item.sourceSet !== selectedSet) return false;
    if (filterResult === 'all') return true;

    if (!item.analysisResult) return false;
    const isFlagged = item.analysisResult.verdict === 'SCAM' || item.analysisResult.verdict === 'SUSPICIOUS' || item.analysisResult.verdict === 'UNKNOWN';
    const isTrueScam = item.label === 'SCAM';

    if (filterResult === 'correct') return isFlagged === isTrueScam;
    if (filterResult === 'false_alarm') return isFlagged && !isTrueScam;
    if (filterResult === 'missed_scam') return !isFlagged && isTrueScam;
    return true;
  });

  const runEvaluation = async () => {
    setIsRunning(true);
    const targetSet = items.filter(item => selectedSet === 'all' || item.sourceSet === selectedSet);

    const updated = [...items];
    for (const item of targetSet) {
      const idx = updated.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        const result: AnalysisResponse = analyzeMessageClientSide(item.text, settings.languageMode);
        updated[idx] = {
          ...updated[idx],
          analysisResult: result
        };
      }
    }

    setItems(updated);
    setIsRunning(false);
  };

  const currentSubset = items.filter(i => (selectedSet === 'all' || i.sourceSet === selectedSet) && i.analysisResult);
  const totalEvaluated = currentSubset.length;

  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let unknowns = 0;
  let totalLatency = 0;

  currentSubset.forEach(item => {
    const res = item.analysisResult!;
    const isFlagged = res.verdict === 'SCAM' || res.verdict === 'SUSPICIOUS' || res.verdict === 'UNKNOWN';
    const isTrueScam = item.label === 'SCAM';
    totalLatency += res.latency_ms;

    if (res.verdict === 'UNKNOWN') unknowns++;

    if (isFlagged && isTrueScam) tp++;
    else if (!isFlagged && !isTrueScam) tn++;
    else if (isFlagged && !isTrueScam) fp++;
    else if (!isFlagged && isTrueScam) fn++;
  });

  const correct = tp + tn;
  const accuracy = totalEvaluated > 0 ? Number(((correct / totalEvaluated) * 100).toFixed(1)) : 0;
  const precision = tp + fp > 0 ? Number(((tp / (tp + fp)) * 100).toFixed(1)) : 0;
  const recall = tp + fn > 0 ? Number(((tp / (tp + fn)) * 100).toFixed(1)) : 0;
  const f1Score = precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-slate-800 dark:text-slate-200" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
                Model Evaluation &amp; Benchmarks
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0AEC0] mt-1">
              Deterministic evaluation across 34 benchmark test messages from the project repository.
            </p>
          </div>

          <button
            type="button"
            onClick={runEvaluation}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-[#4263eb] hover:bg-[#3655d9] dark:bg-[#7c9aff] dark:hover:bg-[#94aeff] text-white dark:text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 self-start sm:self-center shrink-0 shadow-xs"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Benchmark</span>
              </>
            )}
          </button>
        </div>

        {/* Dataset selector chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-[#2A3854] text-xs">
          <span className="text-slate-400 dark:text-slate-500 mr-1 font-medium">Dataset:</span>
          {(
            [
              { id: 'all', label: 'All Sets (34)' },
              { id: 'handwritten-24', label: '24 Hand-written' },
              { id: 'public-examples-7', label: '7 Public Scams' },
              { id: 'inbox-genuine-3', label: '3 Inbox Messages' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSet(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedSet === tab.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-semibold'
                  : 'bg-slate-100 dark:bg-[#202C40] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#192234] rounded-xl border border-slate-200/90 dark:border-[#2A3854] p-4 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Accuracy
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F1F5F9] mt-1">
            {totalEvaluated > 0 ? `${accuracy}%` : '—'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {correct} of {totalEvaluated} correct
          </span>
        </div>

        <div className="bg-white dark:bg-[#192234] rounded-xl border border-slate-200/90 dark:border-[#2A3854] p-4 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Precision
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {totalEvaluated > 0 ? `${precision}%` : '—'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            True positive rate
          </span>
        </div>

        <div className="bg-white dark:bg-[#192234] rounded-xl border border-slate-200/90 dark:border-[#2A3854] p-4 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Recall
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#4263eb] dark:text-[#7c9aff] mt-1">
            {totalEvaluated > 0 ? `${recall}%` : '—'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Scams caught
          </span>
        </div>

        <div className="bg-white dark:bg-[#192234] rounded-xl border border-slate-200/90 dark:border-[#2A3854] p-4 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            F1 Score
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {totalEvaluated > 0 ? `${f1Score}%` : '—'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Harmonic balance
          </span>
        </div>
      </div>

      {/* Dataset Records Table */}
      <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-[#2A3854] flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-900 dark:text-[#F1F5F9]">
            Benchmark Records ({filteredItems.length})
          </span>

          <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#202C40] rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'correct', label: 'Correct' },
                { id: 'false_alarm', label: 'False Alarms' },
                { id: 'missed_scam', label: 'Missed' },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterResult(f.id)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterResult === f.id
                    ? 'bg-white dark:bg-[#192234] text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-[#A0AEC0]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#202C40]/60 border-b border-slate-200/80 dark:border-[#2A3854] text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-20">Ground Truth</th>
                <th className="py-2.5 px-4 w-28">Verdict</th>
                <th className="py-2.5 px-4">Message Text</th>
                <th className="py-2.5 px-4 w-48">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2A3854]">
              {filteredItems.map(item => {
                const isEvaluated = Boolean(item.analysisResult);
                const isFlagged = item.analysisResult && (item.analysisResult.verdict === 'SCAM' || item.analysisResult.verdict === 'SUSPICIOUS');
                const isTrueScam = item.label === 'SCAM';
                const isCorrect = isEvaluated && (Boolean(isFlagged) === isTrueScam);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-[#202C40]/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.label === 'SCAM'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                      }`}>
                        {item.label}
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      {isEvaluated ? (
                        <div className="flex items-center space-x-1.5">
                          {isCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.analysisResult!.verdict}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">Pending</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed max-w-md">
                      &quot;{item.text}&quot;
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      {item.analysisResult ? item.analysisResult.explanation : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
