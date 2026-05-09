"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FastForwardIcon, PauseIcon, PlayIcon, RewindIcon } from "lucide-react";
import { cn } from "../lib/utils";

type Voice = "female" | "male";
type WordTiming = { text: string; start: number; end: number };
type AudioManifest = {
  slug: string;
  voice: Voice;
  duration: number;
  words: WordTiming[];
};

type DomWord = {
  startNode: Text;
  startOffset: number;
  endNode: Text;
  endOffset: number;
  text: string;
  globalStart: number;
  globalEnd: number;
};

const SKIP_SECONDS = 15;
const FALLBACK_CHARS_PER_SECOND = 14;
const HIGHLIGHT_NAME = "reading";
const VOICES: Voice[] = ["female", "male"];
const VOICE_LABELS: Record<Voice, string> = {
  female: "Female",
  male: "Male",
};

const EXCLUDED_TAGS = new Set([
  "PRE",
  "CODE",
  "SCRIPT",
  "STYLE",
  "SVG",
  "BUTTON",
  "FIGCAPTION",
]);

// Block-level tags whose closing tag becomes a space in the server's text
// extraction (apps/web/scripts/generate-audio.mjs htmlToText). Keep this in
// sync so client tokenization matches the manifest's word stream.
const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "BLOCKQUOTE",
  "TR",
  "TD",
  "TH",
  "DIV",
  "SECTION",
  "ARTICLE",
]);

function isExcluded(node: Node) {
  let p: HTMLElement | null = node.parentElement;
  while (p) {
    if (EXCLUDED_TAGS.has(p.tagName)) return true;
    if (p.classList?.contains("mermaid")) return true;
    if (p.dataset?.audioPlayer === "true") return true;
    p = p.parentElement;
  }
  return false;
}

function closestBlockAncestor(node: Node): Element | null {
  let p: HTMLElement | null = node.parentElement;
  while (p) {
    if (BLOCK_TAGS.has(p.tagName)) return p;
    p = p.parentElement;
  }
  return null;
}

function buildDomIndex(root: HTMLElement): { words: DomWord[]; text: string } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      return isExcluded(n)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  let global = "";
  const segments: Array<{ node: Text; start: number; end: number }> = [];
  let prevBlock: Element | null = null;

  for (const tn of textNodes) {
    if (!tn.data) continue;
    const block = closestBlockAncestor(tn);
    if (
      segments.length > 0 &&
      block !== prevBlock &&
      !/\s$/.test(global) &&
      !/^\s/.test(tn.data)
    ) {
      global += " ";
    }
    const start = global.length;
    global += tn.data;
    segments.push({ node: tn, start, end: global.length });
    prevBlock = block;
  }

  // Locate which segment a global offset belongs to via binary search.
  const findSegment = (offset: number, lo = 0): number => {
    let l = lo;
    let r = segments.length - 1;
    while (l <= r) {
      const mid = (l + r) >> 1;
      const s = segments[mid];
      if (offset < s.start) r = mid - 1;
      else if (offset >= s.end) l = mid + 1;
      else return mid;
    }
    return -1;
  };

  const words: DomWord[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(global)) !== null) {
    const startG = m.index;
    const endG = startG + m[0].length;
    const startIdx = findSegment(startG);
    if (startIdx === -1) continue;
    // For the end, the last char of the word is at endG - 1.
    const endIdx = findSegment(endG - 1, startIdx);
    if (endIdx === -1) continue;
    words.push({
      startNode: segments[startIdx].node,
      startOffset: startG - segments[startIdx].start,
      endNode: segments[endIdx].node,
      endOffset: endG - segments[endIdx].start,
      text: m[0],
      globalStart: startG,
      globalEnd: endG,
    });
  }
  return { words, text: global };
}

function pickVoice(voices: SpeechSynthesisVoice[], variant: Voice) {
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = en.length ? en : voices;
  const order: Record<Voice, string[]> = {
    female: [
      "Samantha",
      "Karen",
      "Google UK English Female",
      "Microsoft Aria Online",
      "Microsoft Jenny Online",
    ],
    male: [
      "Daniel",
      "Alex",
      "Fred",
      "Google UK English Male",
      "Microsoft Guy Online",
    ],
  };
  for (const name of order[variant]) {
    const v = pool.find((x) => x.name === name);
    if (v) return v;
  }
  return pool.find((v) => v.localService) || pool[0];
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type HighlightRegistry = {
  set: (name: string, value: object) => void;
  delete: (name: string) => void;
};
type HighlightCtor = new (range: Range) => object;

function getHighlightRegistry(): HighlightRegistry | null {
  if (typeof CSS === "undefined") return null;
  return (
    (CSS as unknown as { highlights?: HighlightRegistry }).highlights ?? null
  );
}
function getHighlightCtor(): HighlightCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { Highlight?: HighlightCtor }).Highlight ?? null
  );
}
function clearHighlight() {
  getHighlightRegistry()?.delete(HIGHLIGHT_NAME);
}
function applyHighlight(range: Range) {
  const reg = getHighlightRegistry();
  const Ctor = getHighlightCtor();
  if (!reg || !Ctor) return;
  reg.set(HIGHLIGHT_NAME, new Ctor(range));
}

function findWordByTime(words: WordTiming[], time: number) {
  if (!words.length) return -1;
  let lo = 0;
  let hi = words.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid].start <= time) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function findWordByCharOffset(offsets: number[], offset: number) {
  if (!offsets.length) return 0;
  let lo = 0;
  let hi = offsets.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] <= offset) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function autoScrollTo(range: Range) {
  const rect = range.getBoundingClientRect();
  const vh = window.innerHeight;
  const center = rect.top + rect.height / 2;
  if (center < vh * 0.15 || center > vh * 0.75) {
    window.scrollTo({
      top: window.scrollY + (center - vh * 0.4),
      behavior: "smooth",
    });
  }
}

export function BlogAudioPlayer({
  rootId,
  slug,
}: {
  rootId: string;
  slug: string;
}) {
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [voice, setVoice] = useState<Voice>("female");
  const [mode, setMode] = useState<"audio" | "tts" | "loading">("loading");
  const [manifest, setManifest] = useState<AudioManifest | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const domWordsRef = useRef<DomWord[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastWordIdxRef = useRef(0);

  // TTS fallback refs
  const textRef = useRef("");
  const wordCharOffsetsRef = useRef<number[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsStartOffsetRef = useRef(0);
  const ttsCharPosRef = useRef(0);

  const articleRoot = useCallback(() => document.getElementById(rootId), [
    rootId,
  ]);

  // Build DOM word index once article is in the DOM
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = articleRoot();
    if (!root) return;
    const { words, text } = buildDomIndex(root);
    domWordsRef.current = words;
    textRef.current = text;
    wordCharOffsetsRef.current = words.map((w) => w.globalStart);
    setReady(true);
  }, [articleRoot]);

  // Try to load audio manifest for current voice
  useEffect(() => {
    let cancelled = false;
    setMode("loading");
    setManifest(null);
    setCurrentTime(0);
    setDuration(0);
    lastWordIdxRef.current = 0;

    fetch(`/audio/${slug}.${voice}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.json();
      })
      .then((m: AudioManifest) => {
        if (cancelled) return;
        setManifest(m);
        setDuration(m.duration);
        setMode("audio");
      })
      .catch(() => {
        if (cancelled) return;
        if (
          typeof window !== "undefined" &&
          typeof window.speechSynthesis !== "undefined"
        ) {
          setMode("tts");
        } else {
          setSupported(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, voice]);

  // When in TTS mode, set duration estimate based on text length
  useEffect(() => {
    if (mode !== "tts") return;
    setDuration((textRef.current.length || 0) / FALLBACK_CHARS_PER_SECOND);
  }, [mode, ready]);

  const highlightDomWord = useCallback((idx: number) => {
    const dom = domWordsRef.current[idx];
    if (!dom || !dom.startNode.parentNode || !dom.endNode.parentNode) return;
    const range = document.createRange();
    range.setStart(dom.startNode, dom.startOffset);
    range.setEnd(dom.endNode, dom.endOffset);
    applyHighlight(range);
    autoScrollTo(range);
  }, []);

  // Wire audio element
  useEffect(() => {
    if (mode !== "audio" || !manifest) return;
    const audio = new Audio(`/audio/${slug}.${voice}.mp3`);
    audio.preload = "auto";
    audioRef.current = audio;

    const sync = (t: number) => {
      const manifestTime = Math.max(0, Math.min(manifest.duration, t));
      setCurrentTime(manifestTime);
      const idx = findWordByTime(manifest.words, manifestTime);
      lastWordIdxRef.current = idx;
      highlightDomWord(idx);
    };
    const onTime = () => sync(audio.currentTime);
    const onSeeked = () => sync(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      lastWordIdxRef.current = 0;
      clearHighlight();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audioRef.current = null;
    };
  }, [mode, manifest, slug, voice, highlightDomWord]);

  // Cleanup speech synthesis on unmount or mode/voice change
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearHighlight();
    };
  }, []);

  // Hide the AskBenny convai widget while reading aloud
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("audio-playing", isPlaying);
    return () => {
      document.body.classList.remove("audio-playing");
    };
  }, [isPlaying]);

  // ---- AUDIO mode controls ----
  const audioToggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };
  const audioSeek = (t: number) => {
    const a = audioRef.current;
    if (!a || !manifest) return;
    const safe = Math.max(0, Math.min(manifest.duration, t));
    a.currentTime = safe;
    setCurrentTime(safe);
    const idx = findWordByTime(manifest.words, safe);
    lastWordIdxRef.current = idx;
    highlightDomWord(idx);
  };
  const audioSkip = (sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    audioSeek(a.currentTime + sec);
  };

  // ---- TTS mode controls ----
  const ttsSpeakFrom = useCallback(
    (offset: number, autoplay: boolean) => {
      if (typeof window === "undefined") return;
      const total = textRef.current.length;
      if (!total) return;
      const requested = Math.max(0, Math.min(offset, total - 1));
      const offsets = wordCharOffsetsRef.current;
      const initialIdx = findWordByCharOffset(offsets, requested);
      const safe = offsets[initialIdx] ?? requested;
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      ttsStartOffsetRef.current = safe;
      ttsCharPosRef.current = safe;
      setCurrentTime(safe / FALLBACK_CHARS_PER_SECOND);

      // Highlight word at offset
      lastWordIdxRef.current = initialIdx;
      highlightDomWord(initialIdx);

      if (!autoplay) {
        setIsPlaying(false);
        return;
      }
      const slice = textRef.current.slice(safe);
      if (!slice.trim()) {
        setIsPlaying(false);
        return;
      }
      const utter = new SpeechSynthesisUtterance(slice);
      const v = pickVoice(window.speechSynthesis.getVoices(), voice);
      if (v) utter.voice = v;
      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 1;
      utter.onboundary = (e) => {
        if (typeof e.charIndex !== "number") return;
        const global = ttsStartOffsetRef.current + e.charIndex;
        ttsCharPosRef.current = global;
        setCurrentTime(global / FALLBACK_CHARS_PER_SECOND);
        const i = findWordByCharOffset(wordCharOffsetsRef.current, global);
        lastWordIdxRef.current = i;
        highlightDomWord(i);
      };
      utter.onend = () => {
        utteranceRef.current = null;
        setIsPlaying(false);
        setCurrentTime(0);
        ttsCharPosRef.current = 0;
        lastWordIdxRef.current = 0;
        clearHighlight();
      };
      utter.onerror = () => {
        utteranceRef.current = null;
        setIsPlaying(false);
      };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
      setIsPlaying(true);
    },
    [highlightDomWord, voice]
  );

  const ttsToggle = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      ttsSpeakFrom(ttsCharPosRef.current, true);
    }
  };
  const ttsSkip = (sec: number) => {
    const delta = sec * FALLBACK_CHARS_PER_SECOND;
    const next = Math.max(
      0,
      Math.min(textRef.current.length - 1, ttsCharPosRef.current + delta)
    );
    ttsSpeakFrom(next, isPlaying);
  };
  const ttsSeek = (frac: number) => {
    const next = Math.floor(
      Math.max(0, Math.min(1, frac)) * (textRef.current.length || 0)
    );
    ttsSpeakFrom(next, isPlaying);
  };

  // ---- Unified controls ----
  const onToggle = () => (mode === "audio" ? audioToggle() : ttsToggle());
  const onSkip = (sec: number) =>
    mode === "audio" ? audioSkip(sec) : ttsSkip(sec);
  const onSeekFrac = (frac: number) => {
    if (mode === "audio") audioSeek(frac * duration);
    else ttsSeek(frac);
  };

  // Voice switch — save current fractional position, swap manifest, resume
  const onVoiceChange = (next: Voice) => {
    if (next === voice) return;
    const wasPlaying = isPlaying;
    if (mode === "audio" && audioRef.current) {
      audioRef.current.pause();
    } else if (mode === "tts" && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    // Hold position as fractional progress; restored after manifest loads
    pendingResumeRef.current = wasPlaying;
    pendingFractionRef.current = duration > 0 ? currentTime / duration : 0;
    setVoice(next);
  };

  const pendingResumeRef = useRef(false);
  const pendingFractionRef = useRef(0);

  // After audio loads on voice swap, resume at saved fraction
  useEffect(() => {
    if (mode !== "audio" || !audioRef.current || !manifest) return;
    if (!pendingFractionRef.current && !pendingResumeRef.current) return;
    const a = audioRef.current;
    const seekTo = pendingFractionRef.current * manifest.duration;
    const handler = () => {
      a.currentTime = Math.max(0, Math.min(manifest.duration, seekTo));
      if (pendingResumeRef.current) a.play().catch(() => {});
      pendingFractionRef.current = 0;
      pendingResumeRef.current = false;
      a.removeEventListener("loadedmetadata", handler);
    };
    if (a.readyState >= 1) handler();
    else a.addEventListener("loadedmetadata", handler);
  }, [mode, manifest]);

  if (!supported) return null;

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const isLoading = mode === "loading" || !ready;
  const isPremium = mode === "audio";

  return (
    <div
      data-audio-player="true"
      className={cn(
        "flex flex-col gap-2 mb-8 max-w-[650px] p-2.5 sm:p-3 rounded-xl border backdrop-blur-md sticky top-3 z-30 transition-shadow",
        isPlaying
          ? "border-neutral-300 dark:border-neutral-700 bg-background/85 shadow-md shadow-neutral-900/5 dark:shadow-black/20"
          : "border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause article audio" : "Play article audio"}
          aria-pressed={isPlaying}
          className={cn(
            "shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full",
            "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900",
            "transition-transform duration-150 hover:scale-105 active:scale-95",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4 ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSkip(-SKIP_SECONDS)}
          disabled={isLoading}
          aria-label={`Rewind ${SKIP_SECONDS} seconds`}
          title={`Back ${SKIP_SECONDS}s`}
          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors disabled:opacity-50"
        >
          <RewindIcon className="h-3.5 w-3.5" />
        </button>

        <ProgressBar value={progress} onSeek={onSeekFrac} disabled={isLoading} />

        <button
          type="button"
          onClick={() => onSkip(SKIP_SECONDS)}
          disabled={isLoading}
          aria-label={`Forward ${SKIP_SECONDS} seconds`}
          title={`Ahead ${SKIP_SECONDS}s`}
          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors disabled:opacity-50"
        >
          <FastForwardIcon className="h-3.5 w-3.5" />
        </button>

        <span className="hidden sm:block text-[11px] tabular-nums text-neutral-500 dark:text-neutral-500 shrink-0 min-w-[78px] text-right">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-500">
        <div
          role="radiogroup"
          aria-label="Voice"
          className="inline-flex p-0.5 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50"
        >
          {VOICES.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={voice === v}
              onClick={() => onVoiceChange(v)}
              className={cn(
                "px-2.5 py-0.5 rounded-full transition-colors text-[11px] font-medium",
                voice === v
                  ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              )}
            >
              {VOICE_LABELS[v]}
            </button>
          ))}
        </div>
        <span className="tabular-nums">
          {isLoading
            ? "Loading…"
            : isPremium
              ? "AI voice"
              : "System voice"}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  onSeek,
  disabled,
}: {
  value: number;
  onSeek: (v: number) => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const valueAtClient = (clientX: number) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSeek(valueAtClient(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || disabled) return;
    onSeek(valueAtClient(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.shiftKey ? 0.05 : 0.02;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSeek(Math.max(0, value - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onSeek(Math.min(1, value + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSeek(1);
    }
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      role="slider"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "group relative flex-1 h-6 flex items-center cursor-pointer touch-none focus:outline-none",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="relative w-full h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-visible">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-neutral-900 dark:bg-neutral-100"
          style={{ width: `${value * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-neutral-900 dark:bg-neutral-100 shadow-sm opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
          style={{ left: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
