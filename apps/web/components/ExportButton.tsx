"use client";

import { useState } from "react";

type Props = {
  canvas: HTMLCanvasElement | null;
  disabled?: boolean;
  durationMs?: number;
};

let ffmpegInstance: unknown | null = null;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ canvas, disabled, durationMs = 12000 }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!canvas || isExporting) return;
    setIsExporting(true);
    try {
      const stream = canvas.captureStream(30);
      const chunks: BlobPart[] = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.start();
      await new Promise((resolve) => setTimeout(resolve, durationMs));
      recorder.stop();
      await new Promise((resolve) => {
        recorder.onstop = () => resolve(undefined);
      });

      const webmBlob = new Blob(chunks, { type: "video/webm" });
      try {
        const [{ FFmpeg }, { fetchFile }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
        if (!ffmpegInstance) {
          ffmpegInstance = new FFmpeg();
        }
        const ffmpeg = ffmpegInstance as {
          loaded: boolean;
          load: () => Promise<void>;
          writeFile: (path: string, data: Uint8Array) => Promise<void>;
          exec: (args: string[]) => Promise<void>;
          readFile: (path: string) => Promise<Uint8Array | string>;
        };
        if (!ffmpeg.loaded) await ffmpeg.load();
        await ffmpeg.writeFile("preview.webm", await fetchFile(webmBlob));
        await ffmpeg.exec([
          "-i",
          "preview.webm",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          "preview.mp4",
        ]);
        const data = await ffmpeg.readFile("preview.mp4");
        const mp4Bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
        const mp4Blob = new Blob([mp4Bytes], { type: "video/mp4" });
        downloadBlob(mp4Blob, "dance-preview.mp4");
      } catch {
        downloadBlob(webmBlob, "dance-preview.webm");
      }
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || isExporting || !canvas}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--color-border-strong)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-muted)] hover:text-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg className="h-4 w-4 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {isExporting ? "Exporting video…" : "Export for TikTok"}
    </button>
  );
}
