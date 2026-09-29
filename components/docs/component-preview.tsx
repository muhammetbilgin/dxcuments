'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ComponentPreviewProps {
  children: ReactNode;
  className?: string;
  align?: 'center' | 'start' | 'end';
}

export function ComponentPreview({
  children,
  className,
  align = 'center',
}: ComponentPreviewProps) {
  return (
    <div
      className={cn(
        'not-prose my-6 overflow-hidden rounded-xl border border-fd-border',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-h-[160px] bg-background p-8',
          align === 'center' && 'items-center justify-center',
          align === 'start' && 'items-start justify-start',
          align === 'end' && 'items-end justify-end',
        )}
      >
        {children}
      </div>
    </div>
  );
}
