'use client';

import FloatingDockMenu from '@/registry/ui/floating-dock-menu';

export function FloatingDockMenuDemo() {
  return (
    <div className="relative flex min-h-[22rem] w-full items-end justify-center pb-4">
      <FloatingDockMenu isFixed={false} />
    </div>
  );
}
