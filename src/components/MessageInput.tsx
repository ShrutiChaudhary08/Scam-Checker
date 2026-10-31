import React from 'react';
import { ArrowRight, RotateCcw, Lock } from 'lucide-react';
import { PRESET_EXAMPLES } from '../data/benchmarkData';
import { AppSettings } from '../types';

interface MessageInputProps {
  message: string;
  setMessage: (msg: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  isLoading: boolean;
  settings: AppSettings;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  onAnalyze,
  onClear,
  isLoading,
  settings,
}) => {
  const charCount = message.length;
  const isTooLong = charCount > 4000;
  const isEmpty = message.trim().length === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isEmpty && !isLoading && !isTooLong) {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <section className="space-y-4">
      {/* Central Input Surface */}
      <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs transition-colors overflow-hidden focus-within:border-[#4263eb] dark:focus-within:border-[#7c9aff] focus-within:ring-3 focus-within:ring-[#4263eb]/10 dark:focus-within:ring-[#7c9aff]/10">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            settings.languageMode === 'hinglish'
              ? 'Paste suspect SMS, WhatsApp text, bank notice, or link here...'
              : 'Paste suspect SMS, WhatsApp message, bank alert, or link here...'
          }
          rows={settings.elderlyMode ? 6 : 5}
          disabled={isLoading}
          className={`w-full p-5 sm:p-6 bg-transparent text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden resize-none transition-colors ${
            settings.elderlyMode ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'
          }`}
        />

        {/* Input Footer Toolbar: Character Counter, Reset, and Primary CTA */}
        <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-[#202C40]/50 border-t border-slate-100 dark:border-[#2A3854] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
            <span className={`font-mono tabular-nums ${isTooLong ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
              {charCount} / 4000
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
              Ctrl + Enter to run
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {message && !isLoading && (
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors font-medium flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAnalyze}
              disabled={isEmpty || isTooLong || isLoading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center space-x-2 shadow-xs ${
                isEmpty || isTooLong || isLoading
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-[#4263eb] hover:bg-[#3655d9] dark:bg-[#7c9aff] dark:hover:bg-[#94aeff] text-white dark:text-slate-950 font-bold active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{settings.languageMode === 'hinglish' ? 'Soch raha hoon...' : 'Analyzing...'}</span>
                </>
              ) : (
                <>
                  <span>{settings.languageMode === 'hinglish' ? 'Check Karein' : 'Analyze Message'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Sample Suggestions Row */}
      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-1 font-medium">Try sample:</span>
        {PRESET_EXAMPLES.slice(0, 5).map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setMessage(sample.text)}
            className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-[#192234] border border-slate-200 dark:border-[#2A3854] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors truncate max-w-[200px] sm:max-w-none text-left"
          >
            {sample.title}
          </button>
        ))}
      </div>

      {/* Quiet Security & Privacy Trust Line */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1 pt-1">
        <div className="flex items-center space-x-1.5">
          <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>Local on-device assessment · No personal messages logged</span>
        </div>
        <span>Advisory decision support</span>
      </div>
    </section>
  );
};
