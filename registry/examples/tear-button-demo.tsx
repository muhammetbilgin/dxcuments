'use client';

import TearButton from '@/registry/ui/tear-button';

export function TearButtonDemo() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <TearButton
        label="Delete workspace"
        description="Tear off the stub to confirm"
        onConfirm={() => undefined}
      />
      <TearButton
        tone="muted"
        label="Archive project"
        description="Tear to archive"
        stubLabel="Archive"
        confirmedLabel="Archived"
        confirmedDescription="Moved to archive"
        onConfirm={() => undefined}
      />
    </div>
  );
}
