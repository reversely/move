from typing import List, Literal

from pydantic import BaseModel

DanceDifficulty = Literal["easy", "medium", "hard"]
DanceStyle = Literal["fun", "cool", "cute", "high_energy"]


class GenerateDanceRequest(BaseModel):
    songId: str
    bpm: int = 120
    style: DanceStyle = "fun"
    difficulty: DanceDifficulty = "easy"
    totalBeats: int = 8


class DanceMove(BaseModel):
    id: str
    moveId: str
    label: str
    startBeat: int
    endBeat: int
    durationBeats: int
    animationClip: str


class DancePlan(BaseModel):
    id: str
    songId: str
    bpm: int
    style: DanceStyle
    difficulty: DanceDifficulty
    totalBeats: int
    moves: List[DanceMove]
