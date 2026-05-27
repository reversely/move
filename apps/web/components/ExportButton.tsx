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
        // Fallback keeps export functional even if wasm conversion fails on a browser/runtime.
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
      className="w-full rounded-xl bg-fuchsia-500 px-4 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? "Exporting..." : "Export MP4"}
    </button>
  );
}
