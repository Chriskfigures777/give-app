"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function GiveCompleteConfetti() {
  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#14b8a6", "#34d399", "#6ee7b7"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#14b8a6", "#34d399", "#6ee7b7"],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return null;
}
