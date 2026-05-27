"use client";

type Props = {
  onUpload: (file: File) => void;
};

export default function SongUploader({ onUpload }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <label className="mb-2 block text-sm font-medium">Upload song</label>
      <input
        type="file"
        accept="audio/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
        }}
        className="block w-full text-sm text-neutral-300"
      />
    </div>
  );
}
