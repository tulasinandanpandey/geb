from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.properties import router as properties_router
from app.api.routes.uploads import router as uploads_router
from app.api.routes.ai import router as ai_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.land_analysis import router as land_analysis_router
from app.api.routes.dealers import router as dealers_router
from app.api.routes.projects import router as projects_router
from app.core.config import settings


def get_cors_origins() -> list[str]:
    origins = [
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip() and origin.strip() != "*"
    ]
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ]
    for orig in default_origins:
        if orig not in origins:
            origins.append(orig)
    return origins


app = FastAPI(
    title="GEB API",
    description="Global Estate Bridge Backend",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
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
app.include_router(land_analysis_router)
app.include_router(dealers_router)
app.include_router(projects_router)
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
