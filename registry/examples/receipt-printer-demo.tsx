'use client';

import ReceiptPrinter from '@/registry/ui/receipt-printer';

export function ReceiptPrinterDemo() {
  return (
    <div className="flex min-h-[28rem] w-full items-start justify-center pt-4">
      <ReceiptPrinter />
    </div>
  );
}
