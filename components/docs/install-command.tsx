'use client';

import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

import { cn } from '@/lib/utils';

const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

type PackageManager = (typeof packageManagers)[number];

interface InstallCommandProps {
  name: string;
  namespace?: string;
  className?: string;
}

function getCommand(manager: PackageManager, packageName: string) {
  switch (manager) {
    case 'pnpm':
      return `pnpm dlx shadcn@latest add ${packageName}`;
    case 'yarn':
      return `yarn dlx shadcn@latest add ${packageName}`;
    case 'bun':
      return `bunx --bun shadcn@latest add ${packageName}`;
    default:
      return `npx shadcn@latest add ${packageName}`;
  }
}

export function InstallCommand({
  name,
  namespace = '@dx',
  className,
}: InstallCommandProps) {
  const packageName = `${namespace}/${name}`;
  const [manager, setManager] = useState<PackageManager>('pnpm');
  const [isCopied, setIsCopied] = useState(false);
  const command = getCommand(manager, packageName);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        'not-prose my-4 overflow-hidden rounded-xl border border-fd-border',
        className,
      )}
    >
      <div
        className="flex gap-1 border-b border-fd-border bg-fd-muted/30 px-2"
        role="tablist"
        aria-label="Package manager"
      >
        {packageManagers.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={manager === item}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              manager === item
                ? 'border-b-2 border-fd-foreground text-fd-foreground'
                : 'text-fd-muted-foreground hover:text-fd-foreground',
            )}
            onClick={() => setManager(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 bg-fd-secondary/40 px-4 py-3">
        <Terminal
          className="size-4 shrink-0 text-fd-muted-foreground"
          aria-hidden="true"
        />
        <code className="flex-1 overflow-x-auto text-sm">{command}</code>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
          onClick={handleCopy}
          aria-label={
            isCopied ? 'Copied install command' : 'Copy install command'
          }
        >
          {isCopied ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
