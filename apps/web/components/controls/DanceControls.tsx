"use client";

import type { DanceDifficulty, DanceStyle } from "@/types/dance";

type Props = {
  style: DanceStyle;
  difficulty: DanceDifficulty;
  onStyleChange: (style: DanceStyle) => void;
  onDifficultyChange: (difficulty: DanceDifficulty) => void;
};

export default function DanceControls({
  style,
  difficulty,
  onStyleChange,
  onDifficultyChange,
}: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-neutral-800 p-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Style</label>
        <select
          value={style}
          onChange={(event) => onStyleChange(event.target.value as DanceStyle)}
          className="w-full rounded-lg bg-neutral-800 p-2"
        >
          <option value="fun">Fun</option>
          <option value="cool">Cool</option>
          <option value="cute">Cute</option>
          <option value="high_energy">High energy</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Difficulty</label>
        <select
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value as DanceDifficulty)}
          className="w-full rounded-lg bg-neutral-800 p-2"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
    </div>
  );
}
