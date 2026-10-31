export type Verdict = 'SCAM' | 'SUSPICIOUS' | 'SAFE' | 'UNKNOWN';

export interface SuspiciousIndicator {
  text: string;
  reason: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface AnalysisResponse {
  id: string;
  message: string;
  verdict: Verdict;
  summary: string;
  explanation: string;
  warning_signs: string[];
  suspicious_indicators: SuspiciousIndicator[];
  recommended_actions: string[];
  model_used: string;
  latency_ms: number;
  timestamp: string;
  engine: 'ollama' | 'gemini' | 'local_rule_engine';
  is_fallback?: boolean;
}

export interface AnalysisHistoryItem extends AnalysisResponse {
  pinned?: boolean;
}

export interface AppSettings {
  ollamaUrl: string;
  selectedModel: string;
  temperature: number;
  preferLocalRuleEngine: boolean;
  elderlyMode: boolean;
  languageMode: 'hinglish' | 'english';
  theme: 'light' | 'dark';
}

export interface BenchmarkMessage {
  id: string;
  text: string;
  label: 'SCAM' | 'SAFE';
  category: 'bank-kyc' | 'otp' | 'delivery' | 'electricity' | 'job' | 'lottery' | 'digital-arrest' | 'family' | 'phishing';
  sourceSet: 'handwritten-24' | 'public-examples-7' | 'inbox-genuine-3';
  analysisResult?: AnalysisResponse;
}

export interface ConfusionMatrix {
  tp: number; // true positives (scam detected as scam/flagged)
  tn: number; // true negatives (safe detected as safe)
  fp: number; // false alarms (safe misclassified as scam)
  fn: number; // missed scams (scam misclassified as safe)
}

export interface EvaluationSummary {
  total: number;
  evaluated: number;
  correct: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falseAlarms: number;
  missedScams: number;
  unknowns: number;
  avgLatencyMs: number;
  confusionMatrix: ConfusionMatrix;
}
