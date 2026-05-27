"use client";

import type { DancePlan } from "@/types/dance";

export default function DanceTimeline({ dancePlan }: { dancePlan: DancePlan | null }) {
  if (!dancePlan) {
    return null;
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-3">
      <p className="mb-2 text-xs uppercase text-neutral-400">Timeline</p>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: dancePlan.totalBeats }, (_, index) => (
          <div key={index} className="h-2 rounded bg-neutral-700" />
        ))}
      </div>
    </div>
  );
}
