from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from dotenv import load_dotenv
from app.routers import github, reputation, suggestions, mentors

load_dotenv()

app = FastAPI(
    title="AfriDev Hub - FastAPI Analytics & Reputation Service",
    description="Microservice Python d'agrégation des statistiques GitHub et calcul du score de réputation par les pairs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(github.router)
app.include_router(reputation.router)
app.include_router(suggestions.router)
app.include_router(mentors.router)

@app.get("/")
def read_root():
    return {
        "service": "backend-fastapi",
        "description": "AfriDev Hub Analytics & Reputational Intelligence Microservice",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "backend-fastapi",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

