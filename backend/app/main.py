from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.properties import router as properties_router
from app.api.routes.uploads import router as uploads_router
from app.api.routes.ai import router as ai_router
from app.api.routes.conversations import router as conversations_router
from app.core.config import settings


def get_cors_origins() -> list[str]:
    origins = [
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip()
    ]
    return origins or ["http://localhost:3000"]


app = FastAPI(
    title="GEB API",
    description="Global Estate Bridge Backend",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# API ROUTES
# ==========================================================

app.include_router(properties_router)

app.include_router(uploads_router)
app.include_router(ai_router)
app.include_router(conversations_router)
@app.get("/")
def root():

    return {
        "name": "GEB API",
        "status": "running",
        "version": "0.1.0",
    }


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "geb-backend",
    }
