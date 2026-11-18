"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, CSSProperties, FocusEvent as ReactFocusEvent, ReactNode } from "react";
import { AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { Transition, Variants } from "motion/react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";


export const motionTokens = {
    duration: { instant: 0.12, fast: 0.16, exit: 0.18, standard: 0.24, considered: 0.48 },
    ease: {
        enter: [0.16, 1, 0.3, 1],
        exit: [0.7, 0, 0.84, 0],
        standard: [0.22, 1, 0.36, 1],

        inOut: [0.65, 0, 0.35, 1],
    },
    spring: {
        responsive: { type: "spring", stiffness: 520, damping: 44 },
        gentle: { type: "spring", stiffness: 340, damping: 34 },
        snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
        smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
        morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
    },
    stagger: { char: 0.016, word: 0.04, line: 0.08, item: 0.035 },
    blur: { subtle: 2, soft: 4, text: 8 },
} as const;

export interface DateRange {
    start: Date;
    end: Date;
}


export interface DateRangePreset {
    label: string;
    range: (today: Date) => DateRange;
}


export interface DateRangePickerProps {
    value?: DateRange | null;
    defaultValue?: DateRange | null;
    onChange?: (range: DateRange) => void;
    label?: string;
    placeholder?: string;
    presets?: DateRangePreset[];
    minDate?: Date;
    maxDate?: Date;
    weekStartsOn?: 0 | 1;
    locale?: string;
    months?: "auto" | 1 | 2;
    boundary?: () => HTMLElement | null;
    className?: string;
}

type Size = { w: number; h: number };
type Bezier = [number, number, number, number];

const DAY = 864e5;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const shiftMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, Math.min(date.getDate(), new Date(date.getFullYear(), date.getMonth() + amount + 1, 0).getDate()));
const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
const monthDiff = (a: Date, b: Date) => (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth();
const sameDay = (a?: Date | null, b?: Date | null) => Boolean(a && b && dayDiff(a, b) === 0);
const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromKey = (key: string) => { const [year, month, day] = key.split("-").map(Number); return new Date(year!, month! - 1, day!); };
const ordered = (a: Date, b: Date): DateRange => dayDiff(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
const sameRange = (a?: DateRange | null, b?: DateRange | null) => Boolean(a && b && sameDay(a.start, b.start) && sameDay(a.end, b.end));
const clampDate = (date: Date, min?: Date, max?: Date) => min && dayDiff(date, min) < 0 ? startOfDay(min) : max && dayDiff(date, max) > 0 ? startOfDay(max) : date;

export const defaultDateRangePresets: DateRangePreset[] = [
    { label: "Today", range: today => ({ start: today, end: today }) },
    { label: "Yesterday", range: today => ({ start: addDays(today, -1), end: addDays(today, -1) }) },
    { label: "Last 7 days", range: today => ({ start: addDays(today, -6), end: today }) },
    { label: "Last 30 days", range: today => ({ start: addDays(today, -29), end: today }) },
    { label: "This month", range: today => ({ start: monthStart(today), end: today }) },
    { label: "Last month", range: today => ({ start: addMonths(today, -1), end: monthEnd(addMonths(today, -1)) }) },
    { label: "This quarter", range: today => ({ start: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1), end: today }) },
    { label: "Year to date", range: today => ({ start: new Date(today.getFullYear(), 0, 1), end: today }) },
];

const noop = () => () => { };
function useReducedFlag() {
    const hydrated = useSyncExternalStore(noop, () => true, () => false);
    return !!useReducedMotion() && hydrated;
}

const { blur } = motionTokens;
const enterEase = [...motionTokens.ease.enter] as Bezier;
const standardEase = [...motionTokens.ease.standard] as Bezier;
const physical = (visualDuration: number, bounce: number): Transition => {
    const root = 2 * Math.PI / (visualDuration * 1.2);
    return { type: "spring", stiffness: root * root, damping: 2 * (1 - bounce) * root, mass: 1 };
};
const { smooth, morph, snappy } = motionTokens.spring;
const GROW = physical(smooth.visualDuration, 0), SHRINK = physical(snappy.visualDuration, 0), STRETCH = physical(morph.visualDuration, 0), GLIDE = physical(morph.visualDuration, 0), SLIDE = physical(smooth.visualDuration, 0);
const TRIGGER_RADIUS = 18, PANEL_RADIUS = 26, WIDE_CELL = 36, WIDE_MIN = 712, EDGE = 8;

const roll: Variants = {
    enter: (direction: number) => ({ opacity: 0, y: `${direction * .45}em`, filter: `blur(${blur.subtle}px)` }),
    center: { opacity: 1, y: "0em", filter: "blur(0px)", transition: { duration: motionTokens.duration.standard, ease: enterEase } },
    exit: (direction: number) => ({ opacity: 0, y: `${direction * -.45}em`, filter: `blur(${blur.subtle}px)`, transition: { duration: motionTokens.duration.fast, ease: standardEase } }),
};
const fade: Variants = { enter: { opacity: 0 }, center: { opacity: 1, y: "0em", filter: "blur(0px)", transition: { duration: motionTokens.duration.instant } }, exit: { opacity: 0, transition: { duration: .08 } } };
const faceIn: Variants = {
    hidden: { opacity: 0, y: -4, filter: `blur(${blur.soft}px)` },
    shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: motionTokens.duration.standard, ease: enterEase, delay: motionTokens.stagger.line } },
    gone: { opacity: 0, y: -2, filter: `blur(${blur.soft}px)`, transition: { duration: motionTokens.duration.instant, ease: standardEase } },
};
const faceFade: Variants = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: motionTokens.duration.instant } }, gone: { opacity: 0, transition: { duration: .08 } } };
const slide: Variants = {
    enter: (direction: number) => ({ opacity: 0, x: direction * 48 }),
    center: { opacity: 1, x: 0, transition: { x: SLIDE, opacity: { duration: motionTokens.duration.standard, ease: enterEase } } },
    exit: (direction: number) => ({ opacity: 0, x: direction * -36, transition: { x: SLIDE, opacity: { duration: motionTokens.duration.fast, ease: standardEase } } }),
};

function Rolling({ text, direction, reduced }: { text: string; direction: number; reduced: boolean }) {
    const words = text.split(/\s+/).filter(Boolean);
    return <span className="inline-flex gap-[0.28em] whitespace-nowrap" aria-hidden="true">
        {words.map((word, index) => <span key={index} className="relative inline-block">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                <motion.span key={word} className="inline-block" custom={direction} variants={reduced ? fade : roll} initial="enter" animate="center" exit="exit">{word}</motion.span>
            </AnimatePresence>
        </span>)}
    </span>;
}

function useDirection(range: DateRange | null) {
    const time = range ? range.start.getTime() * 2 + range.end.getTime() : null;
    const [previous, setPrevious] = useState(time);
    const [direction, setDirection] = useState(1);
    if (time !== previous) { setPrevious(time); setDirection(time === null || previous === null || time >= previous ? 1 : -1); }
    return direction;
}

type Segment = { left: number; width: number } | null;
const cellIn = (date: Date, first: Date) => { const index = dayDiff(date, first); return { row: Math.floor(index / 7), col: index % 7 }; };

function Bar({ row, segment, reduced }: { row: number; segment: Segment; reduced: boolean }) {
    const left = useMotionValue(segment?.left ?? 0), width = useMotionValue(segment?.width ?? 0), opacity = useMotionValue(segment ? 1 : 0);
    const leftPct = useTransform(left, value => `${value}%`), widthPct = useTransform(width, value => `${value}%`);
    const wasEmpty = useRef(!segment);
    useLayoutEffect(() => {
        if (!segment) { wasEmpty.current = true; animate(opacity, 0, { duration: reduced ? 0 : motionTokens.duration.exit }); return; }
        if (wasEmpty.current || reduced) { left.jump(segment.left); width.jump(segment.width); }
        else { animate(left, segment.left, STRETCH); animate(width, segment.width, STRETCH); }
        wasEmpty.current = false;
        animate(opacity, 1, { duration: reduced ? 0 : motionTokens.duration.fast });
    }, [left, opacity, reduced, segment, width]);
    return <motion.span className="absolute h-[calc(var(--cell)-6px)] rounded-full bg-primary/15" style={{ left: leftPct, width: widthPct, opacity, top: `calc(${row} * var(--cell) + 3px)` }} />;
}

function Thumb({ cell, reduced }: { cell: { row: number; col: number } | null; reduced: boolean }) {
    const x = useMotionValue(cell?.col ?? 0), y = useMotionValue(cell?.row ?? 0), opacity = useMotionValue(cell ? 1 : 0), scale = useMotionValue(cell ? 1 : .8);
    const transform = useTransform(() => `translate(${x.get() * 100}%, ${y.get() * 100}%) scale(${scale.get()})`);
    const hidden = useRef(!cell);
    useLayoutEffect(() => {
        if (!cell) { hidden.current = true; animate(opacity, 0, { duration: reduced ? 0 : motionTokens.duration.instant }); animate(scale, .8, { duration: reduced ? 0 : motionTokens.duration.instant }); return; }
        if (hidden.current || reduced) { x.jump(cell.col); y.jump(cell.row); }
        else { animate(x, cell.col, GLIDE); animate(y, cell.row, GLIDE); }
        hidden.current = false;
        animate(opacity, 1, { duration: reduced ? 0 : motionTokens.duration.fast });
        animate(scale, 1, reduced ? { duration: 0 } : GLIDE);
    }, [cell, opacity, reduced, scale, x, y]);
    return <motion.span
        className="absolute top-0 left-0 size-(--cell) before:absolute before:inset-0.75 before:rounded-full before:bg-primary before:content-['']"
        style={{ transform, opacity }}
    />;
}

interface MonthProps {
    month: Date;
    range: DateRange | null;
    tabbable: string;
    today?: Date;
    minDate?: Date;
    maxDate?: Date;
    weekStartsOn: 0 | 1;
    reduced: boolean;
    instant?: boolean;
    formatters: { title: Intl.DateTimeFormat; day: Intl.DateTimeFormat; weekday: Intl.DateTimeFormat; weekdayLong: Intl.DateTimeFormat };
    onPick: (date: Date) => void;
    onHover: (date: Date) => void;
    onKey: (event: ReactKeyboardEvent<HTMLButtonElement>, date: Date) => void;
    onFocusDay: (date: Date) => void;
    idBase: string;
}

function Month({ month, range, tabbable, today, minDate, maxDate, weekStartsOn, reduced, instant = false, formatters, onPick, onHover, onKey, onFocusDay, idBase }: MonthProps) {
    const first = useMemo(() => addDays(month, -((month.getDay() - weekStartsOn + 7) % 7)), [month, weekStartsOn]);
    const rows = useMemo(() => Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, col) => addDays(first, row * 7 + col))), [first]);
    const titleId = `${idBase}-${keyOf(month)}`;
    const inMonth = (date: Date) => monthDiff(date, month) === 0;

    const lo = range?.start, hi = range?.end;
    const loKey = lo ? keyOf(lo) : "", hiKey = hi ? keyOf(hi) : "";
    const segments = useMemo<Segment[]>(() => {
        if (!loKey || !hiKey) return rows.map(() => null);
        const start = fromKey(loKey), end = fromKey(hiKey);
        const unit = 100 / 7;
        const colOf = (date: Date) => dayDiff(date, first) % 7;
        return rows.map(row => {
            const days = row.filter(date => monthDiff(date, month) === 0);
            if (!days.length) return null;
            const rowFirst = days[0]!, rowLast = days[days.length - 1]!;
            const from = dayDiff(start, rowFirst) > 0 ? start : rowFirst, to = dayDiff(end, rowLast) < 0 ? end : rowLast;
            if (dayDiff(from, to) <= 0) { const a = colOf(from), b = colOf(to); return { left: a * unit, width: (b - a + 1) * unit }; }
            if (dayDiff(rowLast, start) < 0) return { left: (colOf(rowLast) + 1) * unit, width: 0 };
            return { left: colOf(rowFirst) * unit, width: 0 };
        });
    }, [first, hiKey, loKey, month, rows]);
    const startCell = useMemo(() => loKey && monthDiff(fromKey(loKey), month) === 0 ? cellIn(fromKey(loKey), first) : null, [loKey, month, first]);
    const endCell = useMemo(() => hiKey && hiKey !== loKey && monthDiff(fromKey(hiKey), month) === 0 ? cellIn(fromKey(hiKey), first) : null, [hiKey, loKey, month, first]);

    return <div className="w-[calc(var(--cell)*7)]">
        <p id={titleId} className="m-0 h-8 text-center font-medium leading-8 whitespace-nowrap text-foreground">{formatters.title.format(month)}</p>
        <div role="grid" aria-labelledby={titleId} className="grid">
            <div role="row" className="grid h-7 grid-cols-[repeat(7,var(--cell))] items-center text-center text-xs text-muted-foreground">
                {rows[0]!.map(date => <span key={date.getDay()} role="columnheader" aria-label={formatters.weekdayLong.format(date)}>{formatters.weekday.format(date).slice(0, 2)}</span>)}
            </div>
            <div className="relative">
                <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {segments.map((segment, row) => <Bar key={row} row={row} segment={segment} reduced={reduced || instant} />)}
                    <Thumb cell={startCell} reduced={reduced || instant} />
                    <Thumb cell={endCell} reduced={reduced || instant} />
                </span>
                {rows.map((row, index) => <div key={index} role="row" className="grid h-(--cell) grid-cols-[repeat(7,var(--cell))]">
                    {row.map(date => {
                        if (!inMonth(date)) return <span key={keyOf(date)} role="gridcell" className="relative block" />;
                        const key = keyOf(date);
                        const disabled = Boolean((minDate && dayDiff(date, minDate) < 0) || (maxDate && dayDiff(date, maxDate) > 0));
                        const inRange = Boolean(lo && hi && dayDiff(date, lo) >= 0 && dayDiff(date, hi) <= 0);
                        const edge = sameDay(date, lo) || sameDay(date, hi);
                        const isToday = sameDay(date, today);
                        return <span key={key} role="gridcell" aria-selected={inRange} className="relative block">
                            <button
                                type="button"
                                className={cn(
                                    "relative z-1 grid size-full cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 font-[inherit] tabular-nums text-foreground transition-colors duration-150 [-webkit-tap-highlight-color:transparent]",
                                    "[&>span]:relative [&>span]:grid [&>span]:size-[calc(100%-6px)] [&>span]:place-items-center [&>span]:rounded-full [&>span]:transition-[background-color,transform] [&>span]:duration-150",
                                    "enabled:active:[&>span]:scale-90",
                                    "data-edge:font-medium data-edge:text-primary-foreground data-edge:delay-40",
                                    "data-today:after:absolute data-today:after:bottom-1.25 data-today:after:left-1/2 data-today:after:-ml-0.5 data-today:after:size-1 data-today:after:rounded-full data-today:after:bg-primary data-today:after:content-['']",
                                    "data-today:data-edge:after:bg-primary-foreground",
                                    "disabled:cursor-default disabled:text-muted-foreground disabled:opacity-50",
                                    "focus-visible:not-data-edge:[&>span]:bg-foreground/7",
                                    "enabled:hover:not-data-edge:[&>span]:bg-foreground/7",
                                )}
                                data-date={key}
                                data-edge={edge || undefined}
                                data-range={inRange || undefined}
                                data-today={isToday || undefined}
                                tabIndex={key === tabbable ? 0 : -1}
                                disabled={disabled}
                                aria-current={isToday ? "date" : undefined}
                                aria-label={formatters.day.format(date)}
                                onClick={() => onPick(date)}
                                onPointerEnter={() => { if (!disabled) onHover(date); }}
                                onFocus={() => onFocusDay(date)}
                                onKeyDown={event => onKey(event, date)}
                            >
                                <span>{date.getDate()}</span>
                            </button>
                        </span>;
                    })}
                </div>)}
            </div>
        </div>
    </div>;
}

/** The visible months travel together; a leaving set turns inert so focus and queries only find the current one. */
function Months({ children, direction, reduced }: { children: ReactNode; direction: number; reduced: boolean }) {
    const present = useIsPresent();
    return <motion.div
        className="flex gap-6"
        data-current={present || undefined}
        inert={!present || undefined}
        custom={direction}
        variants={reduced ? fade : slide}
        initial="enter"
        animate="center"
        exit="exit"
    >{children}</motion.div>;
}

export function DateRangePicker({ value, defaultValue = null, onChange, label = "Date range", placeholder = "Select dates", presets = defaultDateRangePresets, minDate, maxDate, weekStartsOn = 0, locale = "en-US", months = "auto", boundary, className }: DateRangePickerProps) {
    const reduced = useReducedFlag();
    const today = new Date();
    const uid = useId();
    const [inner, setInner] = useState<DateRange | null>(defaultValue);
    const committed = value !== undefined ? value : inner;

    const [open, setOpen] = useState(false);
    const [compact, setCompact] = useState(false);
    const [panelWidth, setPanelWidth] = useState(0);
    const [view, setView] = useState<Date>(() => monthStart(committed?.end ?? new Date(2000, 0, 1)));
    const [direction, setDirection] = useState(1);
    const [draft, setDraft] = useState<DateRange | null>(committed);
    const [anchor, setAnchor] = useState<Date | null>(null);
    const [hover, setHover] = useState<Date | null>(null);
    const [keyed, setKeyed] = useState(false);
    const [focusKey, setFocusKey] = useState("");

    const formatters = useMemo(() => ({
        label: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }),
        title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
        day: new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
        weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }),
        weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    }), [locale]);
    const format = useCallback((range: DateRange | null) => !range ? placeholder : sameDay(range.start, range.end) ? formatters.label.format(range.start) : formatters.label.formatRange(range.start, range.end), [formatters, placeholder]);

    const count = compact ? 1 : 2;
    const visible = useMemo(() => Array.from({ length: count }, (_, index) => addMonths(view, index)), [count, view]);
    const shown = anchor ? ordered(anchor, hover ?? anchor) : draft;
    const activePreset = today && !anchor ? presets.findIndex(preset => sameRange(preset.range(today), draft)) : -1;
    const days = shown ? dayDiff(shown.end, shown.start) + 1 : 0;
    const committedDirection = useDirection(committed);
    const shownDirection = useDirection(shown);

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const railRef = useRef<HTMLDivElement>(null);
    const pendingFocus = useRef<"trigger" | "day" | null>(null);

    const width = useMotionValue<number | string>("100%"), height = useMotionValue<number | string>("100%"), radius = useMotionValue(TRIGGER_RADIUS), x = useMotionValue(0), rootWidth = useMotionValue<number | string>("auto");
    const sizes = useRef<{ trigger: Size; panel: Size | null }>({ trigger: { w: 0, h: 0 }, panel: null });
    const live = useRef({ open: false, reduced: false, ready: false });
    const queued = useRef(false);
    const boundaryRef = useRef(boundary);
    useLayoutEffect(() => { boundaryRef.current = boundary; }, [boundary]);

    const bounds = useCallback(() => {
        const element = boundaryRef.current?.();
        const viewport = { left: 0, right: document.documentElement.clientWidth };
        if (!element) return viewport;
        const rect = element.getBoundingClientRect();
        return { left: Math.max(viewport.left, rect.left), right: Math.min(viewport.right, rect.right) };
    }, []);

    const update = useCallback(() => {
        queued.current = false;
        const { trigger, panel } = sizes.current, state = live.current;
        if (!trigger.w) return;
        const openPanel = state.open && panel ? panel : null;
        const target = openPanel ?? trigger;
        let offset = 0;
        if (openPanel && rootRef.current) {
            const rect = rootRef.current.getBoundingClientRect(), box = bounds();
            offset = Math.min(0, box.right - EDGE - (rect.left + openPanel.w));
            offset = Math.max(offset, box.left + EDGE - rect.left);
        }
        const r = openPanel ? PANEL_RADIUS : TRIGGER_RADIUS;
        if (!state.ready || state.reduced) {
            width.jump(target.w); height.jump(target.h); radius.jump(r); x.jump(offset); rootWidth.jump(trigger.w);
            state.ready = true;
            return;
        }
        const spring = openPanel ? GROW : state.open ? GROW : SHRINK;
        animate(width, target.w, spring); animate(height, target.h, spring); animate(radius, r, spring); animate(x, offset, spring);
        animate(rootWidth, trigger.w, motionTokens.spring.morph);
    }, [bounds, height, radius, rootWidth, width, x]);

    const schedule = useCallback(() => {
        if (queued.current) return;
        queued.current = true;
        queueMicrotask(update);
    }, [update]);

    useLayoutEffect(() => { live.current.open = open; live.current.reduced = reduced; if (!open) sizes.current.panel = null; schedule(); }, [open, reduced, schedule]);

    useLayoutEffect(() => {
        const node = triggerRef.current;
        if (!node) return;
        const read = () => { sizes.current.trigger = { w: node.offsetWidth, h: node.offsetHeight }; schedule(); };
        read();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(read);
        observer.observe(node);
        return () => observer.disconnect();
    }, [schedule]);

    useLayoutEffect(() => {
        const node = panelRef.current;
        if (!open || !node) return;
        const read = () => { sizes.current.panel = { w: node.offsetWidth, h: node.offsetHeight }; schedule(); };
        read();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(read);
        observer.observe(node);
        return () => observer.disconnect();
    }, [open, schedule]);

    useEffect(() => {
        if (!open) return;
        const frame = requestAnimationFrame(() => {
            const node = panelRef.current;
            if (!node) return;
            const rect = node.getBoundingClientRect();
            const overflow = rect.bottom - (window.innerHeight - EDGE);
            if (overflow <= 0) return;
            window.scrollBy({ top: Math.min(overflow, Math.max(0, rect.top - EDGE)), behavior: reduced ? "instant" : "smooth" });
        });
        return () => cancelAnimationFrame(frame);
    }, [open, reduced]);
    useEffect(() => {
        if (open) return;
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) trigger.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" });
    }, [open, reduced]);

    const measureLayout = useCallback(() => {
        const box = bounds();
        const available = Math.max(0, box.right - box.left - EDGE * 2);
        const single = months === 1 || (months === "auto" && available < WIDE_MIN);
        return { single, width: Math.min(352, available) };
    }, [bounds, months]);

    useEffect(() => {
        if (!open) return;
        const onResize = () => { const next = measureLayout(); setCompact(next.single); setPanelWidth(next.width); schedule(); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [measureLayout, open, schedule]);

    const viewFor = (range: DateRange | null, single: boolean, fallback: Date) => {
        const end = monthStart(range?.end ?? fallback);
        return single ? end : addMonths(end, -1);
    };

    const openPanel = () => {
        if (!today) return;
        const layout = measureLayout();
        setCompact(layout.single);
        setPanelWidth(layout.width);
        setDraft(committed);
        setAnchor(null);
        setHover(null);
        setView(viewFor(committed, layout.single, today));
        setDirection(0);
        setFocusKey(keyOf(committed?.start ?? today));
        pendingFocus.current = "day";
        setOpen(true);
    };

    const close = useCallback((focus: boolean) => {
        if (focus) pendingFocus.current = "trigger";
        setDirection(0);
        setOpen(false);
        setAnchor(null);
        setHover(null);
    }, []);

    const apply = () => {
        const next = anchor ? { start: anchor, end: anchor } : draft;
        if (!next) return;
        if (value === undefined) setInner(next);
        onChange?.(next);
        close(true);
    };

    useLayoutEffect(() => {
        const target = pendingFocus.current;
        if (!target) return;
        if (target === "trigger" && !open) { pendingFocus.current = null; triggerRef.current?.focus({ preventScroll: true }); return; }
        if (target === "day" && open) {
            const node = panelRef.current?.querySelector<HTMLButtonElement>(`[data-current] [data-date="${focusKey}"]`);
            if (node) { pendingFocus.current = null; node.focus({ preventScroll: true }); }
        }
    }, [focusKey, open, view, compact]);

    useEffect(() => {
        if (!open) return;
        const down = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) close(false); };
        document.addEventListener("pointerdown", down);
        return () => document.removeEventListener("pointerdown", down);
    }, [close, open]);

    const onRootKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(true); }
    };
    const onRootBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
        const next = event.relatedTarget as Node | null;
        if (open && next && !event.currentTarget.contains(next)) close(false);
    };

    const goTo = (next: Date) => {
        const delta = monthDiff(next, view);
        if (!delta) return;
        setDirection(Math.sign(delta));
        setView(next);
    };

    /** Keeps a range on screen: nothing moves when it already fits, otherwise its last month lands on the right. */
    const reveal = (range: DateRange) => {
        const first = view, last = addMonths(view, count - 1);
        if (monthDiff(range.start, first) >= 0 && monthDiff(range.end, last) <= 0) return;
        goTo(viewFor(range, compact, range.end));
    };

    const pick = (date: Date) => {
        setFocusKey(keyOf(date));
        if (!anchor) { setAnchor(date); setHover(date); return; }
        setDraft(ordered(anchor, date));
        setAnchor(null);
        setHover(null);
    };

    const choosePreset = (preset: DateRangePreset) => {
        if (!today) return;
        const range = preset.range(today);
        setDraft(range);
        setAnchor(null);
        setHover(null);
        setFocusKey(keyOf(range.start));
        reveal(range);
    };

    const onDayKey = (event: ReactKeyboardEvent<HTMLButtonElement>, date: Date) => {
        const weekday = (date.getDay() - weekStartsOn + 7) % 7;
        const moves: Record<string, () => Date> = {
            ArrowLeft: () => addDays(date, -1), ArrowRight: () => addDays(date, 1), ArrowUp: () => addDays(date, -7), ArrowDown: () => addDays(date, 7),
            Home: () => addDays(date, -weekday), End: () => addDays(date, 6 - weekday),
            PageUp: () => shiftMonths(date, event.shiftKey ? -12 : -1), PageDown: () => shiftMonths(date, event.shiftKey ? 12 : 1),
        };
        const move = moves[event.key];
        if (!move) return;
        event.preventDefault();
        const next = clampDate(move(), minDate, maxDate);
        setFocusKey(keyOf(next));
        setKeyed(true);
        if (anchor) setHover(next);
        pendingFocus.current = "day";
        const first = view, last = addMonths(view, count - 1);
        if (monthDiff(next, first) < 0) goTo(monthStart(next));
        else if (monthDiff(next, last) > 0) goTo(addMonths(monthStart(next), -(count - 1)));
    };

    const onRailKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const keys = compact ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
        if (!keys.includes(event.key)) return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-preset]"));
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (at < 0) return;
        event.preventDefault();
        buttons[(at + (event.key === keys[1] ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    };

    /** The day that owns the tab stop: the focused day when it is on screen, else the first visible day of the range, else the 1st. */
    const tabbable = useMemo(() => {
        const onScreen = (date: Date) => visible.some(month => monthDiff(date, month) === 0);
        if (focusKey && onScreen(fromKey(focusKey))) return focusKey;
        if (shown && onScreen(shown.start)) return keyOf(shown.start);
        return keyOf(visible[0]!);
    }, [focusKey, shown, visible]);

    const gx = useMotionValue(0), gy = useMotionValue(0), gw = useMotionValue(0), gh = useMotionValue(0), go = useMotionValue(0);
    useLayoutEffect(() => {
        const rail = railRef.current;
        const node = activePreset < 0 ? null : rail?.querySelector<HTMLElement>(`[data-preset="${activePreset}"]`);
        if (!rail || !node) { animate(go, 0, { duration: reduced ? 0 : motionTokens.duration.exit }); return; }
        const place = [node.offsetLeft, node.offsetTop, node.offsetWidth, node.offsetHeight] as const;
        if (go.get() < .05 || reduced) { gx.jump(place[0]); gy.jump(place[1]); gw.jump(place[2]); gh.jump(place[3]); }
        else { animate(gx, place[0], GLIDE); animate(gy, place[1], GLIDE); animate(gw, place[2], GLIDE); animate(gh, place[3], GLIDE); }
        animate(go, 1, { duration: reduced ? 0 : motionTokens.duration.fast });
        if (compact && (node.offsetLeft < rail.scrollLeft || node.offsetLeft + node.offsetWidth > rail.scrollLeft + rail.clientWidth)) {
            rail.scrollTo({ left: node.offsetLeft - 12, behavior: reduced ? "auto" : "smooth" });
        }
    }, [activePreset, compact, go, gh, gw, gx, gy, open, reduced]);

    const committedText = format(committed);
    const shownText = shown ? format(shown) : "No dates";
    const countText = shown ? `${days} ${days === 1 ? "day" : "days"}` : "";
    const status = !open ? "" : anchor ? `Start ${formatters.label.format(anchor)}. Choose an end date.` : shown ? `${shownText}, ${countText}` : "";
    const layoutId = reduced ? undefined : `${uid}-value`;

    const cellSize = compact && panelWidth ? Math.max(32, Math.min(42, Math.floor((panelWidth - 24) / 7))) : WIDE_CELL;

    const quiet = open ? (reduced ? { opacity: 0 } : { opacity: 0, filter: `blur(${blur.subtle}px)` }) : { opacity: 1, filter: "blur(0px)" };
    const quietTransition = open ? { duration: motionTokens.duration.instant, ease: standardEase } : { duration: motionTokens.duration.standard, ease: enterEase, delay: reduced ? 0 : .1 };

    return <motion.div
        ref={rootRef}
        className={cn(
            "group/root relative z-0 inline-block h-9 align-top text-sm text-foreground transition-[z-index] delay-500 data-open:z-30 data-open:delay-0",
            className,
        )}
        style={{ width: rootWidth }}
        data-open={open || undefined}
        onKeyDown={onRootKey}
        onBlur={onRootBlur}
    >
        <button
            ref={triggerRef}
            type="button"
            className={cn(
                "peer relative z-1 inline-flex h-9 w-max cursor-pointer items-center gap-2.5 border-0 bg-transparent pr-3 pl-3.5 font-medium whitespace-nowrap text-foreground [-webkit-tap-highlight-color:transparent]",
                "disabled:cursor-default [[inert]]:pointer-events-none",
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? `${uid}-panel` : undefined}
            aria-label={`${label}: ${committedText}`}
            disabled={!today}
            inert={open || undefined}
            onClick={openPanel}
        >
            <motion.span className="grid shrink-0 place-items-center text-muted-foreground" initial={false} animate={quiet} transition={quietTransition}>
                <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
            </motion.span>
            {open || !layoutId
                ? <motion.span
                    key="resting"
                    className="inline-flex tabular-nums data-empty:font-normal data-empty:text-muted-foreground"
                    data-empty={!committed || undefined}
                    initial={false}
                    animate={open ? { opacity: 0 } : { opacity: 1 }}
                    transition={quietTransition}
                >
                    <Rolling text={committedText} direction={committedDirection} reduced={reduced} />
                </motion.span>
                : <motion.span
                    key="shared"
                    layoutId={layoutId}
                    layout="position"
                    className="inline-flex tabular-nums data-empty:font-normal data-empty:text-muted-foreground"
                    data-empty={!committed || undefined}
                    transition={SHRINK}
                >
                    <Rolling text={committedText} direction={committedDirection} reduced={reduced} />
                </motion.span>}
            <motion.span className="grid shrink-0 place-items-center text-muted-foreground" initial={false} animate={quiet} transition={quietTransition}>
                <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
            </motion.span>
        </button>

        <motion.div
            className={cn(
                "absolute top-0 left-0 z-0 overflow-clip bg-card shadow-sm transition-[box-shadow,background-color] duration-200",
                "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-border after:transition-colors after:content-['']",
                "group-data-open/root:z-2 group-data-open/root:shadow-lg",
                "peer-enabled:peer-hover:bg-[color-mix(in_oklab,var(--foreground)_3%,var(--card))] peer-enabled:peer-hover:after:border-ring",
                "group-data-open/root:peer-enabled:peer-hover:bg-card group-data-open/root:peer-enabled:peer-hover:after:border-border",
                "motion-reduce:transition-none",
            )}
            style={{ width, height, borderRadius: radius, x }}
        >
            <AnimatePresence>
                {open && today && <motion.div
                    key="panel"
                    ref={panelRef}
                    id={`${uid}-panel`}
                    className="group/panel absolute top-0 left-0 w-max p-2.5 data-compact:p-2 [--cell:36px]"
                    role="dialog"
                    aria-label={label}
                    data-compact={compact || undefined}
                    style={{ "--cell": `${cellSize}px`, width: compact && panelWidth ? panelWidth : undefined } as CSSProperties}
                    exit={{ opacity: 1, transition: { duration: motionTokens.duration.fast } }}
                >
                    <motion.div
                        className="flex gap-2.5 group-data-compact/panel:flex-col group-data-compact/panel:gap-2"
                        variants={reduced ? faceFade : faceIn}
                        initial="hidden"
                        animate="shown"
                        exit="gone"
                    >
                        <div
                            ref={railRef}
                            className={cn(
                                "relative flex w-37 shrink-0 flex-col gap-0.5 border-r border-border pr-2.5",
                                "group-data-compact/panel:-mx-2 group-data-compact/panel:w-auto group-data-compact/panel:flex-row group-data-compact/panel:overflow-x-auto group-data-compact/panel:border-r-0 group-data-compact/panel:border-b group-data-compact/panel:px-2 group-data-compact/panel:pt-0 group-data-compact/panel:pb-2",
                                "group-data-compact/panel:overscroll-x-contain group-data-compact/panel:[scrollbar-width:none] group-data-compact/panel:[&::-webkit-scrollbar]:hidden",
                            )}
                            role="group"
                            aria-label="Presets"
                            onKeyDown={onRailKey}
                        >
                            <motion.span
                                className="pointer-events-none absolute top-0 left-0 rounded-xl bg-foreground/6.5"
                                style={{ x: gx, y: gy, width: gw, height: gh, opacity: go }}
                                aria-hidden="true"
                            />
                            {presets.map((preset, index) => <button
                                key={preset.label}
                                type="button"
                                className={cn(
                                    "relative flex h-8 shrink-0 cursor-pointer items-center rounded-xl border-0 bg-transparent px-3 text-left font-[inherit] whitespace-nowrap text-muted-foreground transition-colors duration-150 [-webkit-tap-highlight-color:transparent]",
                                    "aria-pressed:font-medium aria-pressed:text-foreground",
                                    "hover:bg-foreground/4 hover:text-foreground aria-pressed:hover:bg-transparent",
                                    "focus-visible:bg-foreground/5 focus-visible:text-foreground",
                                    "group-data-compact/panel:px-2.75",
                                    "motion-reduce:transition-none",
                                )}
                                data-preset={index}
                                aria-pressed={index === activePreset}
                                onClick={() => choosePreset(preset)}
                            >{preset.label}</button>)}
                        </div>

                        <div
                            className="relative px-0.5 group-data-compact/panel:self-center"
                            onPointerLeave={() => { if (anchor) setHover(null); }}
                        >
                            <button
                                type="button"
                                className={cn(
                                    "absolute top-0 left-0.5 z-2 grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[background-color,color,transform] duration-150 [-webkit-tap-highlight-color:transparent]",
                                    "enabled:active:scale-[0.92] disabled:cursor-default disabled:opacity-35",
                                    "enabled:hover:bg-foreground/6.5 enabled:hover:text-foreground",
                                    "focus-visible:bg-foreground/5 focus-visible:text-foreground",
                                    "motion-reduce:transition-none",
                                )}
                                data-side="prev"
                                aria-label="Previous month"
                                onClick={() => goTo(addMonths(view, -1))}
                                disabled={Boolean(minDate && monthDiff(view, minDate) <= 0)}
                            >
                                <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "absolute top-0 right-0.5 z-2 grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[background-color,color,transform] duration-150 [-webkit-tap-highlight-color:transparent]",
                                    "enabled:active:scale-[0.92] disabled:cursor-default disabled:opacity-35",
                                    "enabled:hover:bg-foreground/6.5 enabled:hover:text-foreground",
                                    "focus-visible:bg-foreground/5 focus-visible:text-foreground",
                                    "motion-reduce:transition-none",
                                )}
                                data-side="next"
                                aria-label="Next month"
                                onClick={() => goTo(addMonths(view, 1))}
                                disabled={Boolean(maxDate && monthDiff(addMonths(view, count - 1), maxDate) >= 0)}
                            >
                                <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
                            </button>
                            <div className="relative grid h-[calc(60px+var(--cell)*6)] overflow-clip [overflow-clip-margin:2px] *:col-start-1 *:row-start-1">
                                <AnimatePresence initial={false} custom={direction}>
                                    <Months key={`${keyOf(view)}-${count}`} direction={direction} reduced={reduced}>
                                        {visible.map(month => <Month key={keyOf(month)} month={month} range={shown} tabbable={tabbable} today={today} minDate={minDate} maxDate={maxDate}
                                            weekStartsOn={weekStartsOn} reduced={reduced} formatters={formatters} idBase={uid}
                                            onPick={pick} instant={keyed} onHover={date => { setKeyed(false); if (anchor) setHover(date); }} onKey={onDayKey} onFocusDay={date => setFocusKey(keyOf(date))} />)}
                                    </Months>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                    <div className={cn(
                        "mt-2.5 flex w-0 min-w-full items-center justify-between gap-3 border-t border-border pt-2.5 pr-0.5 pb-0 pl-3",
                        "group-data-compact/panel:mt-1.5 group-data-compact/panel:flex-wrap group-data-compact/panel:pl-2.75",
                    )}>
                        <div className="grid min-w-0 gap-px group-data-compact/panel:flex-1 group-data-compact/panel:basis-32">
                            <motion.span
                                layoutId={layoutId}
                                layout={layoutId ? "position" : undefined}
                                className="inline-flex w-max font-medium tabular-nums"
                                transition={GROW}
                                variants={layoutId ? undefined : faceFade}
                                initial={layoutId ? undefined : "hidden"}
                                animate={layoutId ? undefined : "shown"}
                                exit={layoutId ? undefined : "gone"}
                            >
                                <Rolling text={shownText} direction={shownDirection} reduced={reduced} />
                            </motion.span>
                            <motion.span
                                className="inline-flex min-h-[1.4em] text-xs tabular-nums text-muted-foreground"
                                variants={reduced ? faceFade : faceIn}
                                initial="hidden"
                                animate="shown"
                                exit="gone"
                            >
                                {countText && <Rolling text={anchor && sameDay(anchor, hover) ? "Pick an end date" : countText} direction={shownDirection} reduced={reduced} />}
                            </motion.span>
                        </div>
                        <motion.div
                            className="flex shrink-0 items-center gap-1.5 group-data-compact/panel:ml-auto"
                            variants={reduced ? faceFade : faceIn}
                            initial="hidden"
                            animate="shown"
                            exit="gone"
                        >
                            <button
                                type="button"
                                className={cn(
                                    "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent px-3.5 font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,transform,opacity] duration-150 [-webkit-tap-highlight-color:transparent]",
                                    "hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:bg-muted focus-visible:text-foreground",
                                    "motion-reduce:transition-none",
                                )}
                                onClick={() => close(true)}
                            >Cancel</button>
                            <button
                                type="button"
                                className={cn(
                                    "inline-flex h-8 min-w-19 cursor-pointer items-center justify-center rounded-md border-0 bg-primary px-3.5 font-medium whitespace-nowrap text-primary-foreground transition-[background-color,color,transform,opacity] duration-150 [-webkit-tap-highlight-color:transparent]",
                                    "enabled:hover:bg-primary/90 enabled:active:scale-[0.97] disabled:cursor-default disabled:opacity-45",
                                    "motion-reduce:transition-none",
                                )}
                                onClick={apply}
                                disabled={!shown}
                            >Apply</button>
                        </motion.div>
                    </div>
                    <p className="sr-only" aria-live="polite">{status}</p>
                </motion.div>}
            </AnimatePresence>
        </motion.div>
    </motion.div>;
}

export default DateRangePicker;
