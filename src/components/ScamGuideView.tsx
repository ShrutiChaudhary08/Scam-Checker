import React from 'react';
import { 
  Building2, 
  Zap, 
  AlertTriangle, 
  Briefcase, 
  Gift, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { AppSettings } from '../types';

interface ScamGuideViewProps {
  settings: AppSettings;
}

export const ScamGuideView: React.FC<ScamGuideViewProps> = () => {
  const scamPatterns = [
    {
      title: 'Fake Bank KYC Expired / Account Block',
      hindiTitle: 'Bank / Paytm KYC Expire Scam',
      icon: Building2,
      example: 'Dear customer, your SBI YONO account will be blocked today due to pending PAN card update. Click http://sbi-pan-kyc.top to verify immediately.',
      redFlags: [
        'Urgent threats ("blocked today", "suspended in 24 hours").',
        'Unofficial URL domain (not on official bank domain).',
        'RBI prohibits banks from demanding KYC verification via SMS links.'
      ],
      action: 'Do not click the link. Call the toll-free telephone number printed on your ATM card.'
    },
    {
      title: 'Electricity Disconnection Tonight',
      hindiTitle: 'Bijli Katne Ka Farzi Message',
      icon: Zap,
      example: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because previous month bill was not updated. Contact electricity officer at 9876543210.',
      redFlags: [
        'Gives an ordinary 10-digit mobile number instead of an official electricity board helpline.',
        'No consumer number, meter ID, or exact pending amount mentioned.',
        'Electricity boards provide formal written notices with payment grace periods.'
      ],
      action: 'Never call numbers in SMS. Check bill status directly in your state discom app.'
    },
    {
      title: 'Digital Arrest / Fake Police / CBI Parcel',
      hindiTitle: 'Digital Arrest & CBI Extortion',
      icon: AlertTriangle,
      example: 'Mumbai Customs Alert: A parcel sent to your name containing narcotics has been seized. Digital arrest warrant issued by CBI. Join urgent Skype video call http://cbi-desk.site immediately.',
      redFlags: [
        'There is NO SUCH THING as "Digital Arrest" under Indian law (confirmed by CBI and MHA).',
        'Law enforcement never conducts interrogations or arrests via Skype/WhatsApp video.',
        'Pressure victims to transfer funds to mule "government verification accounts".'
      ],
      action: 'Immediately disconnect the call. Do not transfer any money. Report immediately to 1930 Cyber Helpline.'
    },
    {
      title: 'Part-Time Telegram Job Scam',
      hindiTitle: 'YouTube Like & Telegram Earning Scam',
      icon: Briefcase,
      example: 'Earn Rs 3000 to 5000 daily working from home! Simple YouTube video like and subscribe tasks. No investment needed. Contact HR manager on Telegram @EarnDaily_Manager.',
      redFlags: [
        'Initially pays small amounts to win trust, then demands "prepaid task deposits" of Rs 5,000–50,000.',
        'All communications happen via anonymous Telegram channels.',
        'Funds become frozen and they demand additional withdrawal taxes.'
      ],
      action: 'Never pay money to get a job. Block the sender and report the Telegram channel.'
    },
    {
      title: 'Lottery / KBC WhatsApp Lucky Draw',
      hindiTitle: 'KBC Lottery & Lucky Draw Winner',
      icon: Gift,
      example: 'Congratulations! You have won Rs 25 Lakhs in Kaun Banega Crorepati WhatsApp Lucky Draw. Send photo of Aadhaar card and Rs 1,500 file charges to claim your cheque.',
      redFlags: [
        'You cannot win a lottery you never entered or purchased a ticket for.',
        'Demands upfront "file charges" or "processing fees".',
        'Requests photos of Aadhaar/PAN cards to execute identity theft.'
      ],
      action: 'Never send fees or government IDs. Legitimate lotteries never ask for advance payments.'
    },
    {
      title: 'Remote Access App (AnyDesk / TeamViewer / APK)',
      hindiTitle: 'AnyDesk Screen Sharing Scam',
      icon: Smartphone,
      example: 'Urgent: To process your pending refund of Rs 14,350, install QuickSupport or LoanMitra.apk and share the 9-digit code with our executive.',
      redFlags: [
        'Remote desktop apps grant attackers full visual and touch control of your phone.',
        'Attackers view credentials and intercepts incoming two-factor OTPs in real-time.',
        'Never install unverified .apk files received via WhatsApp or SMS.'
      ],
      action: 'Never install remote desktop apps or side-load APKs at anyone\'s request.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs p-6 sm:p-7 transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight">
          Common Scam Signatures &amp; Red Flags
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#A0AEC0] mt-1 leading-relaxed max-w-2xl">
          How scammers engineer urgency, fear, or unearned wealth to override natural skepticism.
        </p>

        {/* 3 Golden Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-[#2A3854] text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202C40]/50 border border-slate-200/80 dark:border-[#2A3854]">
            <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">1. Never Share OTPs</strong>
            <span className="text-slate-500 dark:text-slate-400">No bank officer or legitimate service ever asks for your OTP or UPI PIN.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202C40]/50 border border-slate-200/80 dark:border-[#2A3854]">
            <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">2. Don&apos;t Click SMS Links</strong>
            <span className="text-slate-500 dark:text-slate-400">Navigate to the official portal directly via your browser or banking app.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202C40]/50 border border-slate-200/80 dark:border-[#2A3854]">
            <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">3. Verify on Physical Card</strong>
            <span className="text-slate-500 dark:text-slate-400">Flip your ATM card and call the customer service number embossed on the back.</span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Scam Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scamPatterns.map((pat, idx) => {
          const Icon = pat.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-2xs p-5 space-y-3.5 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#202C40] text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9] leading-tight">
                    {pat.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{pat.hindiTitle}</span>
                </div>
              </div>

              {/* Sample format */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#202C40]/60 border border-slate-200/80 dark:border-[#2A3854] font-mono text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed">
                &quot;{pat.example}&quot;
              </div>

              {/* Red flags */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-[#A0AEC0]">
                {pat.redFlags.map((flag, fIdx) => (
                  <div key={fIdx} className="flex items-start space-x-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>

              {/* Action advice */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#2A3854] flex items-start space-x-1.5 text-xs text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Safe Action:</strong> {pat.action}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Genuine Communication Indicators */}
      <div className="bg-white dark:bg-[#192234] rounded-2xl border border-slate-200/90 dark:border-[#2A3854] shadow-xs p-6 transition-colors">
        <div className="flex items-center space-x-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
            Hallmarks of Authentic Bank Communications
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-[#A0AEC0]">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202C40]/40 border border-slate-200/80 dark:border-[#2A3854] space-y-1">
            <strong className="text-slate-900 dark:text-slate-100 block">Transaction Alerts</strong>
            <p>Masks your account number (e.g., A/c XX4091), quotes updated balance, and never requires clicking an external link to &quot;confirm&quot;.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#202C40]/40 border border-slate-200/80 dark:border-[#2A3854] space-y-1">
            <strong className="text-slate-900 dark:text-slate-100 block">OTP Messages</strong>
            <p>Explicitly advises you not to disclose the OTP to anyone, including bank executives, and names the initiating merchant.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
