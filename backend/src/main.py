from .services.intelligence import analyze_seasonal, analyze_growth, get_history, trigger_extraction, generate_stocking_action
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="GreenGrowth Retail Intelligence API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Store(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float

class StockingRequest(BaseModel):
    store_name: str
    signal_type: str
    metric: str
    market_signal: str
    location_context: Optional[dict] = None


@app.get("/api")
def read_root():
    return {"message": "Welcome to the GreenGrowth API (Stateless)"}

@app.post("/api/analyze/seasonal")
def analyze_seasonal_endpoint(store: Store):
    print(f"Analyzing Seasonal: {store.name}")
    try:
         return analyze_seasonal(store.id, store.lat, store.lng, store.name)

    except Exception as e:
         print(f"Analysis error: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/growth")
def analyze_growth_endpoint(store: Store):
    print(f"Analyzing Growth: {store.name}")
    try:
         return analyze_growth(store.id, store.lat, store.lng, store.name)

    except Exception as e:
         print(f"Analysis error: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/history")
def analyze_history_endpoint(store: Store):
    print(f"Analyzing History: {store.name}")
    try:
         return get_history(store.id, store.lat, store.lng)
    except Exception as e:
         print(f"Analysis error: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/context")
def get_location_context_endpoint(store: Store):
    print(f"Fetching Context: {store.name}")
    try:
         # Import here or better at top if exposed
         from .services.intelligence import get_location_metrics
         return get_location_metrics(store.lat, store.lng)
    except Exception as e:
         print(f"Context error: {e}")
         # Return empty context on error gracefully? or 500
         # Return empty to avoid breaking UI?
         return {}

@app.post("/api/trigger_extraction")
def trigger_extraction(store: Store):
    # Stateless trigger
    try:
        return trigger_extraction(store.id, store.lat, store.lng)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"GEE Job submission failed: {str(e)}")



@app.post("/api/generate_stocking_action")
def generate_stocking_action_endpoint(request: StockingRequest):
    try:
        action = generate_stocking_action(
            request.store_name,
            request.signal_type,
            request.metric,
            request.market_signal,
            request.location_context
        )
        return {"stocking_action": action}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
