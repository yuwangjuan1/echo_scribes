import { config } from '../config.js';
import { MockProvider } from './mock.js';
import { OpenAiWhisperProvider } from './openai.js';
import { LocalWhisperProvider } from './local.js';
import type { TranscriptionProvider } from './provider.js';

const mockProvider = new MockProvider();
const openAiProvider = new OpenAiWhisperProvider();
const localProvider = new LocalWhisperProvider();

export function getProvider(): { provider: TranscriptionProvider; fallbackFrom?: string } {
  if (config.provider === 'local') {
    return { provider: localProvider };
  }
  if (config.provider === 'openai') {
    if (!config.openai.apiKey) {
      console.warn('[provider] PROVIDER=openai 但未配置 OPENAI_API_KEY，回退到演示引擎');
      return { provider: mockProvider, fallbackFrom: 'openai' };
    }
    return { provider: openAiProvider };
  }
  return { provider: mockProvider };
}

export type { TranscriptionProvider } from './provider.js';
export { ProviderNotConfiguredError } from './provider.js';
export { mockProvider };
