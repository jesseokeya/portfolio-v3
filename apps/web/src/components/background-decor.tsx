export function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-70 dark:opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(0 0 0 / 0.22) 1px, transparent 1.2px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 85%)",
        }}
      />

      <div
        className="absolute -top-32 -right-32 h-[560px] w-[560px] rounded-full opacity-60 dark:opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgb(168 162 158 / 0.35), transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 -left-48 h-[460px] w-[460px] rounded-full opacity-60 dark:opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgb(120 113 108 / 0.35), transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 right-1/4 h-[420px] w-[420px] rounded-full opacity-50 dark:opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgb(245 158 11 / 0.18), transparent 70%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-400/50 dark:via-neutral-700/40 to-transparent" />
    </div>
  );
}
