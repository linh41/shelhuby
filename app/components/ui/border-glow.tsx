'use client';
// Border glow effect — cursor-reactive gradient border with edge lighting
// Adapted from reactbits.dev/components/border-glow
import { useRef, useCallback, useEffect, type ReactNode, type CSSProperties } from 'react';

interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  colors?: string[];
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  animated?: boolean;
}

// Parse "H S L" string into components
function parseHSL(hsl: string) {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
  if (!m) return { h: 40, s: 80, l: 80 };
  return { h: +m[1], s: +m[2], l: +m[3] };
}

// Build CSS vars for glow box-shadow opacities
function glowVars(hsl: string): Record<string, string> {
  const { h, s, l } = parseHSL(hsl);
  const base = `${h}deg ${s}% ${l}%`;
  const levels = [[100, ''], [60, '-60'], [50, '-50'], [40, '-40'], [30, '-30'], [20, '-20'], [10, '-10']] as const;
  const vars: Record<string, string> = {};
  for (const [o, k] of levels) vars[`--glow-color${k}`] = `hsl(${base} / ${o}%)`;
  return vars;
}

// Build gradient CSS vars from color array
const POS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const MAP = [0, 1, 2, 0, 1, 2, 1];

function gradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(MAP[i], colors.length - 1)];
    vars[KEYS[i]] = `radial-gradient(at ${POS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOut(x: number) { return 1 - Math.pow(1 - x, 3); }
function easeIn(x: number) { return x * x * x; }

function animate(opts: { start?: number; end?: number; duration?: number; delay?: number; ease?: (t: number) => number; onUpdate: (v: number) => void; onEnd?: () => void }) {
  const { start = 0, end = 100, duration = 1000, delay = 0, ease = easeOut, onUpdate, onEnd } = opts;
  const t0 = performance.now() + delay;
  function tick() {
    const t = Math.min((performance.now() - t0) / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else onEnd?.();
  }
  setTimeout(() => requestAnimationFrame(tick), delay);
}

export function BorderGlow({
  children,
  className = '',
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  glowColor = '40 80 80',
  backgroundColor = '#060010',
  borderRadius = 16,
  animated = false,
}: BorderGlowProps) {
  const ref = useRef<HTMLDivElement>(null);

  const center = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const edgeProximity = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = center(el);
    const dx = x - cx, dy = y - cy;
    let kx = Infinity, ky = Infinity;
    if (dx) kx = cx / Math.abs(dx);
    if (dy) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [center]);

  const cursorAngle = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = center(el);
    const dx = x - cx, dy = y - cy;
    if (!dx && !dy) return 0;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    return deg;
  }, [center]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    card.style.setProperty('--edge-proximity', `${(edgeProximity(card, x, y) * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${cursorAngle(card, x, y).toFixed(3)}deg`);
  }, [edgeProximity, cursorAngle]);

  useEffect(() => {
    if (!animated || !ref.current) return;
    const card = ref.current;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', '110deg');
    animate({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`) });
    animate({ ease: easeIn, duration: 1500, end: 50, onUpdate: v => card.style.setProperty('--cursor-angle', `${355 * (v / 100) + 110}deg`) });
    animate({ ease: easeOut, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => card.style.setProperty('--cursor-angle', `${355 * (v / 100) + 110}deg`) });
    animate({ ease: easeIn, delay: 2500, duration: 1500, start: 100, end: 0, onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`), onEnd: () => card.classList.remove('sweep-active') });
  }, [animated]);

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`border-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--edge-sensitivity': 30,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': '30px',
        '--cone-spread': 25,
        '--fill-opacity': 0.5,
        ...glowVars(glowColor),
        ...gradientVars(colors),
      } as CSSProperties}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
