'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useControllableState } from '@/registry/hooks/use-controllable-state';

interface CounterProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
}

function Counter({ value, defaultValue = 0, onValueChange }: CounterProps) {
  const [count, setCount] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'Counter',
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Decrease"
        onClick={() => setCount((current) => current - 1)}
      >
        −
      </Button>
      <span className="w-8 text-center font-mono text-sm tabular-nums">
        {count}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Increase"
        onClick={() => setCount((current) => current + 1)}
      >
        +
      </Button>
    </div>
  );
}

export function UseControllableStateDemo() {
  const [controlled, setControlled] = useState(4);

  return (
    <div className="grid w-full max-w-sm gap-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-0.5">
          <p className="font-medium">Uncontrolled</p>
          <p className="text-muted-foreground">Starts at 2 and keeps its own state.</p>
        </div>
        <Counter defaultValue={2} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-0.5">
          <p className="font-medium">Controlled</p>
          <p className="text-muted-foreground">Parent value is {controlled}.</p>
        </div>
        <Counter value={controlled} onValueChange={setControlled} />
      </div>
    </div>
  );
}
