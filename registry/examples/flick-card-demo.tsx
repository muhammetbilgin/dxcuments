'use client';

import CardFlip from '@/registry/ui/flick-card';

export function FlickCardDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <CardFlip />
      <CardFlip axis="x" label="Portrait ticket" />
    </div>
  );
}
