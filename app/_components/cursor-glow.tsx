"use client";

import { useEffect } from "react";

export function CursorGlow() {
  useEffect(() => {
    const root = document.documentElement;
    let rafId: number | null = null;
    let nextX = 0;
    let nextY = 0;

    const flush = () => {
      root.style.setProperty("--cursor-x", `${nextX}px`);
      root.style.setProperty("--cursor-y", `${nextY}px`);
      root.classList.add("cursor-active");
      rafId = null;
    };

    const handleMove = (event: MouseEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;

      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    const handleLeave = () => {
      root.classList.remove("cursor-active");
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return null;
}
