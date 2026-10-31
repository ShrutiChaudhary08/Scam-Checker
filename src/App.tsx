import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MessageInput } from './components/MessageInput';
import { AnalysisResultCard } from './components/AnalysisResultCard';
import { AnalysisHistory } from './components/AnalysisHistory';
import { EvaluationView } from './components/EvaluationView';
import { ScamGuideView } from './components/ScamGuideView';
import { SettingsModal } from './components/SettingsModal';
import { Footer } from './components/Footer';
import { AnalysisHistoryItem, AnalysisResponse, AppSettings } from './types';
import { analyzeMessage, checkBackendHealth } from './services/api';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checker' | 'evaluation' | 'guide'>('checker');
  const [message, setMessage] = useState('');
  const [currentResult, setCurrentResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  // Initialize theme from localStorage or light mode default
  const [settings, setSettings] = useState<AppSettings>(() => {
    let initialTheme: 'light' | 'dark' = 'light';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('scam_checker_theme');
      if (stored === 'dark' || stored === 'light') {
        initialTheme = stored;
      }
    }
    return {
      ollamaUrl: 'http://localhost:11434',
      selectedModel: 'gemma3',
      temperature: 0,
      preferLocalRuleEngine: false,
      elderlyMode: false,
      languageMode: 'hinglish',
      theme: initialTheme,
    };
  });

  // Sync dark class on document element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = settings.theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('scam_checker_theme', settings.theme);
    }
  }, [settings.theme]);

  // Health check on mount
  useEffect(() => {
    checkBackendHealth(settings.ollamaUrl).then(status => {
      setIsBackendHealthy(status.status === 'healthy' || status.status === 'ok');
    });
  }, [settings.ollamaUrl]);

  const handleAnalyze = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeMessage(trimmed, settings);
      setCurrentResult(result);

      // Add to ephemeral session history
      setHistory(prev => [
        {
          ...result,
          id: 'hist_' + Date.now() + Math.random().toString(36).substring(2, 5),
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const errMsg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setCurrentResult(null);
    setError(null);
  };

  const handleSelectHistory = (item: AnalysisHistoryItem) => {
    setMessage(item.message);
    setCurrentResult(item);
    setActiveTab('checker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#101522] text-[#172033] dark:text-[#F1F5F9] transition-colors ${
      settings.elderlyMode ? 'text-lg' : 'text-base'
    }`}>
      {/* Compact Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        setSettings={setSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {activeTab === 'checker' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Minimal Headline Header */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h1 className={`font-black tracking-tight text-slate-900 dark:text-[#F1F5F9] ${
                settings.elderlyMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
              }`}>
                {settings.languageMode === 'hinglish' ? 'Aapka Scam Checker' : 'Verify Suspect Messages'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A0AEC0] leading-relaxed">
                {settings.languageMode === 'hinglish'
                  ? 'Anjaan SMS ya WhatsApp messages ki jaanch karein aur fraud se bachein.'
                  : 'Fast, local-first assessment for phishing links, urgency coercion, and OTP harvesting.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>Notice: </strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Main Centerpiece: Message Input */}
            <MessageInput
              message={message}
              setMessage={setMessage}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              isLoading={isLoading}
              settings={settings}
            />

            {/* Scanning Feedback Animation */}
            {isLoading && (
              <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-[#202C40] flex items-center justify-center animate-scan-radar">
                  <ShieldAlert className="w-6 h-6 text-[#4263eb] dark:text-[#7c9aff]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-[#F1F5F9] text-sm">
                    {settings.languageMode === 'hinglish' ? 'Message ki jaanch ho rahi hai...' : 'Evaluating Message Indicators...'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Scanning for unverified links, artificial urgency, and credentials requests.
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Results View */}
            {currentResult && !isLoading && (
              <AnalysisResultCard
                result={currentResult}
                onReset={handleClear}
                settings={settings}
              />
            )}

            {/* Session History View */}
            <AnalysisHistory
              history={history}
              onSelect={handleSelectHistory}
              onClear={handleClearHistory}
              settings={settings}
            />
          </div>
        )}

        {activeTab === 'evaluation' && (
          <EvaluationView settings={settings} />
        )}

        {activeTab === 'guide' && (
          <ScamGuideView settings={settings} />
        )}
      </main>

      {/* Model & System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      {/* Clean Footer */}
      <Footer />
    </div>
  );
};

export default App;
