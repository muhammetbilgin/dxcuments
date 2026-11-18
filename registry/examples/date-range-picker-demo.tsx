'use client';

import { useRef } from 'react';

import DateRangePicker from '@/registry/ui/date-range-picker';

export function DateRangePickerDemo() {
  const boundaryRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boundaryRef}
      className="relative flex min-h-[32rem] w-full items-start justify-center pt-2"
    >
      <DateRangePicker boundary={() => boundaryRef.current} />
    </div>
  );
}
