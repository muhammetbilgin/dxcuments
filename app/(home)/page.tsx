import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm font-medium tracking-wide text-fd-muted-foreground uppercase">
        Documentation
      </p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight">DX</h1>
      <p className="mb-8 max-w-lg text-fd-muted-foreground">
        Platform docs for DX UI, Gateway, and Evex — with a shadcn registry for
        installable design-system components.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs/ui"
          className="inline-flex h-10 items-center justify-center rounded-md bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          DX UI
        </Link>
        <Link
          href="/docs/gateway"
          className="inline-flex h-10 items-center justify-center rounded-md border border-fd-border px-5 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          DX Gateway
        </Link>
        <Link
          href="/docs/evex"
          className="inline-flex h-10 items-center justify-center rounded-md border border-fd-border px-5 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          DX Evex
        </Link>
      </div>
    </div>
  );
}
