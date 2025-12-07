"use client";

import mermaid from "mermaid";
import { useEffect } from "react";

export function MermaidScript() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "inherit",
    });
    mermaid.contentLoaded();
  }, []);

  return null;
}

