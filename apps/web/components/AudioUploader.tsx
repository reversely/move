"use client";

type Props = {
  disabled?: boolean;
  onSelect: (file: File) => void;
};

export default function AudioUploader({ disabled, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <label htmlFor="audio-upload" className="mb-2 block text-sm font-medium">
        Upload song (MP3/WAV)
      </label>
      <input
        id="audio-upload"
        disabled={disabled}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav,audio/*"
        className="block w-full text-sm text-neutral-300"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
      <p className="mt-2 text-xs text-neutral-500">Max 10 minutes recommended for MVP performance.</p>
    </div>
  );
}
