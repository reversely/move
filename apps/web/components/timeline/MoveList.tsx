"use client";

import type { DancePlan } from "@/types/dance";

export default function MoveList({ dancePlan }: { dancePlan: DancePlan | null }) {
  if (!dancePlan) {
    return <p className="text-sm text-neutral-400">No dance generated yet.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dance Breakdown</h2>
        <span className="text-sm text-neutral-400">{dancePlan.bpm} BPM</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {dancePlan.moves.map((move) => (
          <div key={move.id} className="rounded-xl border border-neutral-800 p-3">
            <p className="text-sm text-neutral-400">
              Counts {move.startBeat} to {move.endBeat}
            </p>
            <p className="font-medium">{move.label}</p>
            <p className="mt-1 text-xs text-neutral-500">Clip: {move.animationClip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
