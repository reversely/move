"use client";

import { useState } from "react";

import AvatarStage from "@/components/avatar/AvatarStage";
import DanceControls from "@/components/controls/DanceControls";
import MoveList from "@/components/timeline/MoveList";
import SongUploader from "@/components/upload/SongUploader";
import { analyzeSong, generateDance, uploadSong } from "@/lib/api";
import { DEFAULT_BPM, DEFAULT_TOTAL_BEATS } from "@/lib/constants";
import type { DanceDifficulty, DancePlan, DanceStyle } from "@/types/dance";

export default function HomePage() {
  const [songId, setSongId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<DanceStyle>("fun");
  const [difficulty, setDifficulty] = useState<DanceDifficulty>("easy");
  const [dancePlan, setDancePlan] = useState<DancePlan | null>(null);
  const [detectedBpm, setDetectedBpm] = useState<number>(DEFAULT_BPM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setError(null);
    setIsLoading(true);

    try {
      const result = await uploadSong(file);
      setSongId(result.songId);
      setAudioUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}${result.audioUrl}`);

      const analysis = await analyzeSong(result.songId);
      setDetectedBpm(analysis.bpm || DEFAULT_BPM);
    } catch {
      setError("Could not upload or analyze song.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!songId) {
      setError("Upload a song first.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const plan = await generateDance({
        songId,
        bpm: detectedBpm,
        style,
        difficulty,
        totalBeats: DEFAULT_TOTAL_BEATS,
      });
      setDancePlan(plan);
    } catch {
      setError("Could not generate dance.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-2xl bg-neutral-900 p-5">
          <h1 className="text-2xl font-semibold">Dance Generator MVP</h1>
          <p className="text-sm text-neutral-400">
            Upload a song, choose a vibe, and generate a simple 8 count dance.
          </p>

          <SongUploader onUpload={handleUpload} />

          <DanceControls
            style={style}
            difficulty={difficulty}
            onStyleChange={setStyle}
            onDifficultyChange={setDifficulty}
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
          >
            {isLoading ? "Working..." : "Generate Dance"}
          </button>

          <p className="text-xs text-neutral-400">Detected BPM: {detectedBpm}</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {audioUrl && <audio className="w-full" controls src={audioUrl} />}
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl bg-neutral-900 p-4">
            <AvatarStage dancePlan={dancePlan} />
          </div>

          <div className="rounded-2xl bg-neutral-900 p-4">
            <MoveList dancePlan={dancePlan} />
          </div>
        </section>
      </div>
    </main>
  );
}
