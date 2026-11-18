'use client';

import { JsonExplorer, type JsonValue } from '@/registry/ui/json-explorer';

const sample: JsonValue = {
  id: 'ord_9f2a',
  status: 'paid',
  total: 128.5,
  refunded: false,
  customer: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    tags: ['vip', 'beta'],
  },
  items: [
    { sku: 'DX-01', qty: 2, price: 49 },
    { sku: 'DX-14', qty: 1, price: 30.5 },
  ],
  meta: null,
};

export function JsonExplorerDemo() {
  return (
    <div className="w-full max-w-xl">
      <JsonExplorer data={sample} defaultDepth={1} title="Order" />
    </div>
  );
}
