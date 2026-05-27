export type Choreography = {
  phrases: Array<{ beat: number; duration_beats: number }>;
};

export function phraseDurationBeats(phrase: { duration_beats: number }) {
  return phrase.duration_beats;
}

export function totalBeats(choreography: Choreography): number {
  return choreography.phrases.reduce((max, phrase) => Math.max(max, phrase.beat + phrase.duration_beats - 1), 0);
}
