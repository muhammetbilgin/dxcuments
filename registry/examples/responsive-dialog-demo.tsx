'use client';

import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/registry/ui/responsive-dialog';

export function ResponsiveDialogDemo() {
  return (
    <ResponsiveDialog
      title="Edit profile"
      description="Dialog on desktop, drawer on mobile."
      trigger={<Button variant="outline">Open dialog</Button>}
    >
      <div className="space-y-3 py-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Display name</span>
          <input
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="Alex Rivera"
            aria-label="Display name"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Bio</span>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="Building the DX design system."
            aria-label="Bio"
          />
        </label>
        <Button className="w-full sm:w-auto">Save changes</Button>
      </div>
    </ResponsiveDialog>
  );
}
