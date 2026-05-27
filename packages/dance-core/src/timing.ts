export function secondsPerBeat(bpm: number) {
  return 60 / bpm;
}

export function beatToSeconds(beat: number, bpm: number) {
  return (beat - 1) * secondsPerBeat(bpm);
}

export function moveDurationSeconds(startBeat: number, endBeat: number, bpm: number) {
  return (endBeat - startBeat + 1) * secondsPerBeat(bpm);
}
