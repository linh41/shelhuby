'use client';
// Holographic 3D-tilt ShelbyUSD balance card with shine/glare effects
// Adapted from reactbits.dev/components/profile-card
import { useRef, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import './shelbyusd-balance-card.css';

interface HoloBalanceCardProps {
  label: string;
  value: ReactNode;
  logoSrc: string;
  logoAlt?: string;
  glowColor?: string; // CSS color for behind-glow
}

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number) => parseFloat(v.toFixed(3));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

export function HoloBalanceCard({ label, value, logoSrc, logoAlt = '', glowColor }: HoloBalanceCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const enterTimer = useRef<number | null>(null);
  const leaveRaf = useRef<number | null>(null);

  // Tilt engine — smooth interpolation of pointer position
  const tilt = useMemo(() => {
    let raf: number | null = null;
    let running = false;
    let lastTs = 0;
    let cx = 0, cy = 0, tx = 0, ty = 0;

    const setVars = (x: number, y: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      const px = clamp((100 / w) * x);
      const py = clamp((100 / h) * y);
      const dx = px - 50, dy = py - 50;

      el.style.setProperty('--pointer-x', `${px}%`);
      el.style.setProperty('--pointer-y', `${py}%`);
      el.style.setProperty('--background-x', `${adjust(px, 0, 100, 35, 65)}%`);
      el.style.setProperty('--background-y', `${adjust(py, 0, 100, 35, 65)}%`);
      el.style.setProperty('--pointer-from-center', `${clamp(Math.hypot(dy, dx) / 50, 0, 1)}`);
      el.style.setProperty('--pointer-from-top', `${py / 100}`);
      el.style.setProperty('--pointer-from-left', `${px / 100}`);
      el.style.setProperty('--rotate-x', `${round(-(dx / 6))}deg`);
      el.style.setProperty('--rotate-y', `${round(dy / 5)}deg`);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const k = 1 - Math.exp(-((ts - lastTs) / 1000) / 0.14);
      lastTs = ts;
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      setVars(cx, cy);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(step);
      } else { running = false; lastTs = 0; }
    };

    const start = () => { if (!running) { running = true; lastTs = 0; raf = requestAnimationFrame(step); } };

    return {
      setTarget(x: number, y: number) { tx = x; ty = y; start(); },
      toCenter() { const el = wrapRef.current; if (el) this.setTarget(el.clientWidth / 2, el.clientHeight / 2); },
      getCurrent() { return { cx, cy, tx, ty }; },
      cancel() { if (raf) cancelAnimationFrame(raf); running = false; lastTs = 0; },
    };
  }, []);

  const onEnter = useCallback((e: PointerEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    el.classList.add('entering');
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = window.setTimeout(() => el.classList.remove('entering'), 180);
    const r = el.getBoundingClientRect();
    tilt.setTarget(e.clientX - r.left, e.clientY - r.top);
  }, [tilt]);

  const onMove = useCallback((e: PointerEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    tilt.setTarget(e.clientX - r.left, e.clientY - r.top);
  }, [tilt]);

  const onLeave = useCallback(() => {
    tilt.toCenter();
    const check = () => {
      const { cx, cy, tx, ty } = tilt.getCurrent();
      if (Math.hypot(tx - cx, ty - cy) < 0.6) { leaveRaf.current = null; }
      else { leaveRaf.current = requestAnimationFrame(check); }
    };
    if (leaveRaf.current) cancelAnimationFrame(leaveRaf.current);
    leaveRaf.current = requestAnimationFrame(check);
  }, [tilt]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    // Initial animation: start from top-right, ease to center
    tilt.setTarget(el.clientWidth - 50, 30);
    setTimeout(() => tilt.toCenter(), 50);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (enterTimer.current) clearTimeout(enterTimer.current);
      if (leaveRaf.current) cancelAnimationFrame(leaveRaf.current);
      tilt.cancel();
    };
  }, [tilt, onEnter, onMove, onLeave]);

  return (
    <div ref={wrapRef} className="susd-wrapper" style={glowColor ? { '--glow-accent': glowColor } as React.CSSProperties : undefined}>
      <div className="susd-behind" />
      <div className="susd-card">
        <div className="susd-shine" />
        <div className="susd-glare" />
        <div className="susd-content">
          <img src={logoSrc} alt={logoAlt} className="susd-logo" />
          <div>
            <span className="susd-label">{label}</span>
            <div className="susd-value">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
