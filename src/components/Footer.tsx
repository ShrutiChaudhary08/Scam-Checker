import React from 'react';
import { ShieldCheck, PhoneCall } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#101522]/50 py-8 text-xs text-slate-500 dark:text-[#A0AEC0] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#4263eb] dark:text-[#7c9aff]" />
            <span className="font-semibold text-slate-900 dark:text-[#F1F5F9]">Scam Checker</span>
            <span>·</span>
            <span>Local-First Fraud Decision Support</span>
          </div>

          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-medium">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>National Cyber Crime Helpline: <strong>1930</strong> (India)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed border-t border-slate-100 dark:border-[#2A3854]/60 pt-3">
          Advisory disclaimer: Scam Checker is an algorithmic decision-support tool and does not guarantee legitimacy or independent authentication of carrier or bank sender identity. Never disclose one-time passwords (OTPs) or banking credentials.
        </p>
      </div>
    </footer>
  );
};
