from fastapi import APIRouter, HTTPException

from models.dance import DancePlan, GenerateDanceRequest
from services.dance_generator import generate_dance_plan

router = APIRouter()


@router.post("/generate", response_model=DancePlan)
def generate_dance(request: GenerateDanceRequest):
    try:
        return generate_dance_plan(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
