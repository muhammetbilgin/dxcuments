import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import registry from '@/registry.json';

interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

const NOTES: Record<string, string> = {
  'scroll-area': 'Also install use-touch-primary and utils from this registry.',
  toaster: 'Powered by Sileo + Cuelume. Keep toaster.css next to toaster.tsx and use lib/toast.ts for basic toasts.',
  'empty-state':
    'Requires shadcn button and lucide-react in your project.',
  'responsive-dialog':
    'Requires use-is-desktop plus shadcn button, dialog, and drawer.',
  'use-debounce': 'Also install use-debounce-fn and its dependencies.',
  'use-debounce-fn': 'Depends on es-toolkit, use-latest, and use-unmount.',
  'use-latest': 'Also install use-isomorphic-layout-effect.',
  'use-title': 'Also install use-isomorphic-layout-effect.',
  'use-unmount': 'Also install use-latest.',
  'use-isomorphic-layout-effect': 'Also copies lib/isBrowser.ts.',
};

type RegistryItemName = (typeof registry.items)[number]['name'];

interface ManualInstallProps {
  name: RegistryItemName;
}

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function langForPath(path: string) {
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  return 'ts';
}

export function ManualInstall({ name }: ManualInstallProps) {
  const item = (registry.items as RegistryItem[]).find(
    (entry) => entry.name === name,
  );

  if (!item) {
    throw new Error(`Unknown registry item: ${name}`);
  }

  const title = item.title ?? item.name;
  const dependencyCommand =
    item.dependencies && item.dependencies.length > 0
      ? `pnpm add ${item.dependencies.join(' ')}`
      : null;
  const note = NOTES[name];
  const registryDeps =
    item.registryDependencies?.filter((dep) => !dep.startsWith('http')) ?? [];

  return (
    <Accordions>
      {dependencyCommand ? (
        <Accordion title="Install dependencies" id={`${name}-deps`}>
          <p className="mb-3 text-sm text-fd-muted-foreground">
            Install the packages required by {title}.
          </p>
          <DynamicCodeBlock lang="bash" code={dependencyCommand} />
        </Accordion>
      ) : null}

      {registryDeps.length > 0 ? (
        <Accordion title="Registry dependencies" id={`${name}-registry-deps`}>
          <p className="mb-3 text-sm text-fd-muted-foreground">
            Install these DX registry items first (or together via CLI).
          </p>
          <DynamicCodeBlock
            lang="bash"
            code={`pnpm dlx shadcn@latest add ${registryDeps.map((dep) => `@dx/${dep}`).join(' ')}`}
          />
        </Accordion>
      ) : null}

      {note ? (
        <Accordion title="Notes" id={`${name}-notes`}>
          <p className="text-sm text-fd-muted-foreground">{note}</p>
        </Accordion>
      ) : null}

      {item.files.map((file) => {
        const target = file.target ?? file.path;
        const label = target.split('/').pop() ?? target;

        return (
          <Accordion
            key={file.path}
            title={`Copy ${label}`}
            id={`${name}-${file.path}`}
          >
            <p className="mb-3 text-sm text-fd-muted-foreground">
              Create <code>{target}</code> and paste the source.
            </p>
            <DynamicCodeBlock
              lang={langForPath(file.path)}
              code={readSource(file.path)}
            />
          </Accordion>
        );
      })}
    </Accordions>
  );
}
