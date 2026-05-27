"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { AudioAnalysis, ClipRange } from "@/lib/types";

const MIN_CLIP_SECONDS = 5;
const MAX_CLIP_SECONDS = 60;

type Props = {
  sourceDuration: number;
  value: ClipRange;
  audioSrc?: string | null;
  disabled?: boolean;
  onChange: (range: ClipRange) => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Snap to whole seconds so native range inputs and drag math stay in sync. */
function snapSeconds(seconds: number): number {
  return Math.round(seconds);
}

export function clampClipRange(sourceDuration: number, range: ClipRange): ClipRange {
  const maxDuration = Math.max(sourceDuration, MIN_CLIP_SECONDS);
  let start = snapSeconds(range.start);
  let end = snapSeconds(range.end);

  start = Math.max(0, Math.min(start, maxDuration - MIN_CLIP_SECONDS));
  end = Math.max(start + MIN_CLIP_SECONDS, Math.min(end, maxDuration));

  if (end - start > MAX_CLIP_SECONDS) {
    end = start + MAX_CLIP_SECONDS;
  }

  return { start, end };
}

type DragMode = "start" | "end" | "move" | null;

export default function ClipSelector({
  sourceDuration,
  value,
  audioSrc,
  disabled,
  onChange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    pointerId: number;
    anchorTime: number;
    rangeAtDrag: ClipRange;
  } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);

  const range = clampClipRange(sourceDuration, value);
  const clipLength = range.end - range.start;

  useEffect(() => {
    const clamped = clampClipRange(sourceDuration, value);
    if (clamped.start !== value.start || clamped.end !== value.end) {
      onChange(clamped);
    }
  }, [sourceDuration, value.start, value.end, onChange]);

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || sourceDuration <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snapSeconds(ratio * sourceDuration);
    },
    [sourceDuration],
  );

  const applyDrag = useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag || !drag.mode) return;

      const time = timeFromClientX(clientX);
      const { rangeAtDrag } = drag;

      if (drag.mode === "start") {
        onChange(clampClipRange(sourceDuration, { start: time, end: rangeAtDrag.end }));
        return;
      }

      if (drag.mode === "end") {
        onChange(clampClipRange(sourceDuration, { start: rangeAtDrag.start, end: time }));
        return;
      }

      const delta = time - drag.anchorTime;
      const length = rangeAtDrag.end - rangeAtDrag.start;
      let nextStart = rangeAtDrag.start + delta;
      let nextEnd = rangeAtDrag.end + delta;

      if (nextStart < 0) {
        nextStart = 0;
        nextEnd = length;
      }
      if (nextEnd > sourceDuration) {
        nextEnd = sourceDuration;
        nextStart = nextEnd - length;
      }

      onChange(clampClipRange(sourceDuration, { start: nextStart, end: nextEnd }));
    },
    [onChange, sourceDuration, timeFromClientX],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const startDrag = useCallback(
    (mode: DragMode, event: React.PointerEvent) => {
      if (disabled || !mode) return;
      event.preventDefault();
      event.stopPropagation();

      dragRef.current = {
        mode,
        pointerId: event.pointerId,
        anchorTime: timeFromClientX(event.clientX),
        rangeAtDrag: range,
      };
      applyDrag(event.clientX);

      const onMove = (ev: PointerEvent) => {
        if (dragRef.current?.pointerId !== ev.pointerId) return;
        applyDrag(ev.clientX);
      };
      const onUp = (ev: PointerEvent) => {
        if (dragRef.current?.pointerId !== ev.pointerId) return;
        endDrag();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [applyDrag, disabled, endDrag, range, timeFromClientX],
  );

  const handleTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.dataset.handle) return;

      const time = timeFromClientX(event.clientX);
      const clamped = Math.max(range.start, Math.min(time, range.end));
      setPlayhead(clamped);
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
    },
    [disabled, range.end, range.start, timeFromClientX],
  );

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
    setPlayhead(null);
  }, []);

  const togglePreview = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (isPlaying) {
      stopPreview();
      return;
    }

    audio.currentTime = range.start;
    setPlayhead(range.start);
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [audioSrc, isPlaying, range.start, stopPreview]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setPlayhead(t);
      if (t >= range.end - 0.05) {
        audio.pause();
        audio.currentTime = range.start;
        setPlayhead(range.start);
        setIsPlaying(false);
      }
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, [range.end, range.start]);

  useEffect(() => {
    stopPreview();
  }, [range.start, range.end, audioSrc, stopPreview]);

  if (sourceDuration <= 0) return null;

  const startPct = (range.start / sourceDuration) * 100;
  const endPct = (range.end / sourceDuration) * 100;
  const playheadPct =
    playhead !== null && sourceDuration > 0 ? (playhead / sourceDuration) * 100 : null;

  const timelineId = useId();

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-inset)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[var(--color-text)]">Clip for dance</h3>
        <span className="font-mono text-xs text-[var(--color-brand)]">
          {formatTime(clipLength)} selected
        </span>
      </div>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="metadata" className="sr-only" />
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[var(--color-text-secondary)]">
          <span>{formatTime(range.start)}</span>
          <span className="text-[var(--color-text-muted)]">Full song {formatTime(sourceDuration)}</span>
          <span>{formatTime(range.end)}</span>
        </div>

        <div
          ref={trackRef}
          id={timelineId}
          role="group"
          aria-label="Clip timeline"
          className={[
            "relative h-12 select-none rounded-xl bg-[var(--color-border)] touch-none",
            disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          ].join(" ")}
          onPointerDown={handleTrackPointerDown}
        >
          <div className="absolute inset-y-3 inset-x-1 rounded-lg bg-[var(--color-bg-subtle)]" />

          <div
            className="absolute inset-y-3 rounded-lg bg-[var(--color-brand-muted)]"
            style={{ left: `calc(${startPct}% + 4px)`, width: `calc(${endPct - startPct}% - 8px)` }}
            data-handle="selection"
            onPointerDown={(e) => startDrag("move", e)}
          />

          {playheadPct !== null && playheadPct >= startPct && playheadPct <= endPct && (
            <div
              className="pointer-events-none absolute inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-[var(--color-brand)]"
              style={{ left: `${playheadPct}%` }}
              aria-hidden
            />
          )}

          <button
            type="button"
            data-handle="start"
            disabled={disabled}
            aria-label={`Clip start ${formatTime(range.start)}`}
            className="absolute top-1/2 z-10 h-8 w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-[var(--color-brand)] shadow-sm transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] disabled:pointer-events-none"
            style={{ left: `${startPct}%` }}
            onPointerDown={(e) => startDrag("start", e)}
          />

          <button
            type="button"
            data-handle="end"
            disabled={disabled}
            aria-label={`Clip end ${formatTime(range.end)}`}
            className="absolute top-1/2 z-10 h-8 w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-[var(--color-brand)] shadow-sm transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] disabled:pointer-events-none"
            style={{ left: `${endPct}%` }}
            onPointerDown={(e) => startDrag("end", e)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || !audioSrc}
          onClick={() => void togglePreview()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-brand-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden className="text-sm leading-none">
            {isPlaying ? "⏸" : "▶"}
          </span>
          {isPlaying ? "Stop clip preview" : "Preview clip"}
        </button>

        <label className="flex min-w-[7rem] flex-1 flex-col gap-1 text-xs text-[var(--color-text-secondary)]">
          <span>Start (sec)</span>
          <input
            type="number"
            min={0}
            max={Math.max(0, sourceDuration - MIN_CLIP_SECONDS)}
            step={1}
            disabled={disabled}
            value={range.start}
            onChange={(e) =>
              onChange(clampClipRange(sourceDuration, { start: Number(e.target.value), end: range.end }))
            }
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 font-mono text-sm disabled:opacity-40"
          />
        </label>

        <label className="flex min-w-[7rem] flex-1 flex-col gap-1 text-xs text-[var(--color-text-secondary)]">
          <span>End (sec)</span>
          <input
            type="number"
            min={range.start + MIN_CLIP_SECONDS}
            max={Math.min(sourceDuration, range.start + MAX_CLIP_SECONDS)}
            step={1}
            disabled={disabled}
            value={range.end}
            onChange={(e) =>
              onChange(clampClipRange(sourceDuration, { start: range.start, end: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 font-mono text-sm disabled:opacity-40"
          />
        </label>
      </div>
    </div>
  );
}

export function defaultClipRange(sourceDuration: number): ClipRange {
  const end = Math.min(sourceDuration, MAX_CLIP_SECONDS);
  return clampClipRange(sourceDuration, { start: 0, end: Math.max(MIN_CLIP_SECONDS, end) });
}

export function phraseCountForClip(analysis: AudioAnalysis): number {
  const clipSeconds =
    analysis.duration_seconds > 0
      ? analysis.duration_seconds
      : analysis.clip_end_seconds - analysis.clip_start_seconds;
  const beats = (clipSeconds * analysis.bpm) / 60;
  return Math.min(12, Math.max(2, Math.ceil(beats / 8)));
}
