import React, { useEffect, useRef } from "react";

export default function InteractiveDotsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const spacing = 34;
    const hoverRadius = 150;
    const mouse = { x: -9999, y: -9999, active: false };
    let dots = [];
    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastFrameTime = 0;

    const buildDots = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = (height - (rows - 1) * spacing) / 2;

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const seed = (r * 73 + c * 137) % 100;
          dots.push({
            x: offsetX + c * spacing,
            y: offsetY + r * spacing,
            phase: (seed / 100) * Math.PI * 2,
            speed: 0.0009 + (seed % 7) * 0.00018,
            glow: 0,
          });
        }
      }
    };

    const drawFrame = (now) => {
      if (document.hidden) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }

      if (now - lastFrameTime < 32 && !prefersReducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      lastFrameTime = now;

      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      const baseRgb = isDark ? "139, 149, 179" : "118, 117, 134";
      const primaryRgb = isDark ? "116, 122, 255" : "70, 72, 212";
      const accentRgb = isDark ? "52, 211, 153" : "0, 136, 93";

      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        const wave = prefersReducedMotion
          ? 0.5
          : (Math.sin(now * dot.speed + dot.phase) + 1) * 0.5;

        let targetGlow = 0;
        if (mouse.active) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < hoverRadius * hoverRadius) {
            const dist = Math.sqrt(distSq);
            targetGlow = 1 - dist / hoverRadius;
          }
        }

        dot.glow += (targetGlow - dot.glow) * 0.18;

        const baseAlpha = (isDark ? 0.14 : 0.11) + wave * (isDark ? 0.22 : 0.18);
        const radius = 1.4 + wave * 0.5 + dot.glow * 1.9;

        if (dot.glow > 0.03) {
          const useAccent = i % 5 === 0;
          const rgb = useAccent ? accentRgb : primaryRgb;
          const alpha = Math.min(0.95, baseAlpha + dot.glow * 0.78);

          if (dot.glow > 0.3) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius + 4.2 * dot.glow, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb}, ${(dot.glow * 0.24).toFixed(3)})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${baseRgb}, ${baseAlpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    buildDots();
    rafId = requestAnimationFrame(drawFrame);

    window.addEventListener("resize", buildDots);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", buildDots);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
