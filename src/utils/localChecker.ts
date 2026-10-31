import { AnalysisResponse, SuspiciousIndicator, Verdict } from '../types';

export function analyzeMessageClientSide(message: string, language: 'hinglish' | 'english' = 'hinglish'): AnalysisResponse {
  const startTime = performance.now();
  const raw = message.trim();
  const text = raw.toLowerCase();

  const indicators: SuspiciousIndicator[] = [];
  const warningSigns: string[] = [];
  let verdict: Verdict = 'SAFE';

  // 1. Phishing / Suspicious Links Detection
  const urlMatches = raw.match(/https?:\/\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+|t\.me\/[^\s]+|[a-zA-Z0-9-]+\.(xyz|top|site|club|vip|online|info|ru|link|pw|icu|app|biz|work)\b[^\s]*/gi);
  if (urlMatches && urlMatches.length > 0) {
    urlMatches.forEach(url => {
      const isShortenerOrSuspicious = /bit\.ly|tinyurl|t\.me|\.(xyz|top|site|club|vip|online|link|pw|icu|app)/i.test(url);
      indicators.push({
        text: url,
        reason: isShortenerOrSuspicious
          ? (language === 'hinglish' 
              ? 'Yeh anjaan ya shortened link hai jo nakli/phishing webpage par le ja sakta hai.'
              : 'Suspicious or URL shortener pointing to an unverified or high-risk domain.')
          : (language === 'hinglish'
              ? 'Message me ek clickable link hai. Sender ko verify kiye bina click na karein.'
              : 'Contains clickable web link that could lead to spoofed authentication portals.'),
        severity: isShortenerOrSuspicious ? 'critical' : 'medium'
      });
    });
    warningSigns.push(language === 'hinglish' ? 'Anjaan web link (Unverified/suspicious URL)' : 'Suspicious web link or URL shortener present');
  }

  // 2. Urgent Time-Pressure / Threats
  const urgencyPattern = /(immediately|turant|tonight|aaj raat|within 24 hours|expire|suspended|deactivated|permanent block|court summon|arrest warrant|urgently|bilkul turant)/i;
  const urgencyMatch = raw.match(urgencyPattern);
  if (urgencyMatch) {
    indicators.push({
      text: urgencyMatch[0],
      reason: language === 'hinglish'
        ? 'Darr aur jaldbaazi paida karke bina soche samjhe action karwane ki koshish (Pressure tactic).'
        : 'Artificial urgency designed to panic recipient into reacting without verifying.',
      severity: 'high'
    });
    warningSigns.push(language === 'hinglish' ? 'Jaldbaazi ya dhamki (Urgency / fear-based deadline)' : 'Urgent deadline or punitive consequence');
  }

  // 3. OTP / PIN / Password Solicitation
  const asksOtp = /(otp|one time password|pin|cvv|password|passcode)/i.test(text) &&
                  /(share|send|bhejo|tell|enter|submit|batayein|verify|disclose)/i.test(text) &&
                  !/(never share|do not share|kisi ke sath share na karein|mat batayein|strictly confidential|do not disclose)/i.test(text);

  if (asksOtp) {
    indicators.push({
      text: 'OTP / PIN sharing request',
      reason: language === 'hinglish'
        ? 'Bank ya genuine company kabhi customer se phone ya message par OTP/PIN nahi maangti.'
        : 'Legitimate financial institutions and services never request OTP, PIN, or CVV.',
      severity: 'critical'
    });
    warningSigns.push(language === 'hinglish' ? 'Secret OTP / PIN ki maang' : 'Direct request for OTP / Credentials');
  }

  // 4. Remote Desktop / Malicious App Installation
  const remoteAppMatch = raw.match(/(anydesk|teamviewer|quicksupport|rustdesk|install app|\.apk|download app)/i);
  if (remoteAppMatch) {
    indicators.push({
      text: remoteAppMatch[0],
      reason: language === 'hinglish'
        ? 'AnyDesk ya APK file daalne se scammer aapka poora mobile screen aur bank apps remote control kar sakta hai.'
        : 'Remote access tool or unverified APK installation grants full device control to attackers.',
      severity: 'critical'
    });
    warningSigns.push(language === 'hinglish' ? 'Remote access app (AnyDesk/APK) download ki maang' : 'Remote screen sharing / APK installation');
  }

  // 5. Electricity Disconnection Scam vs Genuine Bill Notice
  const electricityMatch = raw.match(/(electricity|bijli|power supply|disconnected|disconnection tonight|bill pending)/i);
  const isElectricityScam = electricityMatch && /(disconnected|disconnection tonight|tonight at|immediately contact|officer at|contact.*officer|9[0-9]{9})/i.test(raw);
  const isGenuineElectricityBill = /(consumer no|consumer id|meter no|bill generated|due date is|official app|consumer portal)/i.test(raw);

  if (isElectricityScam && !isGenuineElectricityBill) {
    indicators.push({
      text: electricityMatch ? electricityMatch[0] : 'Electricity disconnection',
      reason: language === 'hinglish'
        ? 'Bijli vibhag aam taur par personal mobile numbers se disconnection warning nahi bhejta.'
        : 'Impersonates local power utility with fabricated immediate disconnection threat.',
      severity: 'critical'
    });
    warningSigns.push(language === 'hinglish' ? 'Bijli katne ka darr aur fake officer number' : 'Utility disconnection scam format');
  }

  // 6. Digital Arrest / Fake Police / CBI / Customs parcel
  const digitalArrestMatch = raw.match(/(customs|cbi|police|narcotics|parcel seized|illegal goods|arrest warrant|court notice|digital arrest)/i);
  if (digitalArrestMatch) {
    indicators.push({
      text: digitalArrestMatch[0],
      reason: language === 'hinglish'
        ? 'Police ya Customs kabhi WhatsApp/Skype par arrest notice ya settlement nahi karti. Yeh Digital Arrest extortion scam hai.'
        : 'Government enforcement agencies do not conduct investigations or arrest notices via SMS/WhatsApp.',
      severity: 'critical'
    });
    warningSigns.push(language === 'hinglish' ? 'Digital Arrest / CBI / Police Parcel extortion' : 'Law enforcement impersonation extortion');
  }

  // 7. Lottery / KBC / Unreal Prize
  const lotteryMatch = raw.match(/(congratulations|you have won|lottery|lucky draw|winner|kbc|kaun banega|reward points|gift card|claim prize)/i);
  if (lotteryMatch && (urlMatches || /(whatsapp|file charges|fee|aadhaar)/i.test(text))) {
    indicators.push({
      text: lotteryMatch[0],
      reason: language === 'hinglish'
        ? 'Bina participate kiye koi lottery nahi lagti. Registration fee ya documents maangna 100% fraud hai.'
        : 'Unsolicited prize or lottery claim requiring fee payment or credential disclosure.',
      severity: 'high'
    });
    warningSigns.push(language === 'hinglish' ? 'Fake lottery / KBC lucky draw' : 'Advance-fee lottery / prize scam');
  }

  // 8. Part-Time Work / Telegram Tasks
  const jobMatch = raw.match(/(part time job|earn money|earn daily|telegram|youtube like|review tasks|work from home|daily 3000|daily 5000|@earndaily)/i);
  if (jobMatch) {
    indicators.push({
      text: jobMatch[0],
      reason: language === 'hinglish'
        ? 'Like/Subscribe karke daily moti kamai ka jhaansa dekar Telegram group me crypto/investment task karwaye jaate hain.'
        : 'High-paying simple online task scam designed to funnel victims into fraudulent investment groups.',
      severity: 'high'
    });
    warningSigns.push(language === 'hinglish' ? 'Telegram part-time job fraud' : 'Task / recruitment phishing scam');
  }

  // 9. Fake Bank / KYC Expired
  const kycMatch = raw.match(/(kyc|pan update|pan card|aadhaar|account block|account suspended|deactivated|freeze|hold)/i);
  if (kycMatch && (urlMatches || urgencyMatch || /(call|9[0-9]{9})/i.test(text))) {
    indicators.push({
      text: kycMatch[0],
      reason: language === 'hinglish'
        ? 'RBI ke niyam anusar bank kabhi SMS link se PAN/KYC update nahi karwate.'
        : 'Phishing tactic impersonating bank KYC compliance to capture credentials.',
      severity: 'critical'
    });
    warningSigns.push(language === 'hinglish' ? 'Fake KYC / Bank account suspend threat' : 'Banking KYC suspension threat');
  }

  // 10. Check if genuine OTP notification
  const isOtpNotification = /(otp|one-time password|verification code) is [0-9]{4,8}/i.test(text) ||
                            /(use otp|your otp is|login otp)/i.test(text) ||
                            /[0-9]{4,8} is your (otp|verification code|one-time)/i.test(text);
  const saysDoNotShare = /(do not share|never share|not to be shared|kisi ke sath share na|confidential|do not disclose)/i.test(text);

  // 11. Transaction alert, delivery update, or standard utility/bill reminder
  const bankDebitAlert = /(debited by|credited to|spent at|a\/c no|bal:?|avl bal|inr [0-9]+|rs\.? [0-9]+|savings a\/c|salary of)/i.test(text);
  const deliveryAlert = /(out for delivery|delivered|dispatched|courier|tracking id|order placed|swiggy|zomato|amazon|flipkart|blinkit)/i.test(text) && !urlMatches;
  const isSafeUtilityOrRecharge = /(recharge on|thanks app|consumer portal|official app|due date is|airtel thanks|bill for|subscriber id)/i.test(text) && !urlMatches;
  const isFamilyOrPersonal = /(papa|maa|mummy|bhai|train me|station|office me|presentation|late ho jaunga|dinner|auto le kar|doctor|dr\.|appointment|consultation)/i.test(text) && !urlMatches;

  // Decide verdict
  const hasCriticalIndicators = indicators.some(i => i.severity === 'critical');
  const hasHighIndicators = indicators.some(i => i.severity === 'high');

  if (hasCriticalIndicators || indicators.length >= 2) {
    verdict = 'SCAM';
  } else if (hasHighIndicators || (urlMatches && urlMatches.length > 0)) {
    verdict = 'SUSPICIOUS';
  } else if (isOtpNotification && saysDoNotShare) {
    verdict = 'SAFE';
  } else if (bankDebitAlert || deliveryAlert || isSafeUtilityOrRecharge || isFamilyOrPersonal) {
    verdict = 'SAFE';
  } else if (indicators.length === 0) {
    verdict = 'SAFE';
  } else {
    verdict = 'SUSPICIOUS';
  }

  let summary = '';
  let explanation = '';
  const recommendedActions: string[] = [];

  if (verdict === 'SCAM') {
    summary = language === 'hinglish'
      ? 'Khatra! Yeh message ek scam/fraud ki koshish lagta hai.'
      : 'High Risk: This message exhibits clear indicators of fraudulent activity.';
    explanation = language === 'hinglish'
      ? 'Is message me scam ke aam tareeqe jaise darr dikhana, anjaan link kholna, ya sensitive information maangna paya gaya hai.'
      : 'The message employs pressure tactics, unverified external links, or attempts to obtain credentials/payments under false pretenses.';
    recommendedActions.push(
      language === 'hinglish' ? 'Kisi bhi link par bilkul click mat karein.' : 'Do NOT click any web link in the message.',
      language === 'hinglish' ? 'OTP, PIN, Password ya paise kisi ko na bhejein.' : 'Never disclose OTP, PIN, password, or send money.',
      language === 'hinglish' ? 'Sender ka phone number block karein aur message delete karein.' : 'Block the sender phone number immediately.',
      language === 'hinglish' ? 'Agar bank ka mamla hai to card ke piche likhe number par phone karein.' : 'Verify directly via official bank helpline printed on your card.',
      language === 'hinglish' ? 'Cyber fraud ki complaint ke liye 1930 par call karein ya cybercrime.gov.in par report karein.' : 'Report fraud incidents to National Cyber Crime Helpline (1930).'
    );
  } else if (verdict === 'SUSPICIOUS') {
    summary = language === 'hinglish'
      ? 'Savdhaan! Yeh message sandehaspad lag raha hai.'
      : 'Caution: This message contains unverified or suspicious characteristics.';
    explanation = language === 'hinglish'
      ? 'Message me kuch anjaan links ya darr/jaldbaazi ki baatein hain. Bina pakki tasdeeq kiye aage na badhein.'
      : 'The message contains links or ambiguous requests that cannot be reliably authenticated. Independent verification recommended.';
    recommendedActions.push(
      language === 'hinglish' ? 'Link kholne se bachein; official app ya website alag se kholein.' : 'Avoid clicking embedded links; navigate to official app or website directly.',
      language === 'hinglish' ? 'Kisi anjaan vyakti ke kehne par koi app install na karein.' : 'Do not install any applications or screen sharing software.',
      language === 'hinglish' ? 'Kisi bharosemand parivaar ke sadasya ya dost se poochhein.' : 'Consult a trusted family member or colleague before acting.'
    );
  } else {
    summary = language === 'hinglish'
      ? 'Surakshit lag raha hai (No obvious scam patterns identified).'
      : 'Safe (No obvious scam indicators detected).';
    explanation = language === 'hinglish'
      ? 'Is message me aam scam ke lakshan (jaise nakli links, OTP maangna, ya dhamki) nahi mile. Yeh aam notification ya family message lagta hai.'
      : 'The message does not display standard fraud signals such as credential phishing, coercive threats, or suspicious redirects.';
    recommendedActions.push(
      language === 'hinglish' ? 'Yaad rakhein: SAFE ka matlab sirf itna hai ki koi scam sign nahi dikha.' : 'Remember: SAFE only indicates absence of common fraud markers, not verified sender identity.',
      language === 'hinglish' ? 'Phir bhi kabhi kisi anjaan vyakti ke sath OTP ya banking details share na karein.' : 'Continue safeguarding confidential financial data and never share OTPs.',
      language === 'hinglish' ? 'Paise transfer karne se pehle recipient ko call karke confirm karein.' : 'Independently confirm financial requests before dispatching funds.'
    );
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    id: 'res_' + Math.random().toString(36).substring(2, 9),
    message: raw,
    verdict,
    summary,
    explanation,
    warning_signs: warningSigns,
    suspicious_indicators: indicators,
    recommended_actions: recommendedActions,
    model_used: 'Local Rule & Heuristic Engine (Offline)',
    latency_ms: durationMs,
    timestamp: new Date().toISOString(),
    engine: 'local_rule_engine',
    is_fallback: false
  };
}
