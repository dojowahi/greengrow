import requests
import logging

logger = logging.getLogger(__name__)

def get_weather_forecast(lat: float, lng: float):
    """
    Fetches the current weather and a brief 7-day forecast from Open-Meteo API.
    Does not require an API key.
    """
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto"
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        current = data.get("current", {})
        daily = data.get("daily", {})
        
        current_temp = current.get("temperature_2m", "N/A")
        
        # Simple string to summarize weather conditions from WMO code (simplification)
        current_code = current.get("weather_code", 0)
        condition = "Clear"
        if 1 <= current_code <= 3: condition = "Partly Cloudy"
        elif 45 <= current_code <= 48: condition = "Foggy"
        elif 51 <= current_code <= 67: condition = "Rain/Drizzle"
        elif 71 <= current_code <= 77: condition = "Snow"
        elif 80 <= current_code <= 82: condition = "Showers"
        elif 95 <= current_code <= 99: condition = "Thunderstorm"
            
        # Compile a quick forecast summary string
        forecast_str = ""
        if daily and "temperature_2m_max" in daily and "precipitation_probability_max" in daily:
             max_temps = daily["temperature_2m_max"][:3] # next 3 days
             max_precip = daily["precipitation_probability_max"][:3]
             forecast_str = f"Next 3 days Highs: ~{sum(max_temps)/len(max_temps):.0f}°F, Max Precip Prob: {max(max_precip)}%"
        
        return {
            "current_temperature": f"{current_temp}°F",
            "current_condition": condition,
            "forecast_summary": forecast_str
        }

    except Exception as e:
        logger.error(f"Weather Fetch Error: {e}")
        return {}
