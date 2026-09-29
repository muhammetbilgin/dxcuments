'use client';

import type { ReactNode } from 'react';

import { MiddleTruncation } from '@/registry/ui/middle-truncation';

interface TruncationRowProps {
  label: string;
  children: ReactNode;
}

function TruncationRow({ label, children }: TruncationRowProps) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="rounded-md border bg-muted/40 px-3 py-2">{children}</div>
    </div>
  );
}

export function MiddleTruncationDemo() {
  return (
    <div className="grid w-full max-w-xs gap-4 text-sm">
      <TruncationRow label="Even split">
        <MiddleTruncation>
          {'projects/design-system/components/middle-truncation.tsx'}
        </MiddleTruncation>
      </TruncationRow>
      <TruncationRow label="Keep the extension">
        <MiddleTruncation end={4}>
          {'quarterly-report-final-v12-approved.pdf'}
        </MiddleTruncation>
      </TruncationRow>
      <TruncationRow label="At least 8 characters at the end">
        <MiddleTruncation minEnd={8}>
          {'api.dx.internal/v2/organizations/acme/invoices/2026-09'}
        </MiddleTruncation>
      </TruncationRow>
    </div>
  );
}
