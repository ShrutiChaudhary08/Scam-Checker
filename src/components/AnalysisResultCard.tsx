import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  Clock
} from 'lucide-react';
import { AnalysisResponse, AppSettings, Verdict } from '../types';

interface AnalysisResultCardProps {
  result: AnalysisResponse;
  onReset: () => void;
  settings: AppSettings;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  result,
  onReset,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getVerdictTheme = (verdict: Verdict) => {
    switch (verdict) {
      case 'SCAM':
        return {
          icon: ShieldAlert,
          title: 'SCAM DETECTED',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50',
          accentBorder: 'border-rose-200 dark:border-rose-950',
          dotColor: 'bg-rose-500',
        };
      case 'SUSPICIOUS':
        return {
          icon: AlertTriangle,
          title: 'SUSPICIOUS PATTERNS',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
          accentBorder: 'border-amber-200 dark:border-amber-950',
          dotColor: 'bg-amber-500',
        };
      case 'SAFE':
        return {
          icon: ShieldCheck,
          title: 'NO FRAUD SIGNALS DETECTED',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
          accentBorder: 'border-emerald-200 dark:border-emerald-950',
          dotColor: 'bg-emerald-500',
        };
      default:
        return {
          icon: HelpCircle,
          title: 'INCONCLUSIVE ASSESSMENT',
          badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
          accentBorder: 'border-slate-200 dark:border-slate-800',
          dotColor: 'bg-slate-400',
        };
    }
  };

  const theme = getVerdictTheme(result.verdict);
  const Icon = theme.icon;

  const handleCopy = () => {
    const textToCopy = `[Scam Checker Result: ${result.verdict}]\n\nSummary: ${result.summary}\nExplanation: ${result.explanation}\n\nRecommended actions:\n${result.recommended_actions.map(a => `• ${a}`).join('\n')}\n\n⚠️ Verified with Scam Checker. Never share OTPs or passwords.`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${result.verdict}. ${result.summary}. ${result.explanation}. Recommended action: ${result.recommended_actions.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs overflow-hidden transition-colors ${theme.accentBorder}`}>
      {/* Verdict Header Bar */}
      <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-[#2A3854] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#202C40] shrink-0">
            <Icon className="w-6 h-6 text-slate-800 dark:text-slate-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase ${theme.badgeClass}`}>
                {result.verdict}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {theme.title}
              </span>
            </div>
            <h2 className={`font-bold text-slate-900 dark:text-[#F1F5F9] mt-1 tracking-tight ${settings.elderlyMode ? 'text-2xl' : 'text-xl'}`}>
              {result.summary}
            </h2>
          </div>
        </div>

        {/* Secondary Action Toolbar */}
        <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
          {'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleSpeech}
              title="Awaaz se sunein (Voice Readout)"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
                isSpeaking
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent animate-pulse'
                  : 'bg-slate-50 dark:bg-[#202C40] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202C40] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1.5"
            title="Copy formatted result"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4263eb] hover:bg-[#3655d9] dark:bg-[#7c9aff] dark:hover:bg-[#94aeff] text-white dark:text-slate-950 transition-colors flex items-center space-x-1.5 shadow-2xs"
            title="Analyze another message"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Check</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-6">
        {/* Primary Explanation */}
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
            Assessment &amp; Reasoning
          </span>
          <p className={`text-slate-800 dark:text-[#F1F5F9] leading-relaxed font-normal ${settings.elderlyMode ? 'text-xl' : 'text-base'}`}>
            {result.explanation}
          </p>
        </div>

        {/* Suspicious Indicators (Clean, unboxed or crisp pill-free table layout) */}
        {result.suspicious_indicators && result.suspicious_indicators.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
              Flagged Phrases &amp; Potential Risks
            </span>
            <div className="space-y-2">
              {result.suspicious_indicators.map((ind, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200/90 dark:border-[#2A3854] bg-slate-50/70 dark:bg-[#202C40]/40 p-3.5 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                      &quot;{ind.text}&quot;
                    </span>
                    <p className="text-slate-600 dark:text-[#A0AEC0] pt-0.5 leading-relaxed">
                      {ind.reason}
                    </p>
                  </div>
                  {ind.severity && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 self-start">
                      {ind.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        <div className="rounded-xl bg-slate-900 dark:bg-[#101522] text-white p-5 space-y-2 border border-slate-800 dark:border-[#2A3854]">
          <span className="text-xs uppercase tracking-wider font-bold text-[#7c9aff] block">
            Recommended Next Steps
          </span>
          <ul className={`space-y-1.5 text-slate-200 dark:text-slate-300 ${settings.elderlyMode ? 'text-base' : 'text-xs sm:text-sm'}`}>
            {result.recommended_actions.map((act, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-[#7c9aff] font-bold shrink-0">·</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* SAFE Caution Banner if verdict is SAFE */}
        {result.verdict === 'SAFE' && (
          <div className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-[#202C40]/20 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">Notice: </strong>
            A &apos;SAFE&apos; status indicates the absence of known fraudulent patterns. Always confirm with your financial institution directly before clicking links, sharing OTPs, or dispatching funds.
          </div>
        )}

        {/* Expandable Technical Details (Progressive Disclosure) */}
        <div className="border-t border-slate-100 dark:border-[#2A3854] pt-3">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 transition-colors"
          >
            <span className="font-medium">Technical Details &amp; Latency</span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#202C40]/50 border border-slate-200/80 dark:border-[#2A3854] text-xs text-slate-600 dark:text-[#A0AEC0] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Engine: <strong>{result.model_used}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Latency: <strong className="font-mono tabular-nums">{result.latency_ms} ms</strong></span>
              </div>
              <div>
                <span>Timestamp: <strong className="font-mono text-[11px]">{new Date(result.timestamp).toLocaleTimeString()}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
