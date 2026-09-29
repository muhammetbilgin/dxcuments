import { useCallback, useSyncExternalStore } from "react"

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

export type Breakpoint = "base" | keyof typeof BREAKPOINTS

const ORDER: Breakpoint[] = ["base", "sm", "md", "lg", "xl", "2xl"]

const query = (bp: keyof typeof BREAKPOINTS) =>
  `(min-width: ${BREAKPOINTS[bp]}px)`

function getCurrentBreakpoint(): Breakpoint {
  let current: Breakpoint = "base"
  for (const bp of ORDER.slice(1) as (keyof typeof BREAKPOINTS)[]) {
    if (window.matchMedia(query(bp)).matches) current = bp
  }
  return current
}

function subscribe(callback: () => void) {
  const lists = (Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[]).map(
    (bp) => window.matchMedia(query(bp))
  )
  lists.forEach((mql) => mql.addEventListener("change", callback))
  return () =>
    lists.forEach((mql) => mql.removeEventListener("change", callback))
}

const rank = (bp: Breakpoint) => ORDER.indexOf(bp)

interface UseBreakpointOptions {        
  serverBreakpoint?: Breakpoint
}

/**
 *
 * @example
 * const { breakpoint, isAtLeast, isMobile } = useBreakpoint()
 * if (isAtLeast("lg")) { ... }
 */
export function useBreakpoint({
  serverBreakpoint = "base",
}: UseBreakpointOptions = {}) {
  const breakpoint = useSyncExternalStore(
    subscribe,
    getCurrentBreakpoint,
    () => serverBreakpoint
  )

  const isAtLeast = useCallback(
    (bp: Breakpoint) => rank(breakpoint) >= rank(bp),
    [breakpoint]
  )

  const isBelow = useCallback(
    (bp: Breakpoint) => rank(breakpoint) < rank(bp),
    [breakpoint]
  )

  return {
    breakpoint,
    isAtLeast,
    isBelow,
    isMobile: isBelow("md"),
    isTablet: isAtLeast("md") && isBelow("lg"),
    isDesktop: isAtLeast("lg"),
  }
}