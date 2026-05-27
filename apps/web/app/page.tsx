"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AudioUploader from "@/components/AudioUploader";
import ClipAudioPlayer, { type ClipAudioPlayerHandle } from "@/components/ClipAudioPlayer";
import ClipSelector, { defaultClipRange, phraseCountForClip } from "@/components/ClipSelector";
import ExportButton from "@/components/ExportButton";
import SiteHeader from "@/components/SiteHeader";
import StickFigureCanvas from "@/components/StickFigureCanvas";
import StyleSelector from "@/components/StyleSelector";
import { analyzeSong, generateChoreography } from "@/lib/api";
import { dancePlaybackClock } from "@/lib/dancePlayback";
import type { AudioAnalysis, Choreography, ClipRange, DanceStyle } from "@/lib/types";

export default function HomePage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sourceDuration, setSourceDuration] = useState(0);
  const [clipRange, setClipRange] = useState<ClipRange | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [style, setStyle] = useState<DanceStyle>("hype");
  const [choreography, setChoreography] = useState<Choreography | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clipAudioRef = useRef<ClipAudioPlayerHandle | null>(null);
  const autoPlayPendingRef = useRef(false);

  const clipStart = analysis?.clip_start_seconds ?? clipRange?.start ?? 0;
  const clipEnd = analysis?.clip_end_seconds ?? clipRange?.end ?? sourceDuration;
  const clipDuration = useMemo(() => {
    if (analysis?.duration_seconds && analysis.duration_seconds > 0) {
      return analysis.duration_seconds;
    }
    return Math.max(0, clipEnd - clipStart);
  }, [analysis?.duration_seconds, clipEnd, clipStart]);

  const handleFileSelect = useCallback((file: File) => {
    setAudioFile(file);
    setError(null);
    setAnalysis(null);
    setChoreography(null);
    setPlaybackTime(0);
    setIsPlaying(false);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setSourceDuration(0);
    setClipRange(null);
  }, [audioUrl]);

  async function handleAnalyze() {
    if (!audioFile || !clipRange) {
      setError("Upload a song and choose a clip section first.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setChoreography(null);
    setPlaybackTime(0);
    clipAudioRef.current?.pause();

    try {
      const result = await analyzeSong(audioFile, clipRange);
      setAnalysis(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not analyze this audio file. Check that the analyzer service is running.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!analysis) {
      setError("Analyze a clip section first.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateChoreography({
        analysis,
        style,
        phraseCount: phraseCountForClip(analysis),
      });
      setChoreography(result);
      dancePlaybackClock.relativeTime = 0;
      autoPlayPendingRef.current = true;
    } catch {
      setError("Could not generate choreography. Try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  }

  const startSyncedPlayback = useCallback(async () => {
    setPlaybackTime(0);
    await clipAudioRef.current?.playFromStart();
  }, []);

  useEffect(() => {
    if (!choreography || !autoPlayPendingRef.current) return;
    autoPlayPendingRef.current = false;
    void startSyncedPlayback();
  }, [choreography, startSyncedPlayback]);

  const phraseCount = useMemo(() => choreography?.phrases?.length ?? 0, [choreography]);
  const exportDurationMs = Math.max(3000, Math.round(clipDuration * 1000));

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <SiteHeader />

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8 lg:py-8">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Your song</h2>
            <AudioUploader
              disabled={isAnalyzing || isGenerating}
              fileName={audioFile?.name ?? null}
              onSelect={handleFileSelect}
            />

            {audioUrl && (
              <audio
                className="sr-only"
                src={audioUrl}
                preload="metadata"
                onLoadedMetadata={(event) => {
                  const duration = event.currentTarget.duration;
                  if (Number.isFinite(duration) && duration > 0) {
                    setSourceDuration(duration);
                    setClipRange((prev) => prev ?? defaultClipRange(duration));
                  }
                }}
              />
            )}

            {clipRange && sourceDuration > 0 && (
              <ClipSelector
                sourceDuration={sourceDuration}
                value={clipRange}
                audioSrc={audioUrl}
                disabled={isAnalyzing || isGenerating}
                onChange={(range) => {
                  setClipRange(range);
                  setAnalysis(null);
                  setChoreography(null);
                  setPlaybackTime(0);
                  clipAudioRef.current?.pause();
                }}
              />
            )}

            {audioFile && clipRange && (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isGenerating}
                className="mt-4 w-full rounded-2xl border border-[var(--color-brand)] bg-[var(--color-brand-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-hover)] transition-colors hover:bg-[var(--color-brand)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalyzing ? "Analyzing clip…" : analysis ? "Re-analyze clip" : "Analyze clip"}
              </button>
            )}

            {isAnalyzing && (
              <p className="mt-3 flex items-center gap-2 text-sm text-[var(--color-brand)]">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
                Analyzing beats and energy…
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]">
            <StyleSelector value={style} onChange={setStyle} disabled={!analysis || isGenerating} />

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isAnalyzing || isGenerating || !analysis}
                className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating
                  ? "Creating choreography…"
                  : choreography
                    ? "Generate new variation"
                    : "Generate dance"}
              </button>

              {choreography && clipDuration > 0 && (
                <button
                  type="button"
                  onClick={() => void startSyncedPlayback()}
                  disabled={!audioUrl}
                  className="w-full rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-inset)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-brand-light)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPlaying ? "Restart clip preview" : "Play dance + clip"}
                </button>
              )}

              <ExportButton
                canvas={canvasRef.current}
                disabled={!choreography || isGenerating || isAnalyzing}
                durationMs={exportDurationMs}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </section>

          {analysis && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Clip analysis</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-[var(--color-text-muted)]">BPM</dt>
                  <dd className="font-mono font-semibold text-[var(--color-text)]">{analysis.bpm.toFixed(0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-text-muted)]">Key</dt>
                  <dd className="font-semibold text-[var(--color-text)]">{analysis.key}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-text-muted)]">Clip</dt>
                  <dd className="font-mono font-semibold text-[var(--color-text)]">
                    {analysis.duration_seconds.toFixed(0)}s
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--color-text-muted)]">Energy</dt>
                  <dd className="font-mono font-semibold text-[var(--color-text)]">
                    {(analysis.percussive_ratio * 100).toFixed(0)}%
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </aside>

        <section className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)] lg:min-h-[780px]">
          <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Preview</h2>
            <div className="flex flex-wrap gap-2">
              {choreography?.meta?.vibe && (
                <span className="max-w-[200px] truncate rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-xs text-[var(--color-text-secondary)]" title={choreography.meta.vibe}>
                  {choreography.meta.vibe}
                </span>
              )}
              {choreography ? (
                <span className="rounded-full bg-[var(--color-brand-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-hover)]">
                  {phraseCount} phrases · {style}
                </span>
              ) : (
                <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
                  No dance yet
                </span>
              )}
              {clipDuration > 0 && (
                <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {clipDuration.toFixed(0)}s clip
                </span>
              )}
              {choreography && (
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    isPlaying
                      ? "bg-[var(--color-brand-muted)] text-[var(--color-brand-hover)]"
                      : "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]",
                  ].join(" ")}
                >
                  {isPlaying ? "Dancing" : "Paused"}
                </span>
              )}
            </div>
          </div>

          {choreography?.meta?.human_notes && (
            <p className="mb-2 w-full text-center text-xs leading-relaxed text-[var(--color-text-muted)]">
              {choreography.meta.human_notes}
            </p>
          )}

          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <StickFigureCanvas
              ref={canvasRef}
              choreography={choreography}
              bpm={analysis?.bpm ?? 120}
              playbackTime={playbackTime}
              clipDuration={clipDuration > 0 ? clipDuration : undefined}
              isPlaying={isPlaying}
              hasAnalysis={!!analysis}
            />

            {audioUrl && clipDuration > 0 ? (
              <ClipAudioPlayer
                ref={clipAudioRef}
                src={audioUrl}
                clipStart={clipStart}
                clipEnd={clipEnd}
                disabled={!clipRange}
                onPlayingChange={setIsPlaying}
                onRelativeTimeChange={setPlaybackTime}
              />
            ) : (
              <p className="text-center text-sm text-[var(--color-text-muted)]">
                Upload a song and set a clip to preview dance + audio
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
