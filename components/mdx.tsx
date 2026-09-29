import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

import { ComponentPreview } from '@/components/docs/component-preview';
import { InstallCommand } from '@/components/docs/install-command';
import { ManualInstall } from '@/components/docs/manual-install';
import { EmptyStateDemo } from '@/registry/examples/empty-state-demo';
import { ResponsiveDialogDemo } from '@/registry/examples/responsive-dialog-demo';
import {
  ScrollAreaHorizontalDemo,
  ScrollAreaVerticalDemo,
} from '@/registry/examples/scroll-area-demo';
import { ScrollAreaFeaturesDemo } from '@/registry/examples/scroll-area-features';
import {
  ToasterCustomDemo,
  ToasterDemo,
  ToasterPromiseDemo,
} from '@/registry/examples/toaster-demo';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Tab,
    Tabs,
    ComponentPreview,
    InstallCommand,
    ManualInstall,
    ScrollAreaVerticalDemo,
    ScrollAreaHorizontalDemo,
    ScrollAreaFeaturesDemo,
    ToasterDemo,
    ToasterPromiseDemo,
    ToasterCustomDemo,
    EmptyStateDemo,
    ResponsiveDialogDemo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
