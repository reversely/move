"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export type ClipAudioPlayerHandle = {
  playFromStart: () => Promise<void>;
  pause: () => void;
};

type Props = {
  src: string;
  clipStart: number;
  clipEnd: number;
  disabled?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onRelativeTimeChange?: (seconds: number) => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ClipAudioPlayer = forwardRef<ClipAudioPlayerHandle, Props>(function ClipAudioPlayer(
  { src, clipStart, clipEnd, disabled, onPlayingChange, onRelativeTimeChange },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [relativeTime, setRelativeTime] = useState(0);

  const clipDuration = Math.max(0, clipEnd - clipStart);

  const emitRelative = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, clipDuration));
      setRelativeTime(clamped);
      onRelativeTimeChange?.(clamped);
    },
    [clipDuration, onRelativeTimeChange],
  );

  const setPlaying = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      onPlayingChange?.(playing);
    },
    [onPlayingChange],
  );

  const stopAtClipEnd = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = clipStart;
    emitRelative(0);
    setPlaying(false);
  }, [clipStart, emitRelative, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.currentTime < clipStart) {
        audio.currentTime = clipStart;
      }
      if (audio.currentTime >= clipEnd - 0.05) {
        stopAtClipEnd();
        return;
      }
      emitRelative(audio.currentTime - clipStart);
    };

    const onPlay = () => {
      if (audio.currentTime < clipStart || audio.currentTime >= clipEnd) {
        audio.currentTime = clipStart;
        emitRelative(0);
      }
      setPlaying(true);
    };

    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [clipStart, clipEnd, emitRelative, setPlaying, stopAtClipEnd]);

  useEffect(() => {
    emitRelative(0);
    setPlaying(false);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = clipStart;
    }
  }, [src, clipStart, clipEnd, emitRelative, setPlaying]);

  useImperativeHandle(
    ref,
    () => ({
      playFromStart: async () => {
        const audio = audioRef.current;
        if (!audio || clipDuration <= 0) return;
        audio.currentTime = clipStart;
        emitRelative(0);
        try {
          await audio.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      },
      pause: () => {
        audioRef.current?.pause();
        setPlaying(false);
      },
    }),
    [clipDuration, clipStart, emitRelative, setPlaying],
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || disabled || clipDuration <= 0) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (relativeTime >= clipDuration - 0.1) {
      audio.currentTime = clipStart;
      emitRelative(0);
    } else if (audio.currentTime < clipStart || audio.currentTime >= clipEnd) {
      audio.currentTime = clipStart;
      emitRelative(0);
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [clipDuration, clipEnd, clipStart, disabled, emitRelative, isPlaying, relativeTime, setPlaying]);

  const handleScrub = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio) return;
      const next = Number(event.target.value);
      audio.currentTime = clipStart + next;
      emitRelative(next);
    },
    [clipStart, emitRelative],
  );

  return (
    <div className="w-full max-w-sm space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-inset)] p-3">
      <audio ref={audioRef} src={src} preload="metadata" className="sr-only" />

      <p className="text-center text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        Clip preview only
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || clipDuration <= 0}
          onClick={() => void togglePlay()}
          aria-label={isPlaying ? "Pause clip" : "Play clip"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(clipDuration))}
            step={0.1}
            disabled={disabled || clipDuration <= 0}
            value={relativeTime}
            onChange={handleScrub}
            className="w-full accent-[var(--color-brand)] disabled:opacity-40"
            aria-label="Clip playback position"
          />
          <div className="flex justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
            <span>{formatTime(relativeTime)}</span>
            <span>{formatTime(clipDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ClipAudioPlayer;
