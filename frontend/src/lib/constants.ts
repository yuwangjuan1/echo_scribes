import type { PricingPlan } from './types';

export interface PlatformShowcase {
  id: string;
  label: string;
  sample: string;
  color: string;
}

export const PLATFORMS: PlatformShowcase[] = [
  { id: 'douyin', label: '抖音', sample: 'v.douyin.com', color: '#FE2C55' },
  { id: 'xiaohongshu', label: '小红书', sample: 'xhslink.com', color: '#FF2442' },
  { id: 'bilibili', label: 'B 站', sample: 'b23.tv', color: '#00A1D6' },
  { id: 'youtube', label: 'YouTube', sample: 'youtu.be', color: '#FF3D3D' },
  { id: 'tiktok', label: 'TikTok', sample: 'vm.tiktok.com', color: '#25F4EE' },
  { id: 'kuaishou', label: '快手', sample: 'v.kuaishou.com', color: '#FE3666' },
  { id: 'wechat', label: '公众号', sample: 'mp.weixin.qq.com', color: '#07C160' },
  { id: 'channels', label: '视频号', sample: 'channels.weixin', color: '#FA9D3B' },
  { id: 'instagram', label: 'Instagram', sample: 'instagram.com', color: '#E1306C' },
  { id: 'x', label: 'X / Twitter', sample: 'x.com', color: '#8C8C8C' },
  { id: 'weibo', label: '微博', sample: 'weibo.com', color: '#E6162D' },
];

export interface FeatureShowcase {
  icon: string;
  title: string;
  desc: string;
}

export const FEATURES: FeatureShowcase[] = [
  {
    icon: 'Link2',
    title: '链接直达，不用下载',
    desc: '公开链接即贴即转，整段分享文案直接粘贴也能自动提取链接，无需下载或上传原视频。',
  },
  {
    icon: 'Sparkles',
    title: 'AI 摘要引擎',
    desc: '转写完成自动产出内容摘要、核心要点与话题标签，内容复盘和选题挖掘一步到位。',
  },
  {
    icon: 'ListOrdered',
    title: '精确时间轴',
    desc: '逐句标注起止时间，点击单句即可复制，剪辑对轴不用反复拖动进度条。',
  },
  {
    icon: 'Layers',
    title: '批量任务队列',
    desc: '一次最多提交 100 条链接，排队状态与处理进度实时推送，处理完成自动提醒。',
  },
  {
    icon: 'FileUp',
    title: '本地文件转写',
    desc: 'MP3 / M4A / WAV / MP4 等常见格式直接上传，同样产出带时间轴的完整文案。',
  },
  {
    icon: 'FileDown',
    title: '多格式导出',
    desc: 'TXT / SRT / VTT / Markdown 一键导出，笔记归档、字幕制作、内容库沉淀各取所需。',
  },
];

export const WORKFLOW_STEPS = [
  {
    no: '01',
    title: '粘贴公开链接',
    desc: '复制分享文案或视频链接，粘贴进输入框，支持一次批量提交多条，每行一条自动去重。',
  },
  {
    no: '02',
    title: 'AI 语音转写',
    desc: '系统解析视频中的语音内容，逐句转写并保留精确时间轴，处理进度通过实时事件推送。',
  },
  {
    no: '03',
    title: '复制或导出',
    desc: '一键复制完整文案，或导出 TXT / SRT / VTT / Markdown，配合 AI 摘要继续你的创作。',
  },
];

export const AI_ACTIONS = [
  {
    title: '内容摘要',
    desc: '一段话讲清整个视频在讲什么，快速判断值不值得精读。',
  },
  {
    title: '核心要点',
    desc: '自动提炼 3-5 条关键论点与案例，直接变成你的笔记。',
  },
  {
    title: '话题标签',
    desc: '按内容生成垂直领域标签，方便归档、检索和二次分发。',
  },
  {
    title: '多语翻译',
    desc: '面向出海与跨语种团队，转写结果一键翻译目标语言。',
  },
];

export const FAQS = [
  {
    q: '需要下载或上传视频吗？',
    a: '不需要。粘贴公开可访问的视频链接即可；同时也支持直接上传本地音视频文件转写，两种方式任选。',
  },
  {
    q: '提取的是视频描述，还是视频里的语音？',
    a: '是视频里的人声语音。即使原视频没有现成字幕，也能通过语音识别逐句生成文字并保留时间轴。',
  },
  {
    q: '可以免费试用吗？',
    a: '可以。新用户免费获得 10 分钟转写额度，注册即用、无需付款；额度用完后按需购买分钟数，不订阅、不自动续费。',
  },
  {
    q: '支持哪些平台的链接？',
    a: '抖音、B 站、小红书、YouTube、TikTok、快手、微信公众号文章视频、视频号、Instagram、X、微博等公开视频链接；实际可用性取决于源视频能否被公开访问。',
  },
  {
    q: '能导出哪些格式？',
    a: '支持 TXT、SRT、VTT、Markdown 四种格式，均保留时间轴结构；完整文案也可以直接一键复制。',
  },
  {
    q: '转写准确率怎么样？',
    a: '清晰人声、音质良好的视频准确率最高；背景音乐过大、多人同时讲话或口音较重会影响质量。发布或引用前，建议对姓名、数字和专业词做人工校对。',
  },
  {
    q: '有 API 可以接入自己的系统吗？',
    a: '有。REST API 与 SSE 实时进度事件均已开放，支持提交链接、查询任务、导出字幕等完整能力，详见 API 文档页。',
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'trial',
    name: '免费试用',
    priceCny: 0,
    minutes: 10,
    unit: '分钟',
    tagline: '注册即得，无需绑卡，跑通全流程',
    features: [
      '10 分钟转写额度',
      'AI 摘要与要点提取',
      'TXT / SRT / VTT / MD 导出',
      '单次最多 100 条链接',
      '任务历史记录',
    ],
  },
  {
    id: 'starter',
    name: '基础包',
    priceCny: 19,
    minutes: 120,
    unit: '分钟',
    tagline: '个人创作者的日常生产力',
    features: [
      '120 分钟转写额度',
      'AI 摘要 / 要点 / 标签',
      '批量任务与优先队列',
      '上传本地音视频转写',
      '30 天任务保存',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: '专业包',
    priceCny: 79,
    minutes: 600,
    unit: '分钟',
    tagline: '团队与内容矩阵的弹药库',
    features: [
      '600 分钟转写额度',
      '优先转写通道',
      'API 接入（10 QPS）',
      '批量导出与 Webhook 回调',
      '90 天任务保存',
    ],
  },
  {
    id: 'business',
    name: '企业定制',
    priceCny: -1,
    minutes: -1,
    unit: '',
    tagline: '私有化部署与专属 SLA',
    features: [
      '分钟数与并发按需定制',
      '私有化 ASR 引擎接入',
      '专属域名与品牌定制',
      'SLA 保障与专属客户成功',
      '私有化部署支持',
    ],
  },
];

export const HERO_STATS = [
  { value: '12s', label: '平均出稿速度' },
  { value: '100', label: '单次批量上限' },
  { value: '10+', label: '支持平台' },
  { value: '4 种', label: '导出格式' },
];
