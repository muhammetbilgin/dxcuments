import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

import { ComponentPreview } from '@/components/docs/component-preview';
import { InstallCommand } from '@/components/docs/install-command';
import { ManualInstall } from '@/components/docs/manual-install';
import { DateRangePickerDemo } from '@/registry/examples/date-range-picker-demo';
import { DiagonalMarqueeCarouselDemo } from '@/registry/examples/diogonal-marquee-carousel-demo';
import { DynamicDockDemo } from '@/registry/examples/dynamic-dock-demo';
import { ElasticSliderDemo } from '@/registry/examples/elastic-slider-demo';
import { EmptyStateDemo } from '@/registry/examples/empty-state-demo';
import { FloatingDockMenuDemo } from '@/registry/examples/floating-dock-menu-demo';
import { JsonExplorerDemo } from '@/registry/examples/json-explorer-demo';
import { MiddleTruncationDemo } from '@/registry/examples/middle-truncation-demo';
import { ReceiptPrinterDemo } from '@/registry/examples/receipt-printer-demo';
import { ResponsiveDialogDemo } from '@/registry/examples/responsive-dialog-demo';
import {
  ScrollAreaHorizontalDemo,
  ScrollAreaVerticalDemo,
} from '@/registry/examples/scroll-area-demo';
import { ScrollAreaFeaturesDemo } from '@/registry/examples/scroll-area-features';
import { TearButtonDemo } from '@/registry/examples/tear-button-demo';
import {
  ToasterCustomDemo,
  ToasterDemo,
  ToasterPromiseDemo,
} from '@/registry/examples/toaster-demo';
import { UseControllableStateDemo } from '@/registry/examples/use-controllable-state-demo';

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
    ElasticSliderDemo,
    EmptyStateDemo,
    TearButtonDemo,
    DynamicDockDemo,
    FloatingDockMenuDemo,
    DateRangePickerDemo,
    JsonExplorerDemo,
    DiagonalMarqueeCarouselDemo,
    ReceiptPrinterDemo,
    MiddleTruncationDemo,
    ResponsiveDialogDemo,
    UseControllableStateDemo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
