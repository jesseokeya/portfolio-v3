"use client";

import { useEffect } from "react";

const THRESHOLD = 4;

export function ScrollWatcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    const update = () => {
      ticking = false;
      document.body.classList.toggle("scrolled", window.scrollY > THRESHOLD);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("scrolled");
    };
  }, []);

  return null;
}
