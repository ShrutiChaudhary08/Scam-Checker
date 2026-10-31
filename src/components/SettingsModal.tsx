import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, SlidersHorizontal, Server } from 'lucide-react';
import { AppSettings } from '../types';
import { checkBackendHealth } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; models?: string[] } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const health = await checkBackendHealth(settings.ollamaUrl);
    setTestingConnection(false);

    if (health.ollama?.connected) {
      setTestResult({
        success: true,
        message: `Connected to Ollama at ${settings.ollamaUrl}!`,
        models: health.ollama.models || []
      });
    } else {
      setTestResult({
        success: false,
        message: `Could not reach Ollama at ${settings.ollamaUrl}. The local rule engine will continue operating seamlessly.`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#192234] rounded-2xl max-w-md w-full border border-slate-200 dark:border-[#2A3854] shadow-xl overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#2A3854] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <h3 className="font-bold text-slate-900 dark:text-[#F1F5F9] text-sm">
              Inference &amp; Model Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Engine Mode */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
              Engine Preference
            </label>
            <div className="space-y-1.5">
              <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-[#2A3854] bg-slate-50/50 dark:bg-[#202C40]/40 cursor-pointer">
                <input
                  type="radio"
                  name="enginePref"
                  checked={!settings.preferLocalRuleEngine}
                  onChange={() => setSettings(s => ({ ...s, preferLocalRuleEngine: false }))}
                  className="mt-0.5 text-[#4263eb]"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-[#F1F5F9] block">AI Hybrid Mode (Ollama / Gemma 3 / Gemini)</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Uses local Ollama or cloud proxy when connected, falling back automatically to offline rules.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-[#2A3854] bg-slate-50/50 dark:bg-[#202C40]/40 cursor-pointer">
                <input
                  type="radio"
                  name="enginePref"
                  checked={settings.preferLocalRuleEngine}
                  onChange={() => setSettings(s => ({ ...s, preferLocalRuleEngine: true }))}
                  className="mt-0.5 text-[#4263eb]"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-[#F1F5F9] block">Pure Offline Rule Engine</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Zero network requests, runs 100% locally with instant sub-millisecond execution.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Ollama Host URL */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Ollama Server URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Server className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings(s => ({ ...s, ollamaUrl: e.target.value }))}
                  placeholder="http://localhost:11434"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3854] bg-white dark:bg-[#202C40] text-slate-900 dark:text-[#F1F5F9] font-mono text-xs focus:outline-hidden focus:border-[#4263eb] dark:focus:border-[#7c9aff]"
                />
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3854] bg-slate-50 dark:bg-[#202C40] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors shrink-0 flex items-center space-x-1"
              >
                {testingConnection ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Test</span>}
              </button>
            </div>

            {testResult && (
              <div className={`mt-2 p-2 rounded-lg border text-xs flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Model Tag */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Active Model Tag
            </label>
            <select
              value={settings.selectedModel}
              onChange={(e) => setSettings(s => ({ ...s, selectedModel: e.target.value }))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2A3854] bg-white dark:bg-[#202C40] text-slate-900 dark:text-[#F1F5F9] text-xs font-mono focus:outline-hidden focus:border-[#4263eb] dark:focus:border-[#7c9aff]"
            >
              <option value="gemma3">gemma3 (4B - Recommended)</option>
              <option value="gemma3:1b">gemma3:1b (1B - Low RAM)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Google Cloud)</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-[#202C40]/50 border-t border-slate-100 dark:border-[#2A3854] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#4263eb] hover:bg-[#3655d9] dark:bg-[#7c9aff] dark:hover:bg-[#94aeff] text-white dark:text-slate-950 font-semibold text-xs transition-colors shadow-2xs"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
