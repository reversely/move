"use client";

import { useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  fileName?: string | null;
  onSelect: (file: File) => void;
};

export default function AudioUploader({ disabled, fileName, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    onSelect(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        id="audio-upload"
        disabled={disabled}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav,audio/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={[
          "group flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all",
          isDragging
            ? "border-[var(--color-brand)] bg-[var(--color-brand-muted)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-bg-inset)] hover:border-[var(--color-brand-light)] hover:bg-[var(--color-brand-muted)]",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-muted)] text-[var(--color-brand)] transition-colors group-hover:bg-[var(--color-brand)] group-hover:text-white">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </span>
        <span>
          <span className="block text-sm font-semibold text-[var(--color-text)]">
            {fileName ? "Replace song" : "Drop your song here"}
          </span>
          <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
            {fileName ?? "MP3 or WAV · up to 10 min"}
          </span>
        </span>
      </button>
    </div>
  );
}
