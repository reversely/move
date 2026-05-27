import json
import uuid
from pathlib import Path

from models.dance import DanceMove, DancePlan, GenerateDanceRequest

MOVE_LIBRARY_PATH = Path(__file__).resolve().parent.parent / "data" / "move_library.json"


def load_move_library():
    with open(MOVE_LIBRARY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_dance_plan(request: GenerateDanceRequest) -> DancePlan:
    move_library = load_move_library()
    allowed_moves = [m for m in move_library if m["difficulty"] == request.difficulty]

    if not allowed_moves:
        raise ValueError("No moves available for selected difficulty")

    moves = []
    current_beat = 1
    current_move = allowed_moves[0]

    while current_beat <= request.totalBeats:
        duration = current_move["durationBeats"]
        end_beat = min(current_beat + duration - 1, request.totalBeats)

        moves.append(
            DanceMove(
                id=f"move_{len(moves) + 1}",
                moveId=current_move["id"],
                label=current_move["label"],
                startBeat=current_beat,
                endBeat=end_beat,
                durationBeats=end_beat - current_beat + 1,
                animationClip=current_move["animationClip"],
            )
        )

        current_beat = end_beat + 1
        next_ids = current_move.get("compatibleNext", [])
        next_move = next((m for m in allowed_moves if m["id"] in next_ids), None)

        if not next_move:
            next_move = allowed_moves[0]

        current_move = next_move

    return DancePlan(
        id=f"dance_{uuid.uuid4().hex[:8]}",
        songId=request.songId,
        bpm=request.bpm,
        style=request.style,
        difficulty=request.difficulty,
        totalBeats=request.totalBeats,
        moves=moves,
    )
