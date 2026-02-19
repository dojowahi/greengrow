import json
import os
from .services.earth_engine import extract_live_signals, start_async_extraction_job
from contextlib import asynccontextmanager
from .db import create_db_and_tables, seed_db_if_empty, get_session, Store
from sqlmodel import Session, select
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_db_if_empty()
    yield

app = FastAPI(title="GreenGrowth Retail Intelligence API", lifespan=lifespan)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
def read_root():
    return {"message": "Welcome to the GreenGrowth API"}

@app.get("/api/stores", response_model=list[Store])
def get_stores(session: Session = Depends(get_session)):
    stores = session.exec(select(Store)).all()
    return stores

@app.get("/api/stores/{store_id}/signals")
def get_store_signals(store_id: str, session: Session = Depends(get_session)):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found in database")
    
    # 2. MVP Fallback: Run Live Synchronous Earth Engine Processing
    print(f"Running Live Google Earth Engine Extraction for Store {store_id}...")
    try:
         signals = extract_live_signals(store_id, store.lat, store.lng)
         return signals
    except Exception as e:
         print(f"GEE extraction error: {e}")
         # Finally, return an empty list if GEE is strictly unauthenticated
         return []

@app.post("/api/trigger_extraction")
def trigger_extraction(store_id: str, session: Session = Depends(get_session)):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    try:
        return start_async_extraction_job(store_id, store.lat, store.lng)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"GEE Job submission failed: {str(e)}")

# Serve static files from the "static" directory
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = os.path.join("static", full_path)
        if os.path.exists(path) and os.path.isfile(path):
            return FileResponse(path)
        return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
