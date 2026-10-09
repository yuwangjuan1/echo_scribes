import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: {
    default: 'EchoScribe 声稿 — 把视频读成文字',
    template: '%s · EchoScribe 声稿',
  },
  description:
    '粘贴抖音、B站、小红书、公众号文章、YouTube 等公开视频链接，10 秒生成带时间轴的完整文案，自动产出 AI 摘要与要点，支持 TXT / SRT / VTT / Markdown 导出。',
  keywords: ['视频转文字', '视频文案提取', '字幕提取', '视频转写', 'AI 摘要', 'EchoScribe', '声稿'],
};

export const viewport: Viewport = {
  themeColor: '#101012',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="atmosphere" aria-hidden />
        <div className="noise-overlay" aria-hidden />
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
