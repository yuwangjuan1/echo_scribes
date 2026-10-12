const DEFAULTS = {
  port: 4000,
  provider: 'mock',
  corsOrigin: '*',
  openaiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  pythonBin: 'python',
  freeMinutes: 10,
  dataDir: 'data',
  maxUploadMb: 100,
  maxBatch: 100,
  concurrency: 2,
  llmKey: '',
  llmBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  llmModel: 'glm-4-flash',
  llmTimeoutMs: 60000,
};

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  port: num(process.env.PORT, DEFAULTS.port),
  provider: (process.env.PROVIDER ?? DEFAULTS.provider).trim().toLowerCase(),
  corsOrigin: process.env.CORS_ORIGIN ?? DEFAULTS.corsOrigin,
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? DEFAULTS.openaiKey,
    baseUrl: process.env.OPENAI_BASE_URL ?? DEFAULTS.openaiBaseUrl,
  },
  llm: {
    apiKey: process.env.LLM_API_KEY ?? DEFAULTS.llmKey,
    baseUrl: (process.env.LLM_BASE_URL ?? DEFAULTS.llmBaseUrl).replace(/\/+$/, ''),
    model: process.env.LLM_MODEL ?? DEFAULTS.llmModel,
    timeoutMs: num(process.env.LLM_TIMEOUT_MS, DEFAULTS.llmTimeoutMs),
  },
  pythonBin: process.env.PYTHON_BIN ?? DEFAULTS.pythonBin,
  whisper: {
    model: process.env.WHISPER_MODEL ?? 'small',
    device: process.env.WHISPER_DEVICE ?? 'cpu',
    computeType: process.env.WHISPER_COMPUTE ?? 'int8',
  },
  freeMinutes: num(process.env.FREE_MINUTES, DEFAULTS.freeMinutes),
  dataDir: process.env.DATA_DIR ?? DEFAULTS.dataDir,
  maxUploadMb: DEFAULTS.maxUploadMb,
  maxBatch: DEFAULTS.maxBatch,
  concurrency: DEFAULTS.concurrency,
};

export const FREE_MINUTES = config.freeMinutes;
export const MAX_BATCH = config.maxBatch;
export const MAX_UPLOAD_BYTES = config.maxUploadMb * 1024 * 1024;
