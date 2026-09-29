import type { MotionValue } from 'motion/react';

export const SCROLL_CONFIG = {
  vertical: { max: 105, hold: 105, return: 40 },
  horizontal: { max: 370, curve: 10 },
  timing: { cycle: 280, fps: 16 },
} as const;

export interface AnimationPhase {
  name: string;
  duration: number;
}

export const animationPhases: AnimationPhase[] = [
  { name: 'scrollDown', duration: 50 },
  { name: 'holdBottom', duration: 10 },
  { name: 'scrollUpPartial', duration: 20 },
  { name: 'scrollRight', duration: 50 },
  { name: 'holdRight', duration: 10 },
  { name: 'scrollLeft', duration: 50 },
  { name: 'holdLeft', duration: 10 },
  { name: 'scrollUp', duration: 40 },
  { name: 'reset', duration: 40 },
];

export const springConfigs = {
  content: { stiffness: 180, damping: 25, mass: 0.6 },
  masks: { stiffness: 400, damping: 30, mass: 0.3 },
} as const;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 2.5);
}

function curvedEasing(t: number) {
  const spring = 1 - Math.pow(1 - t, 1.8);
  return spring * (1 + 0.15 * Math.sin(t * Math.PI));
}

function getContentBounds(containerWidth: number = SCROLL_CONFIG.horizontal.max) {
  return {
    top: 0,
    bottom: -SCROLL_CONFIG.vertical.max,
    left: 0,
    right: -containerWidth,
  };
}

export function updateMasksBasedOnPosition(
  x: number,
  y: number,
  topMaskTarget: MotionValue<number>,
  bottomMaskTarget: MotionValue<number>,
  leftMaskTarget: MotionValue<number>,
  rightMaskTarget: MotionValue<number>,
  containerWidth: number = SCROLL_CONFIG.horizontal.max,
) {
  const threshold = 2;
  const contentBounds = getContentBounds(containerWidth);

  topMaskTarget.set(y < contentBounds.top - threshold ? 1 : 0);
  bottomMaskTarget.set(y > contentBounds.bottom + threshold ? 1 : 0);
  leftMaskTarget.set(x < contentBounds.left - threshold ? 1 : 0);
  rightMaskTarget.set(x > contentBounds.right + threshold ? 1 : 0);
}

export function calculateContentPosition(
  currentPhase: AnimationPhase,
  phaseProgress: number,
  containerWidth: number = SCROLL_CONFIG.horizontal.max,
): { x: number; y: number } {
  const easeProgress = easeOut(phaseProgress);
  let targetX = 0;
  let targetY = 0;

  switch (currentPhase.name) {
    case 'scrollDown':
      targetY = -easeProgress * SCROLL_CONFIG.vertical.max;
      break;
    case 'holdBottom':
      targetY = -SCROLL_CONFIG.vertical.hold;
      break;
    case 'scrollUpPartial':
      targetY = -SCROLL_CONFIG.vertical.return;
      break;
    case 'scrollRight': {
      const curvedProgress = curvedEasing(phaseProgress);
      const verticalCurve =
        Math.sin(phaseProgress * Math.PI) * SCROLL_CONFIG.horizontal.curve;
      targetX = -curvedProgress * containerWidth;
      targetY = -SCROLL_CONFIG.vertical.return - verticalCurve;
      break;
    }
    case 'holdRight':
      targetX = -containerWidth;
      targetY = -SCROLL_CONFIG.vertical.return;
      break;
    case 'scrollLeft': {
      const leftProgress = curvedEasing(phaseProgress);
      const leftCurve =
        Math.sin(phaseProgress * Math.PI) *
        (SCROLL_CONFIG.horizontal.curve * 0.75);
      targetX = -containerWidth + leftProgress * containerWidth;
      targetY = -SCROLL_CONFIG.vertical.return + leftCurve;
      break;
    }
    case 'holdLeft':
      targetY = -SCROLL_CONFIG.vertical.return;
      break;
    case 'scrollUp':
      targetY = -180 + easeProgress * 180;
      break;
    case 'reset':
      break;
  }

  return { x: targetX, y: targetY };
}

export function getCurrentPhase(currentStep: number): {
  phase: AnimationPhase | null;
  progress: number;
} {
  let accumulatedDuration = 0;

  for (const phase of animationPhases) {
    const phaseEnd = accumulatedDuration + phase.duration;
    if (currentStep >= accumulatedDuration && currentStep < phaseEnd) {
      return {
        phase,
        progress: (currentStep - accumulatedDuration) / phase.duration,
      };
    }
    accumulatedDuration = phaseEnd;
  }

  return { phase: null, progress: 0 };
}

export function getTotalDuration() {
  return animationPhases.reduce((sum, phase) => sum + phase.duration, 0);
}
