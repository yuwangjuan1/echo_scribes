import type { Metadata } from 'next';
import Link from 'next/link';
import CodeBlock from '@/components/code-block';
import { API_BASE } from '@/lib/api';

export const metadata: Metadata = {
  title: 'API 文档',
  description: 'EchoScribe 声稿 REST API 文档：提交链接转写、上传文件、任务查询、SSE 实时进度、字幕导出与 AI 增强。',
};

const BASE = `${API_BASE}/api/v1`;

function Method({ method }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' }) {
  const styles = {
    GET: 'bg-mint/10 text-mint ring-mint/25',
    POST: 'bg-accent/10 text-accent ring-accent/25',
    PUT: 'bg-white/[0.06] text-paper ring-white/25',
    DELETE: 'bg-rose/10 text-rose ring-rose/25',
  } as const;
  return (
    <span className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold ring-1 ${styles[method]}`}>
      {method}
    </span>
  );
}

interface EndpointProps {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  desc: string;
  sample: string;
  sampleTitle: string;
  children?: React.ReactNode;
}

function Endpoint({ id, method, path, title, desc, sample, sampleTitle, children }: EndpointProps) {
  return (
    <section id={id} className="glass scroll-mt-24 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Method method={method} />
        <code className="break-all font-mono text-sm text-mist">{path}</code>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-mist">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mist-dim">{desc}</p>
      {children}
      <div className="mt-5">
        <CodeBlock code={sample} title={sampleTitle} />
      </div>
    </section>
  );
}

function ParamTable({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.07]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.07] text-xs text-mist-faint">
            <th className="px-4 py-2.5 font-medium">参数</th>
            <th className="px-4 py-2.5 font-medium">位置 / 类型</th>
            <th className="px-4 py-2.5 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, loc, desc]) => (
            <tr key={name} className="border-b border-white/[0.04] last:border-0">
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-paper">{name}</td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-mist-faint">{loc}</td>
              <td className="px-4 py-2.5 text-[13px] leading-relaxed text-mist-dim">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-14 sm:px-6 lg:px-8">
      <div className="stagger">
        <p className="section-eyebrow">api reference</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-paper sm:text-5xl">
          API 文档
        </h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-mist-dim">
          用同一套转写能力接入你自己的系统：提交链接或文件、订阅实时进度事件、拉取结果并导出字幕。
          所有接口均为 JSON over HTTP，SSE 用于进度推送。
        </p>
      </div>

      <div className="glass mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-mist">Base URL</h2>
          <code className="mt-2 block break-all font-mono text-sm text-mint">{BASE}</code>
        </div>
        <div className="text-xs leading-relaxed text-mist-faint sm:max-w-[300px]">
          演示环境暂未启用鉴权；接入生产时为每个账户分配 Bearer Token，放置在
          <code className="mx-1 rounded bg-black/40 px-1 py-0.5 font-mono text-[11px]">Authorization</code>
          头中即可。
        </div>
      </div>

      <div className="stagger mt-12 space-y-5">
        <Endpoint
          id="submit-links"
          method="POST"
          path={`${BASE}/transcribe/links`}
          title="提交链接转写"
          desc="粘贴一条或多条公开视频链接（支持整段分享文案，自动提取 URL 并去重），每个链接生成一个独立任务并进入转写队列。单次最多 100 条。"
          sampleTitle="curl"
          sample={`curl -X POST ${BASE}/transcribe/links \\
  -H "Content-Type: application/json" \\
  -d '{
    "links": "https://www.bilibili.com/video/BV1xx411c7mD",
    "aiEnhance": true
  }'`}
        >
          <ParamTable
            rows={[
              ['links', 'body · string | string[]', '视频链接，多行文本或字符串数组均可；可粘贴整段分享文案'],
              ['aiEnhance', 'body · boolean', '是否在转写完成后生成 AI 摘要与要点，默认 false'],
            ]}
          />
        </Endpoint>

        <Endpoint
          id="submit-upload"
          method="POST"
          path={`${BASE}/transcribe/upload`}
          title="上传文件转写"
          desc="以 multipart/form-data 上传本地音频 / 视频文件（≤ 100 MB），与链接转写走同一套队列、扣同一套额度。"
          sampleTitle="curl"
          sample={`curl -X POST ${BASE}/transcribe/upload \\
  -F "file=@interview.mp3" \\
  -F "aiEnhance=true"`}
        >
          <ParamTable
            rows={[
              ['file', 'form-data · File', '音频或视频文件，字段名必须为 file'],
              ['aiEnhance', 'form-data · string', '"true" 或 "false"，是否开启 AI 增强'],
            ]}
          />
        </Endpoint>

        <Endpoint
          id="list-tasks"
          method="GET"
          path={`${BASE}/tasks?limit=100&status=completed`}
          title="查询任务列表"
          desc="按创建时间倒序返回任务记录，可按状态过滤；limit 上限 200。"
          sampleTitle="curl"
          sample={`curl "${BASE}/tasks?limit=20"`}
        />

        <Endpoint
          id="get-task"
          method="GET"
          path={`${BASE}/tasks/:id`}
          title="查询单个任务"
          desc="返回任务完整信息；任务完成后包含 transcript（分段文案、字数）与 insights（AI 摘要）。"
          sampleTitle="响应示例（节选）"
          sample={`{
  "task": {
    "id": "t_abc123",
    "platform": "bilibili",
    "platformLabel": "B 站",
    "status": "completed",
    "progress": 100,
    "durationSec": 78.4,
    "transcript": {
      "segments": [{ "start": 0.4, "end": 11.6, "text": "……" }],
      "wordCount": 364
    },
    "insights": {
      "overview": "……",
      "keypoints": ["……"],
      "tags": ["教程", "自动化"]
    }
  }
}`}
        />

        <Endpoint
          id="task-events"
          method="GET"
          path={`${BASE}/tasks/:id/events`}
          title="订阅实时进度（SSE）"
          desc="以 text/event-stream 推送任务进度；每条消息的 data 为 JSON。任务进入终态后服务端会推送最后一条事件并关闭连接；连接期间每 15 秒发送一次 ping 心跳。"
          sampleTitle="curl（-N 关闭缓冲）"
          sample={`curl -N "${BASE}/tasks/t_abc123/events"

# data: {"type":"progress","progress":34.2,"stage":"获取音频流"}
# data: {"type":"progress","progress":78.5,"stage":"语音识别中"}
# data: {"type":"completed","task":{...}}`}
        >
          <div className="mt-4 rounded-lg border border-accent/20 bg-accent/[0.04] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">浏览器端订阅示例</p>
            <div className="mt-3">
              <CodeBlock
                language="javascript"
                title="javascript"
                code={`const es = new EventSource(\`${BASE}/tasks/t_abc123/events\`);
es.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'progress') setProgress(msg.progress);
  if (msg.type === 'completed') es.close();
};`}
              />
            </div>
          </div>
        </Endpoint>

        <Endpoint
          id="export"
          method="GET"
          path={`${BASE}/tasks/:id/export?format=srt`}
          title="导出结果文件"
          desc="导出转写结果：format 支持 txt（含元信息与时间轴）、srt、vtt、md（Markdown 表格）。响应带 Content-Disposition 附件头，可直接下载。任务未完成时返回 409。"
          sampleTitle="curl"
          sample={`curl -OJ "${BASE}/tasks/t_abc123/export?format=srt"`}
        />

        <Endpoint
          id="delete-task"
          method="DELETE"
          path={`${BASE}/tasks/:id`}
          title="删除任务"
          desc="删除任务记录；处理中的任务会被取消。演示环境下删除已完成任务会返还对应额度。"
          sampleTitle="curl"
          sample={`curl -X DELETE "${BASE}/tasks/t_abc123"`}
        />

        <Endpoint
          id="ai-enhance"
          method="POST"
          path={`${BASE}/ai/enhance`}
          title="AI 增强"
          desc="对已完成任务执行 AI 动作：summary 返回摘要与标签、keypoints 返回核心要点、translate 返回目标语言翻译（target 参数，如 en / ja）。任务创建时需开启 aiEnhance。"
          sampleTitle="curl"
          sample={`curl -X POST ${BASE}/ai/enhance \\
  -H "Content-Type: application/json" \\
  -d '{"taskId":"t_abc123","action":"keypoints"}'`}
        >
          <ParamTable
            rows={[
              ['taskId', 'body · string', '已完成任务的 ID'],
              ['action', 'body · string', 'summary | keypoints | translate'],
              ['target', 'body · string', '可选，translate 的目标语言，默认 en'],
            ]}
          />
        </Endpoint>

        <Endpoint
          id="cookies"
          method="PUT"
          path={`${BASE}/cookies`}
          title="配置平台 Cookies"
          desc="上传 Netscape 格式的 cookies.txt（抖音等要求登录态的平台需要，配置一次即可）。PUT 提交文件内容并保存到转写引擎目录，下次任务即刻生效；GET 查询配置状态；DELETE 清除配置。工作台失败引导卡片内置了可视化上传入口。"
          sampleTitle="curl"
          sample={`curl -X PUT ${BASE}/cookies \\
  -H "Content-Type: application/json" \\
  -d '{"content":"# Netscape HTTP Cookie File\\n.douyin.com\\tTRUE\\t/\\tTRUE\\t0\\tsid_tt\\t..."}'`}
        >
          <ParamTable
            rows={[
              ['content', 'body · string', 'cookies.txt 的完整文本内容（Netscape 格式，按 Tab 分隔）'],
            ]}
          />
        </Endpoint>

        <Endpoint
          id="meta"
          method="GET"
          path={`${BASE}/health · /platforms · /pricing · /usage`}
          title="元信息接口"
          desc="health 返回服务与引擎状态；platforms 返回支持的平台清单；pricing 返回套餐定义；usage 返回当前免费额度用量（按已完成任务时长统计）。"
          sampleTitle="curl"
          sample={`curl "${BASE}/usage"
# { "usage": { "freeMinutes": 10, "usedMinutes": 1.3, "remainingMinutes": 8.7 } }`}
        />
      </div>

      <section className="glass mt-12 p-6">
        <h2 className="text-lg font-semibold text-mist">错误约定</h2>
        <p className="mt-2 text-sm text-mist-dim">所有非 2xx 响应体均为 {`{ "error": string }`} 结构。</p>
        <ParamTable
          rows={[
            ['400', 'client error', '参数缺失或链接无法解析'],
            ['402', 'payment required', '免费额度不足，需清理任务或购买额度'],
            ['404', 'not found', '任务不存在或已被删除'],
            ['409', 'conflict', '任务未完成、重复操作或状态不允许'],
            ['500', 'server error', '服务器内部错误，建议稍后重试'],
          ]}
        />
      </section>

      <section id="changelog" className="glass mt-12 p-6">
        <h2 className="text-lg font-semibold text-mist">更新日志</h2>
        <ul className="mt-4 space-y-4 text-sm">
          <li className="flex gap-4">
            <code className="shrink-0 font-mono text-xs text-mint">v1.0</code>
            <p className="leading-relaxed text-mist-dim">
              首发 API：链接 / 文件双通道转写，SSE 实时进度，TXT / SRT / VTT / MD 导出，AI 摘要与要点，
              内置演示引擎（demo-engine），预留 OpenAI Whisper 接入位。
            </p>
          </li>
        </ul>
      </section>

      <div className="mt-14 text-center">
        <Link href="/workspace" className="btn-glow h-12 px-8 text-sm">
          去 工作台 试试 API 的效果
        </Link>
      </div>
    </div>
  );
}
