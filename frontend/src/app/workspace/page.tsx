import type { Metadata } from 'next';
import { Suspense } from 'react';
import WorkspaceInner from '@/components/workspace/workspace-inner';

export const metadata: Metadata = {
  title: '转写工作台',
  description: '粘贴视频链接或上传音视频文件，实时查看转写进度，复制文案、查看 AI 摘要并导出 TXT / SRT / VTT / Markdown。',
};

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="glass h-96 animate-pulse" />
        </div>
      }
    >
      <WorkspaceInner />
    </Suspense>
  );
}
