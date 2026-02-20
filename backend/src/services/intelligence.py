from .earth_engine import analyze_seasonal_gee, analyze_growth_gee, analyze_history, start_async_extraction_job
from .datacommons import get_location_metrics
from google import genai
from google.genai import types
import os

def generate_stocking_action(store_name, signal_type, metric, market_signal, location_context=None):
    try:
        client = genai.Client(vertexai=True, project=os.environ.get("GCP_PROJECT"), location="us-central1")
        
        context_str = ""
        if location_context:
            context_str = "Location Context:\n"
            for k, v in location_context.items():
                if k != 'dcid':
                     context_str += f"- {k}: {v}\n"

        prompt = f"""You are a retail inventory expert for "{store_name}".
Current Intelligence:
- Signal Type: {signal_type}
- Metric: {metric}
- Insight: {market_signal}
{context_str}
Based on this, suggest a concise (max 10 words) and high-impact stocking action for the store manager.
Focus on specific product categories relevant to the signal.
Output ONLY the stocking action text."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                top_p=0.5,
            )
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Error: {e}")
        return "Check relevant inventory based on signal."

def analyze_seasonal(store_id: str, lat: float, lng: float, store_name: str = "Store"):
    # 1. Get GEE Signal
    gee_data = analyze_seasonal_gee(lat, lng)
    
    # 2. Get Location Context
    metrics = get_location_metrics(lat, lng)
    
    # 3. Combine
    gee_data["location_context"] = metrics
    return gee_data

def analyze_growth(store_id: str, lat: float, lng: float, store_name: str = "Store"):
    # 1. Get GEE Signal
    gee_data = analyze_growth_gee(lat, lng)
    
    # 2. Get Location Context
    metrics = get_location_metrics(lat, lng)
    
    # 3. Combine
    gee_data["location_context"] = metrics
    return gee_data

# Proxy function for history
def get_history(store_id: str, lat: float, lng: float):
    return analyze_history(store_id, lat, lng)

# Proxy for async job
def trigger_extraction(store_id: str, lat: float, lng: float):
    return start_async_extraction_job(store_id, lat, lng)
