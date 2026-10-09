# EchoScribe 声稿

> 视频转文字在线工具。粘贴链接或上传音视频，秒级生成带时间轴的完整文案，自动产出摘要、要点与话题标签，支持 TXT / SRT / VTT / Markdown 多格式导出。

对标 [videosays.cn](https://videosays.cn) 并做差异化：**前后端彻底分离**、**本地 Whisper 推理零 API 成本**、**公众号文章视频提取**、**结构化错误引导**。

---

## ✨ 核心能力

- **链接转写**：粘贴整段分享文案自动提取链接，单次支持批量 100 条
- **文件转写**：拖拽上传本地音视频文件
- **公众号文章视频**：直接解析 `mp.weixin.qq.com/s/...` 文章内嵌的视频
- **多平台支持**：抖音、B站、小红书、YouTube、TikTok、快手、公众号、微博、Instagram、X 等 900+ 站点（yt-dlp）
- **实时进度**：SSE 事件流推送阶段与百分比，并内置轮询兜底，弱网环境也能收敛
- **AI 增强**：转写完成后自动产出摘要、编号要点、话题标签（基于真实文本提取，无需 LLM Key）
- **多格式导出**：TXT / SRT / VTT / Markdown
- **逐句复制**：点击单句即复制，自动携带时间戳
- **额度系统**：免费试用分钟数可配置，402 语义拦截
- **结构化错误**：9 类错误码，失败时给出人话解释 + 操作步骤 + 一键重试
- **响应式**：PC 与移动端均适配

---

## 🏗️ 架构

前后端严格分离，两端可独立部署、独立替换。

```
┌─────────────────────┐        REST + SSE        ┌──────────────────────┐
│  Frontend (3000)    │ ◄──────────────────────► │  Backend (4000)      │
│  Next.js 15 + React │   唯一耦合：API 地址     │  Express + TypeScript │
│  19 + TS + Tailwind │   与镜像类型契约         │  队列 / 存储 / SSE    │
└─────────────────────┘                           └──────────┬───────────┘
                                                            │ spawn
                                                            ▼
                                              ┌──────────────────────────┐
                                              │  Python Transcriber      │
                                              │  yt-dlp + faster-whisper │
                                              │  本地推理，零 API 成本    │
                                              └──────────────────────────┘
```

- **前端**：纯展示与交互层，零服务端业务逻辑。仅通过 `NEXT_PUBLIC_API_BASE_URL` 调用后端。后端离线时优雅降级提示。
- **后端**：REST API + SSE 实时推送，对前端零知识，可被任意客户端（App / 小程序）复用。
- **转写引擎**：独立 Python CLI，通过行协议（NDJSON over stderr）与 Node 通信，可替换为任何 ASR 服务。

---

## 📁 目录结构

```
videosays/
├── frontend/                # 纯前端（端口 3000）
│   ├── src/
│   │   ├── app/             # Next.js App Router 页面
│   │   ├── components/      # 工作台、首页区块、通用组件
│   │   └── lib/             # API 客户端、类型、工具
│   └── package.json
└── backend/                 # 纯后端（端口 4000）
    ├── src/
    │   ├── routes/          # transcribe / tasks / meta / ai
    │   ├── providers/       # local / openai / mock 转写引擎
    │   ├── services/        # queue 任务队列 / sse 事件总线
    │   ├── lib/             # 链接解析、字幕生成、平台元数据
    │   ├── store.ts         # JSON 持久化
    │   └── config.ts        # 环境配置
    ├── transcriber/         # Python 转写 CLI
    │   ├── transcriber.py   # yt-dlp 提取 + faster-whisper 识别 + 提取式摘要
    │   └── requirements.txt
    ├── .env.example         # 配置模板
    └── package.json
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20
- Python ≥ 3.10
- Conda 环境（推荐 `Py10`，见用户规则）

### 1. 前端

```powershell
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### 2. 后端

```powershell
cd backend
npm install
cp .env.example .env   # Windows 用 copy .env.example .env
npm run dev            # http://localhost:4000
```

### 3. Python 转写引擎（仅 `PROVIDER=local` 时需要）

```powershell
cd backend
pip install -r transcriber/requirements.txt
```

Whisper 模型无需手动下载——首次转写时自动从 [hf-mirror](https://hf-mirror.com) 拉取并缓存到 `transcriber/models/`（small 模型约 461MB）。

### 4. 联调

打开 http://localhost:3000 ，粘贴任意公开视频链接即可体验。前端默认通过环境变量 `NEXT_PUBLIC_API_BASE_URL` 指向后端（默认 `http://localhost:4000`）。

---

## ⚙️ 配置

### 后端 `backend/.env`

| 变量 | 默认 | 说明 |
|---|---|---|
| `PROVIDER` | `mock` | 转写引擎：`local`（本地 faster-whisper）/ `openai`（Whisper API）/ `mock`（演示数据） |
| `PORT` | `4000` | 服务端口 |
| `CORS_ORIGIN` | `*` | 允许的前端来源 |
| `PYTHON_BIN` | `python` | Python 3.10+ 解释器路径 |
| `WHISPER_MODEL` | `small` | tiny / base / **small** / medium / large-v3 |
| `WHISPER_DEVICE` | `cpu` | `cpu` 或 `cuda`（有 NVIDIA GPU 时提速 5-10×） |
| `WHISPER_COMPUTE` | `int8` | `int8`（CPU 推荐）/ `float16`（GPU 推荐） |
| `OPENAI_API_KEY` | 空 | `PROVIDER=openai` 时必填 |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI 兼容地址 |
| `FREE_MINUTES` | `10` | 免费试用额度（分钟） |

### 前端 `frontend/.env.local`

| 变量 | 默认 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | 后端 API 地址 |

---

## 🔌 转写引擎切换

### 本地推理（推荐，零成本）

`PROVIDER=local`，使用 yt-dlp 下载音频 + faster-whisper 本地识别。首次转写自动下载模型，之后秒级加载。中文内容建议 `small` 及以上模型。

### OpenAI Whisper API

`PROVIDER=openai` 并配置 `OPENAI_API_KEY`。适合有 GPU 需求或希望快速接入的场景，按调用量计费。

### 演示引擎

`PROVIDER=mock`，返回模板文案，零依赖，用于前端联调或演示。

> 三个引擎实现同一 `TranscriptionProvider` 接口（见 `backend/src/providers/provider.ts`），业务代码无需改动即可切换。

---

## 📺 平台支持说明

| 平台 | 匿名直连 | 备注 |
|---|---|---|
| B 站、YouTube、TikTok、快手、微博等 | ✅ | yt-dlp 直接支持 |
| 微信公众号文章视频 | ✅ | 专用提取器（直传视频可解析） |
| 抖音 | ⚠️ 需 cookies.txt | 抖音反爬要求登录态，一次性配置即可 |
| 微信视频号 | ❌ | 仅能在微信客户端内播放，服务端无法取流 |
| 公众号内嵌腾讯视频 | ❌ | 受腾讯视频版权保护 |

### 抖音 cookies 配置（一次性）

抖音要求登录态才能取流，配置一次即可长期使用，无需登录账号：

1. 浏览器安装扩展 **Get cookies.txt LOCALLY**
2. 访问 `douyin.com`
3. 导出 `cookies.txt`，放到 `backend/transcriber/cookies.txt`

---

## 📡 API 概览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/transcribe/links` | 链接转写（批量） |
| POST | `/api/v1/transcribe/upload` | 文件上传转写 |
| GET | `/api/v1/tasks?limit=` | 任务列表 |
| GET | `/api/v1/tasks/:id` | 任务详情 |
| DELETE | `/api/v1/tasks/:id` | 删除任务（释放额度） |
| GET | `/api/v1/tasks/:id/events` | SSE 实时进度 |
| GET | `/api/v1/usage` | 额度使用情况 |
| GET | `/api/v1/health` | 引擎健康状态 |
| GET | `/api/v1/export/:id/:format` | 导出 TXT / SRT / VTT / MD |

详见站内 `/docs` 页面（含可复制的 curl 示例）。

### 错误码

失败任务会携带 `errorCode`，前端据此渲染场景化引导：

| 错误码 | 含义 |
|---|---|
| `cookies_required` | 需配置抖音等平台的 cookies |
| `no_speech` | 视频无人声或人声过轻 |
| `video_unavailable` | 链接打不开或视频不可访问 |
| `login_required` | 视频需要登录 |
| `duration_limit` | 时长超出 30 分钟上限 |
| `download_failed` | 视频下载中断（链接可能过期） |
| `embed_unsupported` | 公众号内嵌视频号/腾讯视频，无法提取 |
| `media_unreadable` | 上传文件损坏或格式不支持 |
| `engine_failed` | 引擎内部错误 |

---

## 🛠️ 开发脚本

```powershell
# 前端
cd frontend
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run typecheck    # 类型检查

# 后端
cd backend
npm run dev          # 开发服务器（tsx watch 热重载）
npm run build        # 编译
npm run typecheck    # 类型检查
```

---

## 📝 部署建议

- **前端**：`npm run build` 后部署到 Vercel / Netlify / 任意静态托管，设置 `NEXT_PUBLIC_API_BASE_URL` 为生产后端地址。
- **后端**：`npm run build && npm start`，部署到支持 Node 的服务器。建议配置 `WHISPER_DEVICE=cuda` 以使用 GPU 加速。
- **数据持久化**：任务存储在 `backend/data/tasks.json`，生产环境可替换为数据库。
- **模型缓存**：`transcriber/models/` 目录需持久化，避免每次冷启动重新下载。

---

## ⚖️ 版权说明

本工具仅供个人学习与合法用途使用。请遵守目标平台的服务条款，仅转写你有权访问的公开内容。识别结果的版权归原视频作者所有。

---

## 📄 License

MIT
