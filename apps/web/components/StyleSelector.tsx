"use client";

import type { DanceStyle } from "@/lib/types";

type Props = {
  value: DanceStyle;
  onChange: (style: DanceStyle) => void;
  disabled?: boolean;
};

export default function StyleSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <label className="mb-2 block text-sm font-medium" htmlFor="style">
        Style
      </label>
      <select
        id="style"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value as DanceStyle)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
      >
        <option value="hype">Hype</option>
        <option value="smooth">Smooth</option>
        <option value="quirky">Quirky</option>
      </select>
    </div>
  );
}
