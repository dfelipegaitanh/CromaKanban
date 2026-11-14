import React, { useEffect, useRef } from 'react';

interface PsychedelicBackdropProps {
  active: boolean;
}

const TRAIL_COUNT = 10;

export const PsychedelicBackdrop: React.FC<PsychedelicBackdropProps> = ({ active }) => {
  const mainOrbRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!active) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const initialX = typeof window !== 'undefined' ? window.innerWidth * 0.25 : 320;
    const initialY = typeof window !== 'undefined' ? window.innerHeight * 0.28 : 220;

    let targetX = initialX;
    let targetY = initialY;
    let currentX = initialX;
    let currentY = initialY;
    let hasPointerMoved = false;
    let tick = 0;

    const trailPoints = Array.from({ length: TRAIL_COUNT }, () => ({
      x: initialX,
      y: initialY,
    }));

    const handlePointerMove = (e: PointerEvent) => {
      hasPointerMoved = true;
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let rafId = 0;

    const animate = () => {
      tick += 0.015;

      const goalX = hasPointerMoved
        ? targetX
        : initialX + Math.cos(tick * 0.9) * 90;
      const goalY = hasPointerMoved
        ? targetY
        : initialY + Math.sin(tick * 0.7) * 65;

      const ease = prefersReducedMotion ? 0.15 : 0.036;
      currentX += (goalX - currentX) * ease;
      currentY += (goalY - currentY) * ease;

      if (mainOrbRef.current) {
        mainOrbRef.current.style.transform = `translate3d(${currentX - 210}px, ${currentY - 210}px, 0)`;
      }

      let prevX = currentX;
      let prevY = currentY;
      const trailEase = prefersReducedMotion ? 0.45 : 0.2;

      for (let i = 0; i < TRAIL_COUNT; i++) {
        const pt = trailPoints[i];
        pt.x += (prevX - pt.x) * trailEase;
        pt.y += (prevY - pt.y) * trailEase;

        const el = trailRefs.current[i];
        if (el) {
          const progress = i / TRAIL_COUNT;
          const scale = 1 - progress * 0.68;
          el.style.transform = `translate3d(${pt.x - 190}px, ${pt.y - 190}px, 0) scale(${scale})`;
        }

        prevX = pt.x;
        prevY = pt.y;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.cancelAnimationFrame(rafId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Base cosmic aubergine gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, #3a0ca3 0%, #1d073d 42%, #110324 100%)',
        }}
      />

      {/* Ambient cyan/violet & acid-lime gradients (soft alpha falloff, zero CSS blur filter cost) */}
      <div
        className="animate-psy-b absolute top-[6%] -right-[14%] h-[78vh] w-[72vw] rounded-full opacity-55"
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,245,212,0.52) 0%, rgba(114,9,183,0.34) 40%, rgba(114,9,183,0) 70%)',
        }}
      />
      <div
        className="animate-psy-a absolute -bottom-[24%] left-[18%] h-[76vh] w-[74vw] rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle at center, rgba(204,255,0,0.42) 0%, rgba(255,46,147,0.32) 42%, rgba(255,46,147,0) 72%)',
          animationDelay: '-9s',
        }}
      />

      {/* Orange solar orb trail wake (pure radial-gradients, zero filter:blur passes for 60fps+) */}
      {Array.from({ length: TRAIL_COUNT }).map((_, idx) => {
        const progress = idx / TRAIL_COUNT;
        const opacity = Math.max(0.08, (1 - progress) * 0.44);
        return (
          <div
            key={idx}
            ref={(el) => {
              trailRefs.current[idx] = el;
            }}
            className="absolute top-0 left-0 h-[380px] w-[380px] rounded-full will-change-transform"
            style={{
              opacity,
              background:
                idx % 2 === 0
                  ? 'radial-gradient(circle at center, rgba(255,123,0,0.68) 0%, rgba(255,46,147,0.34) 42%, rgba(255,46,147,0) 72%)'
                  : 'radial-gradient(circle at center, rgba(255,183,3,0.62) 0%, rgba(255,107,0,0.32) 44%, rgba(255,107,0,0) 72%)',
            }}
          />
        );
      })}

      {/* Primary solar orange orb slowly following cursor */}
      <div
        ref={mainOrbRef}
        className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 44% 44%, rgba(255,209,102,0.85) 0%, rgba(255,123,0,0.72) 28%, rgba(255,46,147,0.34) 52%, rgba(255,46,147,0) 72%)',
        }}
      />

      {/* 70s optical wave contour lines */}
      <svg
        className="animate-psy-wave absolute inset-0 h-[110%] w-[110%] opacity-22"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="psyWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CCFF00" />
            <stop offset="50%" stopColor="#FF2E93" />
            <stop offset="100%" stopColor="#00F5D4" />
          </linearGradient>
          <linearGradient id="psyWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF7B00" />
            <stop offset="50%" stopColor="#B66DFF" />
            <stop offset="100%" stopColor="#CCFF00" />
          </linearGradient>
        </defs>
        <path
          d="M-60,180 C180,40 360,340 640,200 C920,60 1120,340 1500,150"
          fill="none"
          stroke="url(#psyWaveGrad1)"
          strokeWidth="3"
        />
        <path
          d="M-60,250 C200,110 380,410 660,270 C940,130 1140,410 1500,220"
          fill="none"
          stroke="url(#psyWaveGrad2)"
          strokeWidth="2"
        />
        <path
          d="M-60,620 C240,470 440,780 760,600 C1060,430 1220,760 1500,590"
          fill="none"
          stroke="url(#psyWaveGrad1)"
          strokeWidth="3"
        />
        <path
          d="M-60,700 C260,550 460,850 780,670 C1080,500 1240,830 1500,660"
          fill="none"
          stroke="url(#psyWaveGrad2)"
          strokeWidth="2"
        />
      </svg>

      {/* Subtle risograph dot texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 250, 240, 0.9) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
};
