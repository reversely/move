"use client";

import { useMemo, useRef, useState } from "react";

import AudioUploader from "@/components/AudioUploader";
import ExportButton from "@/components/ExportButton";
import StickFigureCanvas from "@/components/StickFigureCanvas";
import StyleSelector from "@/components/StyleSelector";
import { analyzeSong, generateChoreography } from "@/lib/api";
import type { AudioAnalysis, Choreography, DanceStyle } from "@/lib/types";

export default function HomePage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [style, setStyle] = useState<DanceStyle>("hype");
  const [choreography, setChoreography] = useState<Choreography | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleAnalyze(file: File) {
    setAudioFile(file);
    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeSong(file);
      setAnalysis(result);
      setAudioUrl(URL.createObjectURL(file));
      setChoreography(null);
    } catch {
      setError("Could not analyze this audio file.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!analysis) {
      setError("Analyze a song first.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateChoreography({
        analysis,
        style,
        phraseCount: 8,
      });
      setChoreography(result);
    } catch {
      setError("Could not generate choreography.");
    } finally {
      setIsGenerating(false);
    }
  }

  const phraseCount = useMemo(() => choreography?.phrases?.length ?? 0, [choreography]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
          <h1 className="text-2xl font-semibold">AI Dance Generator</h1>
          <p className="text-sm text-neutral-400">
            Upload a song, analyze audio features, generate choreography, and export a TikTok-ready video.
          </p>

          <AudioUploader disabled={isAnalyzing || isGenerating} onSelect={handleAnalyze} />
          <StyleSelector value={style} onChange={setStyle} disabled={isGenerating} />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isAnalyzing || isGenerating || !analysis}
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Choreography"}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isAnalyzing || isGenerating || !analysis}
            className="w-full rounded-xl border border-neutral-700 px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Regenerate Variation"}
          </button>

          <ExportButton canvas={canvasRef.current} disabled={!choreography || isGenerating || isAnalyzing} />

          {analysis && (
            <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 text-xs text-neutral-300">
              <p>BPM: {analysis.bpm.toFixed(2)}</p>
              <p>Key: {analysis.key}</p>
              <p>Percussive Ratio: {analysis.percussive_ratio.toFixed(2)}</p>
              <p>
                Spectral Bands: bass {analysis.spectral_bands.bass.toFixed(2)}, mid {analysis.spectral_bands.mid.toFixed(2)},
                treble {analysis.spectral_bands.treble.toFixed(2)}
              </p>
              <p>Duration: {analysis.duration_seconds.toFixed(1)}s</p>
            </div>
          )}

          {audioFile && <p className="text-xs text-neutral-500">Loaded: {audioFile.name}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
            <StickFigureCanvas
              ref={canvasRef}
              choreography={choreography}
              bpm={analysis?.bpm ?? 120}
              audioTime={audioTime}
              isPlaying={isPlaying}
            />
            <div className="w-full space-y-3">
              <h2 className="text-lg font-semibold">Preview</h2>
              <p className="text-sm text-neutral-400">
                1080x1920 stick-figure render with keyframe interpolation and beat-locked timing.
              </p>
              {audioUrl && (
                <audio
                  ref={audioRef}
                  className="w-full"
                  controls
                  src={audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onTimeUpdate={(event) => setAudioTime(event.currentTarget.currentTime)}
                />
              )}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 text-xs text-neutral-300">
                <p>Style: {style}</p>
                <p>Phrases: {phraseCount}</p>
                <p>Audio time: {audioTime.toFixed(2)}s</p>
                <p>Status: {isPlaying ? "Playing" : "Paused"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 text-xs text-neutral-300">
            <p className="font-medium">Workflow</p>
            <p>1) Upload 2) Analyze 3) Generate 4) Preview 5) Export MP4</p>
          </div>
        </section>
      </div>
    </main>
  );
}
