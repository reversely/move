import type { AudioAnalysis, DanceStyle } from "@/lib/types";

import { pickSequence, sequenceSummaryForPrompt } from "@/lib/tiktokMoves";
import { catalogSummaryForStyle, pickTiktokMovesForPhrase, TIKTOK_MOVE_CATALOG } from "@/lib/tiktokCatalog";

export type PhrasePlan = {
  index: number;
  tiktok_moves: string[];
  accent_beats: number[];
  coaching: string;
  energy: "low" | "medium" | "high";
  stage_action?: string;
};

export type DancePlan = {
  vibe: string;
  tiktok_style: string;
  human_notes: string;
  phrases: PhrasePlan[];
};

export function buildLocalDancePlan(
  analysis: AudioAnalysis,
  style: DanceStyle,
  phraseCount: number,
): DancePlan {
  const avgOnset =
    analysis.onset_per_beat.length > 0
      ? analysis.onset_per_beat.reduce((a, b) => a + b, 0) / analysis.onset_per_beat.length
      : 0.8;
  const isBassy = analysis.spectral_bands.bass > 0.45;
  const isPercussive = analysis.percussive_ratio > 0.55;

  const vibe =
    style === "hype"
      ? "high-energy TikTok hype dance, sharp hits and wide stance"
      : style === "smooth"
        ? "smooth viral groove, rolling shoulders and hip-led motion"
        : "quirky meme-style dance, asymmetric poses and playful pauses";

  const phrases: PhrasePlan[] = Array.from({ length: phraseCount }, (_, index) => {
    const slice = analysis.onset_per_beat.slice(index * 8, index * 8 + 8);
    const accent_beats = slice
      .map((v, i) => ({ v, beat: i + 1 }))
      .filter(({ v }) => v >= avgOnset * 1.1)
      .map(({ beat }) => beat);
    const energy: PhrasePlan["energy"] =
      index < phraseCount * 0.3 ? "low" : index < phraseCount * 0.75 ? "medium" : "high";

    const stageActions = ["walk_right", "head_groove", "jump", "turn", "slide", "jump_land", "walk_left", "groove"] as const;
    return {
      index,
      tiktok_moves: pickTiktokMovesForPhrase(style, index, energy),
      accent_beats: accent_beats.length ? accent_beats : [1, 5],
      coaching: `Perform the ${pickSequence(style, index).source} 8-count — sharp hits on accents.`,
      energy,
      stage_action: stageActions[index % stageActions.length],
    };
  });

  return {
    vibe,
    tiktok_style: isPercussive ? "hit-heavy trending dance" : "flow-heavy viral choreography",
    human_notes: `BPM ${analysis.bpm.toFixed(0)}: stay upright with gravity — walk, hop, land with bent knees. Head turns on groove. ${isBassy ? "Hip-hop: weighted steps, low center." : "Light bounce, never floaty."}`,
    phrases,
  };
}

export function buildDanceAnalysisPrompt(analysis: AudioAnalysis, style: DanceStyle, phraseCount: number): string {
  const stageHints =
    "Plan grounded stage travel: walking, hops with landings, leans (never upside down), head turns, facing changes. Gravity applies — feet on floor except during jumps.";
  const catalog = TIKTOK_MOVE_CATALOG.filter((m) => m.styles.includes(style))
    .map((m) => `- ${m.name}: ${m.description}`)
    .join("\n");

  return `Analyze this audio clip and plan a TikTok / hip-hop dance for a humanoid stick figure who MOVES around the stage.
${stageHints}

Song: ${analysis.key} key, ${analysis.bpm.toFixed(1)} BPM, ${analysis.duration_seconds.toFixed(1)}s clip.
Style requested: ${style}
Phrases to plan: ${phraseCount} (each is one 8-count)

Audio data:
- Percussive ratio: ${analysis.percussive_ratio}
- Bass / mid / treble: ${analysis.spectral_bands.bass} / ${analysis.spectral_bands.mid} / ${analysis.spectral_bands.treble}
- Beat strengths (higher = harder hit): ${JSON.stringify(analysis.onset_per_beat.slice(0, 64))}

Available TikTok-style moves (pick from these names):
${catalog}

Viral 8-count references (use these structures):
${sequenceSummaryForPrompt()}

Assign each phrase a viral dance reference (Renegade, Say So, Savage, Blinding Lights, Lottery, About Damn Time, Unholy, Griddy).
Return tiktok_moves as the dance name e.g. ["Renegade", "Woah"].

Return ONLY JSON:
{
  "vibe": "short mood description",
  "tiktok_style": "what kind of viral dance this should feel like",
  "human_notes": "how a real dancer would interpret this track (weight, facing, groove)",
  "phrases": [
    {
      "index": 0,
      "tiktok_moves": ["move name", "move name"],
      "accent_beats": [1, 5],
      "coaching": "one sentence for this 8-count — include travel (walk/spin/flip) and head movement",
      "energy": "low" | "medium" | "high",
      "stage_action": "walk_left | walk_right | turn | jump | jump_land | head_groove | slide | groove"
    }
  ]
}
Plan ${phraseCount} phrases with DIFFERENT move combos and DIFFERENT stage_action per phrase. Build energy toward the end.`;
}

export function buildChoreographyFromPlanPrompt(
  analysis: AudioAnalysis,
  style: DanceStyle,
  phraseCount: number,
  plan: DancePlan,
): string {
  return `Generate stick-figure keyframe choreography from this dance plan.

DANCE PLAN:
${JSON.stringify(plan, null, 2)}

AUDIO: ${analysis.bpm} BPM, key ${analysis.key}, percussive ${analysis.percussive_ratio}
Beat strengths: ${JSON.stringify(analysis.onset_per_beat.slice(0, 64))}

Create ${phraseCount} phrases. Each phrase: beat = index*8+1, duration_beats = 8.
Keyframes at frame_offset 0, 1, 2, 3, 4, 5, 6, 7, 8 (every beat) for fluid human motion.

HUMAN BODY RULES (normalized coords, center=0,0, ankles y≈1.65-1.75):
- head y≈0, shoulders y≈0.18-0.28, hips y≈0.8-0.95, knees y≈1.05-1.35, ankles y≈1.55-1.78
- elbows bend outward naturally; wrists express TikTok hits
- one leg weighted (knee bent) while other extends — never stiff T-pose
- chest/hips counter-shift subtly; head leads or follows per move
- execute the tiktok_moves named in each phrase plan — use recognizable TikTok choreography

VIRAL TIKTOK REFERENCE (match energy and move names):
${sequenceSummaryForPrompt()}

Key moves to include across the routine:
- Renegade: cross arms → clap under → swipe → woah → dougie
- Say So: hip sway → diagonal point → body roll
- Savage: elbow pulls back → hip tick → hands up on drop
- Blinding Lights: shoulder shimmy → fist pump → step touch
- Lottery/Griddy: low bounce → hit dem folk → griddy footwork

Return ONLY JSON:
{ "phrases": [{ "beat": number, "duration_beats": 8, "keyframes": [{ "frame_offset": number, "joints": { ...13 joints... }, "stage": { "x", "y", "rotation", "flip", "facing", "head_turn" } }] }] }

Stage examples:
- walk_right: x goes -0.6 → 0.6 over 8 beats
- turn: facing changes, rotation stays between -20 and 20
- jump_land: y peaks ~0.2 then returns to 0, knees bent in joints on land
- head_groove: x near 0, head_turn oscillates -0.8 to 0.8`;
}

export function parseDancePlan(raw: unknown): DancePlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as DancePlan;
  if (!p.vibe || !Array.isArray(p.phrases)) return null;
  if (!p.phrases.every((ph) => ph && Array.isArray(ph.tiktok_moves))) return null;
  return p;
}
