'use client';

import { FilePlus2, Inbox, Search } from 'lucide-react';

import { EmptyState } from '@/registry/ui/empty-state';

export function EmptyStateDemo() {
  return (
    <EmptyState
      className="max-w-md"
      title="No results"
      description="Try a different filter or create something new."
      icons={[Inbox, Search, FilePlus2]}
      action={{ onClick: () => undefined }}
      actionLabel="Clear filters"
    />
  );
}
