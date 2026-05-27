import { BASE_POSE } from "@/lib/basePose";
import { sequenceSummaryForPrompt } from "@/lib/tiktokMoves";

/** Shared skeleton spec for Claude choreography generation. */
export const SKELETON_JOINT_SPEC = `SKELETON (13 joints, normalized coords — center of hips ≈ (0, 0.85)):
- head: above shoulders, y≈0 to 0.06
- shoulder_l / shoulder_r: y≈0.18–0.28, x≈±0.28–0.42 (wide for hits)
- elbow_l / elbow_r: bend OUTWARD (elbows never cross torso unnaturally)
- wrist_l / wrist_r: express hits — sharp on accents, relaxed between
- hip_l / hip_r: y≈0.82–0.98, counter-shift vs shoulders for groove
- knee_l / knee_r: one bent (weighted leg), one straighter — NEVER both locked straight
- ankle_l / ankle_r: y≈1.55–1.78, feet on floor unless jump phrase

BONE LENGTHS (keep consistent — renderer enforces these):
- upper arm ~0.28, forearm ~0.30
- thigh ~0.40, shin ~0.48
- shoulder width ~0.55–0.65`;

export const TIKTOK_MOTION_QUALITY = `TIKTOK MOTION QUALITY (critical):
- Every half-beat should read on camera — no frozen poses for 2+ beats
- Accents: snap wrists/elbows on beat 1 & 5; anticipation pose 0.5 beat BEFORE (pull back)
- Groove: hips lead, shoulders follow; head can lead sharp hits (woah, point)
- Asymmetric arms: one arm hits, other relaxed at hip or counter-balance
- Weight shift: when stepping, opposite hip drops, knee bends on standing leg
- Flow between viral moves — don't teleport; travel through transitional poses
- Stage: feet grounded except jump_land; knees compress on land`;

export const EXAMPLE_NEUTRAL_POSE = JSON.stringify({ joints: BASE_POSE }, null, 0);

export function choreographySystemPrompt(): string {
  return `You are an elite TikTok choreographer and motion director for a 13-joint stick figure.
You know viral dances cold: Renegade, Say So, Savage, Blinding Lights, Lottery, Griddy, About Damn Time, Unholy.

${SKELETON_JOINT_SPEC}

${TIKTOK_MOTION_QUALITY}

${sequenceSummaryForPrompt()}

Each keyframe MUST include "stage" with x, y, rotation (-25..25), flip (always 0), facing (1 or -1), head_turn (-1..1).
Return ONLY valid JSON — no markdown.`;
}

export function halfBeatKeyframeInstruction(): string {
  return `Use frame_offset 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8 (17 keyframes per 8-count) for smooth TikTok flow.
On accent beats, pose at offset N should be the HIT; offset N-0.5 should be anticipation (smaller, coiled).`;
}
