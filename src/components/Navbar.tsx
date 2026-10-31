import React from 'react';
import { ShieldCheck, Sun, Moon, SlidersHorizontal, Globe } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  activeTab: 'checker' | 'evaluation' | 'guide';
  setActiveTab: (tab: 'checker' | 'evaluation' | 'guide') => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenSettings: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  setSettings,
  onOpenSettings,
}) => {
  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings(prev => ({ ...prev, theme: nextTheme }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('scam_checker_theme', nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#101522]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-6">
          {/* Zone 1: Single text element Brand mark */}
          <button
            onClick={() => setActiveTab('checker')}
            className="flex items-center space-x-2.5 text-left focus:outline-hidden group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4 text-[#4263eb] dark:text-[#7c9aff]" />
            </div>
            <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
              Scam Checker
            </span>
          </button>

          {/* Zone 2: Navigation Links (Clean single-line text with subtle state) */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('checker')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'checker'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              Analyze Message
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'evaluation'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              Benchmarks &amp; Tests
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'guide'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              Scam Directory
            </button>
          </nav>

          {/* Zone 3: Functional Utilities (Theme toggle, Senior mode, Language, Settings) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-[#4263eb]"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Senior Mode Toggle */}
            <button
              onClick={() => setSettings(prev => ({ ...prev, elderlyMode: !prev.elderlyMode }))}
              title={settings.elderlyMode ? 'Disable Large Text' : 'Enable Large Text for Seniors'}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center space-x-1 ${
                settings.elderlyMode
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="hidden sm:inline">Senior</span>
              <span className="font-mono text-xs font-bold">{settings.elderlyMode ? 'A+' : 'Aa'}</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={() =>
                setSettings(prev => ({
                  ...prev,
                  languageMode: prev.languageMode === 'hinglish' ? 'english' : 'hinglish',
                }))
              }
              title="Toggle Hinglish / English explanation"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{settings.languageMode}</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Model & Engine Configuration"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-100 dark:border-slate-800/80 py-2 space-x-1">
          <button
            onClick={() => setActiveTab('checker')}
            className={`flex-1 py-1 text-xs font-semibold rounded-md text-center transition-colors ${
              activeTab === 'checker'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Analyze
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex-1 py-1 text-xs font-semibold rounded-md text-center transition-colors ${
              activeTab === 'evaluation'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1 text-xs font-semibold rounded-md text-center transition-colors ${
              activeTab === 'guide'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Directory
          </button>
        </div>
      </div>
    </header>
  );
};
