'use client';

import { useState } from 'react';

import { ElasticSlider } from '@/registry/ui/elastic-slider';

export function ElasticSliderDemo() {
  const [volume, setVolume] = useState(72);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <ElasticSlider
        label="Volume"
        min={0}
        max={100}
        step={1}
        value={volume}
        onValueChange={setVolume}
        formatValue={(value) => `${Math.round(value)}%`}
      />
      <ElasticSlider
        label="Brightness"
        min={0}
        max={1}
        step={0.01}
        defaultValue={0.64}
      />
      <ElasticSlider label="Quality" min={1} max={5} step={1} defaultValue={3} />
    </div>
  );
}
