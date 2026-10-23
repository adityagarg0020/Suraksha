import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .seed_data import seed_database
from .api import (
    scenarios,
    shelters,
    simulations,
    analytics,
    compare,
    reports,
    map_api,
    ai
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables created and demo data seeded
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
    yield
    # Shutdown logic if any

app = FastAPI(
    title="EvacuSafe — Intelligent Disaster Evacuation Planning API",
    description="Software-only agent-based disaster evacuation simulation and route optimization engine.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EvacuSafe Engine",
        "version": "1.0.0",
        "fictional_town": "Greenfield City"
    }

# Include API Routers
app.include_router(scenarios.router)
app.include_router(shelters.router)
app.include_router(simulations.router)
app.include_router(analytics.router)
app.include_router(compare.router)
app.include_router(reports.router)
app.include_router(map_api.router)
app.include_router(ai.router)
