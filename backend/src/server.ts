import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { store } from './store.js';
import { getProvider } from './providers/index.js';
import { transcribeRouter } from './routes/transcribe.js';
import { tasksRouter } from './routes/tasks.js';
import { aiRouter } from './routes/ai.js';
import { metaRouter } from './routes/meta.js';

async function main() {
  await store.init();

  const app = express();
  const { provider, fallbackFrom } = getProvider();

  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'EchoScribe API',
      version: '1.0.0',
      docs: '/api/v1',
      health: '/api/v1/health',
      provider: provider.name,
    });
  });

  app.use('/api/v1', metaRouter);
  app.use('/api/v1/transcribe', transcribeRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/ai', aiRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `接口不存在：${req.method} ${req.path}` });
  });

  app.use(
    (
      err: Error & { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const status = err.status ?? 500;
      if (status >= 500) console.error('[server]', err);
      res.status(status).json({ error: status >= 500 ? '服务器内部错误' : err.message });
    },
  );

  app.listen(config.port, () => {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │        EchoScribe 声稿 · 转写服务 API       │');
    console.log('  ├─────────────────────────────────────────────┤');
    console.log(`  │  地址      http://localhost:${String(config.port).padEnd(11)}│`);
    console.log(`  │  转写引擎  ${provider.name.padEnd(32)}│`);
    console.log(`  │  演示模式  ${String(provider.isDemo).padEnd(32)}│`);
    console.log('  └─────────────────────────────────────────────┘');
    if (fallbackFrom) {
      console.warn(`  ! 引擎 ${fallbackFrom} 未就绪，已回退到演示引擎`);
    }
    console.log('');
  });
}

void main();
