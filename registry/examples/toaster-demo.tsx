'use client';

import { sileo } from 'sileo';

import { toast } from '@/registry/lib/toast';

function DemoButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ToasterDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <DemoButton
        onClick={() =>
          toast.success('Saved', {
            description: 'Your changes are live.',
          })
        }
      >
        Success
      </DemoButton>
      <DemoButton
        onClick={() =>
          toast.error('Failed', {
            description: 'Something went wrong.',
          })
        }
      >
        Error
      </DemoButton>
      <DemoButton
        onClick={() =>
          toast.warning('Careful', {
            description: 'This action cannot be undone.',
          })
        }
      >
        Warning
      </DemoButton>
      <DemoButton
        onClick={() =>
          toast.info('Tip', {
            description: 'Sounds via Cuelume, UI via Sileo.',
          })
        }
      >
        Info
      </DemoButton>
    </div>
  );
}

export function ToasterPromiseDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <DemoButton
        onClick={() => {
          void toast.promise(
            new Promise<{ id: string }>((resolve) => {
              window.setTimeout(() => resolve({ id: '42' }), 1600);
            }),
            {
              loading: 'Saving…',
              success: (data) => `Saved #${data.id}`,
              error: 'Could not save',
            },
          );
        }}
      >
        Promise success
      </DemoButton>
      <DemoButton
        onClick={() => {
          void toast.promise(
            new Promise((_, reject) => {
              window.setTimeout(() => reject(new Error('Network')), 1600);
            }),
            {
              loading: 'Uploading…',
              success: 'Uploaded',
              error: (err) =>
                err instanceof Error ? err.message : 'Upload failed',
            },
          );
        }}
      >
        Promise error
      </DemoButton>
    </div>
  );
}

export function ToasterCustomDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <DemoButton
        onClick={() => {
          sileo.success({
            title: 'Brand toast',
            description: 'Custom fill + rounded corners.',
            fill: '#111827',
            roundness: 22,
            styles: {
              title: 'text-white font-semibold',
              description: 'text-zinc-300',
              badge: 'bg-emerald-500 text-white',
            },
          });
        }}
      >
        Dark fill
      </DemoButton>
      <DemoButton
        onClick={() => {
          sileo.info({
            title: 'Soft pearl',
            description: 'Light fill with muted type.',
            fill: '#F4F4F5',
            roundness: 18,
            styles: {
              title: 'text-zinc-900 font-medium',
              description: 'text-zinc-500',
              badge: 'bg-sky-500 text-white',
            },
          });
        }}
      >
        Soft fill
      </DemoButton>
      <DemoButton
        onClick={() => {
          sileo.action({
            title: 'Invite sent',
            description: 'Alex can join your workspace now.',
            fill: '#0F172A',
            roundness: 20,
            styles: {
              title: 'text-white',
              description: 'text-slate-300',
              button: 'bg-white text-slate-900 hover:bg-slate-100',
            },
            button: {
              title: 'Undo',
              onClick: () => toast.info('Invite cancelled'),
            },
          });
        }}
      >
        Action + style
      </DemoButton>
    </div>
  );
}
