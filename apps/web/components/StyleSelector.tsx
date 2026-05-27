"use client";

import type { DanceStyle } from "@/lib/types";

const STYLES: { value: DanceStyle; label: string; description: string }[] = [
  { value: "hype", label: "Hype", description: "High energy, sharp hits" },
  { value: "smooth", label: "Smooth", description: "Flowing, controlled motion" },
  { value: "quirky", label: "Quirky", description: "Playful, unexpected moves" },
];

type Props = {
  value: DanceStyle;
  onChange: (style: DanceStyle) => void;
  disabled?: boolean;
};

export default function StyleSelector({ value, onChange, disabled }: Props) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-semibold text-[var(--color-text)]">Dance style</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {STYLES.map((style) => {
          const selected = value === style.value;
          return (
            <button
              key={style.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(style.value)}
              aria-pressed={selected}
              className={[
                "rounded-2xl border px-3 py-2.5 text-left transition-all",
                selected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-muted)] ring-2 ring-[var(--color-brand)]/20"
                  : "border-[var(--color-border)] bg-[var(--color-bg-inset)] hover:border-[var(--color-brand-light)] hover:bg-[var(--color-brand-muted)]",
                disabled ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold text-[var(--color-text)]">{style.label}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{style.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
