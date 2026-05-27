from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.dances import router as dances_router
from routes.health import router as health_router
from routes.songs import router as songs_router

app = FastAPI(title="TikTok Dance MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(health_router)
app.include_router(songs_router, prefix="/songs")
app.include_router(dances_router, prefix="/dances")
