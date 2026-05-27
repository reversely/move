import Logo from "@/components/Logo";

export default function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="h-20 w-auto shrink-0 sm:h-24" priority />
          <div className="min-w-0 border-l-2 border-[var(--color-brand-muted)] pl-4 sm:pl-5">
            <p className="text-pretty text-lg font-semibold leading-snug tracking-tight text-[var(--color-text)] sm:text-xl">
              Turn any song into a{" "}
              <span className="text-[var(--color-brand)]">TikTok-ready</span> dance
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
