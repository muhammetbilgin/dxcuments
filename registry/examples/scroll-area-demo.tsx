'use client';

import { ScrollArea } from '@/registry/ui/scroll-area';

const tags = Array.from({ length: 50 }).map(
  (_, index) => `v1.2.0-beta.${50 - index}`,
);

export function ScrollAreaVerticalDemo() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div
            key={tag}
            className="border-b border-border py-2 text-sm text-muted-foreground last:border-0"
          >
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

const photos = [
  'Photo by Ornella Binni',
  'Photo by Tom Byrom',
  'Photo by Vladimir Malyavko',
  'Photo by Roberto Nickson',
  'Photo by Alexander Andrews',
];

export function ScrollAreaHorizontalDemo() {
  return (
    <ScrollArea className="w-full max-w-md whitespace-nowrap rounded-md border">
      <div className="flex w-max gap-4 p-4">
        {photos.map((caption) => (
          <figure key={caption} className="shrink-0">
            <div className="h-36 w-52 rounded-md bg-muted" />
            <figcaption className="pt-2 text-xs text-muted-foreground">
              {caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  );
}
