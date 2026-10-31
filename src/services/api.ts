import { AnalysisResponse, AppSettings } from '../types';
import { analyzeMessageClientSide } from '../utils/localChecker';

export async function analyzeMessage(
  message: string,
  settings: AppSettings
): Promise<AnalysisResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  // If user prefers client-only offline engine
  if (settings.preferLocalRuleEngine) {
    return analyzeMessageClientSide(trimmed, settings.languageMode);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: trimmed,
        model: settings.selectedModel,
        ollamaUrl: settings.ollamaUrl,
        preferLocal: settings.preferLocalRuleEngine,
        language: settings.languageMode
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    const data: AnalysisResponse = await res.json();
    return data;
  } catch (error) {
    console.warn('Backend API request failed or timed out. Falling back to local client-side analysis:', error);
    const fallbackResult = analyzeMessageClientSide(trimmed, settings.languageMode);
    fallbackResult.is_fallback = true;
    return fallbackResult;
  }
}

export async function checkBackendHealth(ollamaUrl: string) {
  try {
    const res = await fetch(`/api/health?ollamaUrl=${encodeURIComponent(ollamaUrl)}`);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'degraded', ollama: { connected: false } };
  } catch (err) {
    return { status: 'offline', ollama: { connected: false }, error: String(err) };
  }
}

export async function fetchAvailableModels() {
  try {
    const res = await fetch('/api/models');
    if (res.ok) {
      const data = await res.json();
      return data.models || [];
    }
  } catch {
    // ignore
  }
  return [
    { id: 'local_engine', name: 'Local Rule Engine (Offline)', provider: 'local', isDefault: true },
    { id: 'gemma3', name: 'Gemma 3 (via Ollama)', provider: 'ollama' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' }
  ];
}
