import Link from 'next/link';
import { Github, Mail } from 'lucide-react';
import { Brand } from './navbar';

const COLS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: '产品',
    links: [
      { label: '链接转写', href: '/workspace' },
      { label: '文件转写', href: '/workspace?tab=upload' },
      { label: 'API 服务', href: '/docs' },
      { label: '更新日志', href: '/docs#changelog' },
    ],
  },
  {
    title: '使用场景',
    links: [
      { label: '口播文案复盘', href: '/#features' },
      { label: '字幕草稿制作', href: '/#features' },
      { label: '课程笔记整理', href: '/#features' },
      { label: '竞品内容拆解', href: '/#features' },
    ],
  },
  {
    title: '支持',
    links: [
      { label: '定价与额度', href: '/pricing' },
      { label: '常见问题', href: '/#faq' },
      { label: '使用流程', href: '/#workflow' },
      { label: 'API 文档', href: '/docs' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-soft/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Brand />
            <p className="mt-5 text-sm leading-relaxed text-mist-dim">
              把视频里说的每句话，变成可编辑、可导出、可继续创作的文字素材。
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost h-9 w-9"
                aria-label="GitHub 仓库"
              >
                <Github className="h-4 w-4" />
              </a>
              <a href="mailto:hello@echoscribe.cn" className="btn-ghost h-9 w-9" aria-label="联系邮箱">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-xs uppercase tracking-[0.28em] text-mist-faint">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-mist-dim transition-colors hover:text-paper">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-mist-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EchoScribe 声稿 · 本站为演示项目，转写内容由演示引擎生成</p>
          <p className="font-mono tracking-wider">MADE WITH SOUND &amp; TEXT · 不订阅 · 按需购买</p>
        </div>
      </div>
    </footer>
  );
}
