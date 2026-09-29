'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

import {
  calculateContentPosition,
  getCurrentPhase,
  getTotalDuration,
  SCROLL_CONFIG,
  springConfigs,
  updateMasksBasedOnPosition,
} from './scroll-area-mask-animation';

function MicroInteractionsDemo() {
  const [animationPhase, setAnimationPhase] = useState(0);

  const CURSOR_POSITION = {
    INITIAL: { x: 90, y: 90, scale: 1 },
    HOVER_ON_PILL: { x: 8, y: -64, scale: 1 },
    PRESS_ON_PILL: { x: 8, y: -56, scale: 0.8 },
    END_POSITION_FOR_PILL: { x: 8, y: 32, scale: 0.8 },
    INITIAL_POSITION_FOR_PILL: { x: 8, y: -64, scale: 0.8 },
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 7);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  function getCursorPosition() {
    switch (animationPhase) {
      case 0:
        return CURSOR_POSITION.INITIAL;
      case 1:
        return CURSOR_POSITION.HOVER_ON_PILL;
      case 2:
        return CURSOR_POSITION.PRESS_ON_PILL;
      case 3:
        return CURSOR_POSITION.END_POSITION_FOR_PILL;
      case 4:
      case 5:
        return CURSOR_POSITION.INITIAL_POSITION_FOR_PILL;
      default:
        return CURSOR_POSITION.INITIAL;
    }
  }

  function getThumbScale() {
    if (animationPhase === 1) return 1.1;
    if (animationPhase === 2) return 0.95;
    return 1;
  }

  function getThumbY() {
    if (animationPhase === 3) return 56;
    if (animationPhase === 4 || animationPhase === 5) return -28;
    return -28;
  }

  function getBarOpacity() {
    return animationPhase === 0 || animationPhase === 6 ? 0 : 1;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Micro Interactions</p>
        <p className="text-xs text-muted-foreground">
          Scrollbar fade, hover, and thumb press.
        </p>
      </div>
      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
        <motion.div
          className="absolute h-[180px] w-5 rounded-full bg-background"
          initial={false}
          animate={{ opacity: getBarOpacity() }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative z-10 h-12 w-3 rounded-full bg-primary shadow-lg"
          animate={{ scaleY: getThumbScale(), y: getThumbY() }}
          initial={false}
          transition={{ duration: 1.5, type: 'spring', bounce: 0.25 }}
          style={{ marginTop: '-72px' }}
        />
        <motion.div
          className="pointer-events-none absolute z-20"
          initial={false}
          animate={getCursorPosition()}
          transition={{ duration: 1.55, type: 'spring', bounce: 0.25 }}
          style={{
            transformOrigin: 'center center',
            marginLeft: '-8px',
            marginTop: '-10px',
          }}
        >
          <svg
            width="20"
            height="24"
            viewBox="0 0 30 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 fill-foreground stroke-background"
            aria-hidden="true"
          >
            <path
              d="M3.58385 1.69742C2.57836 0.865603 1.05859 1.58076 1.05859 2.88572V35.6296C1.05859 37.1049 2.93111 37.7381 3.8265 36.5656L12.5863 25.0943C12.6889 24.96 12.8483 24.8812 13.0173 24.8812H27.3245C28.7697 24.8812 29.4211 23.0719 28.3076 22.1507L3.58385 1.69742Z"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

function AdaptiveMaskDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  const contentXTarget = useMotionValue(0);
  const contentYTarget = useMotionValue(0);
  const topMaskTarget = useMotionValue(0);
  const bottomMaskTarget = useMotionValue(1);
  const leftMaskTarget = useMotionValue(0);
  const rightMaskTarget = useMotionValue(1);

  const contentX = useSpring(contentXTarget, springConfigs.content);
  const contentY = useSpring(contentYTarget, springConfigs.content);
  const topMaskOpacity = useSpring(topMaskTarget, springConfigs.masks);
  const bottomMaskOpacity = useSpring(bottomMaskTarget, springConfigs.masks);
  const leftMaskOpacity = useSpring(leftMaskTarget, springConfigs.masks);
  const rightMaskOpacity = useSpring(rightMaskTarget, springConfigs.masks);

  useEffect(() => {
    if (!containerRef.current) return;

    function updateContainerWidth() {
      if (!containerRef.current) return;
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }

    updateContainerWidth();
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let currentStep = 0;
    const totalDuration = getTotalDuration();

    const animationInterval = setInterval(() => {
      currentStep = (currentStep + 1) % totalDuration;
      const { phase, progress } = getCurrentPhase(currentStep);
      if (!phase) return;

      const { x, y } = calculateContentPosition(phase, progress, containerWidth);
      contentXTarget.set(x);
      contentYTarget.set(y);
      updateMasksBasedOnPosition(
        x,
        y,
        topMaskTarget,
        bottomMaskTarget,
        leftMaskTarget,
        rightMaskTarget,
        containerWidth,
      );
    }, SCROLL_CONFIG.timing.fps);

    return () => clearInterval(animationInterval);
  }, [
    containerWidth,
    contentXTarget,
    contentYTarget,
    topMaskTarget,
    bottomMaskTarget,
    leftMaskTarget,
    rightMaskTarget,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Adaptive Mask</p>
        <p className="text-xs text-muted-foreground">
          Edge fades that follow scroll position.
        </p>
      </div>
      <div
        ref={containerRef}
        className="relative h-44 overflow-hidden rounded-xl border bg-muted/40"
      >
        <motion.div
          className="absolute p-4"
          style={{ x: contentX, y: contentY, width: '200%', height: '220%' }}
        >
          <div className="space-y-3">
            {Array.from({ length: 20 }, (_, index) => (
              <div
                key={index}
                className="h-2 flex-1 rounded bg-emerald-400/80 dark:bg-emerald-600"
              />
            ))}
          </div>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent"
          style={{ opacity: topMaskOpacity }}
        />
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent"
          style={{ opacity: bottomMaskOpacity }}
        />
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
          style={{ opacity: leftMaskOpacity }}
        />
        <motion.div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
          style={{ opacity: rightMaskOpacity }}
        />
      </div>
    </div>
  );
}

export function ScrollAreaFeaturesDemo() {
  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <MicroInteractionsDemo />
      <AdaptiveMaskDemo />
    </div>
  );
}
