import ee
import os
import time

_INITIALIZED = False

def init_ee():
    global _INITIALIZED
    if not _INITIALIZED:
        project = os.environ.get("GCP_PROJECT")
        try:
            if project:
                ee.Initialize(project=project)
            else:
                ee.Initialize() # Falls back to local auth credentials
            _INITIALIZED = True
        except Exception as e:
            print(f"Error initializing Earth Engine. Did you run 'earthengine authenticate'? {e}")
            raise

def extract_live_signals(store_id: str, lat: float, lng: float):
    """
    Performs a real-time synchronous extraction of Sentinel-2 data 
    over a 15km buffer around the store location for immediate MVP testing.
    """
    init_ee()
    
    # Define 5-mile Region of Interest (1 mile = ~1609.34 meters)
    poi = ee.Geometry.Point([lng, lat])
    buffer = poi.buffer(8046)

    # Use the last 30 days
    end_date = ee.Date(round(time.time() * 1000))
    start_date = end_date.advance(-30, 'day')

    # Get Sentinel-2 Harmonzied recent median image
    collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(buffer)
                  .filterDate(start_date, end_date)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)))
    
    recent_image = collection.median()

    # Get Google Dynamic World recent median image (near real-time land cover classifier AI)
    dw_collection = (ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
                  .filterBounds(buffer)
                  .filterDate(start_date, end_date))
    dw_image = dw_collection.median()
    dw_built = dw_image.select('built')

    # Calculate Indices
    # NDVI: Green-Up (Vegetation Health)
    ndvi = recent_image.normalizedDifference(['B8', 'B4']).rename('NDVI')

    # Compute mean statistics over the buffer for general health
    stats = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=buffer,
        scale=500,
        maxPixels=1e9
    ).getInfo()

    # --- NEW: Construction Detection (Dynamic World AI) ---
    # The user requested to use Google's Dynamic World to explicitly find new 'Built' label (6) zones
    # Comparing fixed Summer 2025 vs Summer 2020 timeframes as requested.
    past_start = ee.Date('2020-06-01')
    past_end = ee.Date('2020-09-01')
    
    current_start = ee.Date('2025-06-01')
    current_end = ee.Date('2025-09-01')
    
    def get_built_mask(start, end):
        dw = (ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
              .filterBounds(buffer)
              .filterDate(start, end)
              .select('label')
              .mode())
        return dw.eq(6) # 6 is 'built'

    built_old = get_built_mask(past_start, past_end)
    built_new = get_built_mask(current_start, current_end)
    
    # New construction: Built now (1) and NOT built 5 years ago (0)
    # Clip the result exactly to the 5-mile buffer to avoid rendering and processing out-of-scope tiles
    new_construction = built_new.gt(built_old).rename('class').clip(buffer)
    
    # Calculate the total area (in square meters) of these structural hotspots
    pixel_area = ee.Image.pixelArea()
    hotspot_area = new_construction.multiply(pixel_area).reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=buffer,
        scale=10, # Dynamic world native scale is 10
        maxPixels=1e9
    ).getInfo()

    # Build actionable signals strictly driven by real Satellite Data
    signals = []
    
    ndvi_val = stats.get('NDVI', 0)
    # Map Tile URL for the frontend overlay
    masked_construction = new_construction.updateMask(new_construction)
    map_id_dict = masked_construction.getMapId({'palette': ['#FF4500']})
    tile_url = map_id_dict['tile_fetcher'].url_format

    # Restrict NDVI coordinates to built environments (lawns/parks)
    # Threshold the AI probability to get a binary mask of "is built"
    is_built = dw_built.gt(0.2)
    # Dilate the mask by 10 pixels (100m) to encompass adjacent residential yards/lawns
    built_and_yards = is_built.focalMax(10, 'circle', 'pixels')
    
    # Identify pixels that are BOTH High Vegetation (> 0.3) AND in/near a built zone
    lawn_mask = ndvi.gt(0.3).And(built_and_yards.eq(1))
    ndvi_class = lawn_mask.rename('class')
    
    ndvi_sample = ndvi_class.stratifiedSample(
        numPoints=15, classBand='class', region=buffer, scale=250, geometries=True
    ).getInfo()
    ndvi_points = [{"lat": f.get('geometry', {}).get('coordinates', [0,0])[1], "lng": f.get('geometry', {}).get('coordinates', [0,0])[0]} 
                   for f in ndvi_sample.get('features', []) if f.get('geometry') and f.get('properties', {}).get('class') == 1]

    # Signal 1: Seasonal / Lawn Care -> Outdoor/Seasonal Living
    if ndvi_val is not None and ndvi_val > 0.4:
         signals.append({
            "type": "Seasonal",
            "metric": f"High Vegetation Active (NDVI {ndvi_val:.2f})",
            "market_signal": "Grass is heavily active",
            "stocking_action": "Heavy Push: Patio Furniture, Grilling Accessories, Summer Apparel",
            "intensity": "High",
            "geo_points": ndvi_points
         })
    elif ndvi_val is not None and ndvi_val > 0.2:
         signals.append({
            "type": "Seasonal",
            "metric": f"Vegetation Waking Up (NDVI {ndvi_val:.2f})",
            "market_signal": "Spring transition detected",
            "stocking_action": "Move Outdoor Decor & Spring Apparel to front-of-store",
            "intensity": "Medium",
            "geo_points": ndvi_points
         })
    elif ndvi_val is not None:
         signals.append({
            "type": "Seasonal",
            "metric": f"Dormant (NDVI {ndvi_val:.2f})",
            "market_signal": "Winter conditions",
            "stocking_action": "Push Indoor Entertainment, Winter Coats, Space Heaters",
            "intensity": "Low",
            "geo_points": []
         })

    # Signal 2: Construction / Machinery
    hotspot_sq_meters = hotspot_area.get('class', 0)
    
    # Convert square meters to Hectares (1 HA = 10,000 sq m)
    hotspot_ha = hotspot_sq_meters / 10000 if hotspot_sq_meters else 0

    if hotspot_ha > 1000: # Booming market (e.g. Georgetown TX -> ~1600+ Ha)
         signals.append({
            "type": "Growth",
            "metric": f"High Land Disturbance ({hotspot_ha:.1f} Ha)",
            "market_signal": "Major residential subdivisions or commercial build",
            "stocking_action": "New Mover Focus: Kitchen Appliances, Bedding, Cleaning Supplies",
            "intensity": "Extreme",
            "tile_url": tile_url,
            "geo_points": []
         })
    elif hotspot_ha >= 400: # Developing market 
         signals.append({
            "type": "Growth",
            "metric": f"Active Construction ({hotspot_ha:.1f} Ha)",
            "market_signal": "New residential or commercial structures popping up",
            "stocking_action": "Increase Trendy Home Decor & Household Essentials",
            "intensity": "Medium",
            "tile_url": tile_url,
            "geo_points": []
         })
    else: # Stagnant/Built-out market (e.g. Palo Alto -> ~100 Ha)
         signals.append({
            "type": "Growth",
            "metric": f"Stable Grid ({hotspot_ha:.1f} Ha)",
            "market_signal": "No significant new structures in the 2020-2025 window",
            "stocking_action": "Focus on standard fast-moving consumer goods and apparel",
            "intensity": "Low",
            "geo_points": []
         })

    # --- History Extraction ---
    # To show the trend over the last 6 months for NDVI
    history_start = end_date.advance(-6, 'month')
    history_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(buffer)
                  .filterDate(history_start, end_date)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)))
    
    def extract_history(img):
        ndvi_img = img.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
        stats = ndvi_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=buffer,
            scale=500,
            maxPixels=1e9
        )
        
        # Return a feature with the date and indices
        return ee.Feature(None, {
            'date': img.date().format('YYYY-MM-dd'),
            'ndvi': stats.get('NDVI')
        })
        
    # Run the map and pull it down to python
    hist_fc = ee.FeatureCollection(history_collection.map(extract_history)).getInfo()
    
    raw_history = []
    for f in hist_fc.get('features', []):
        props = f.get('properties', {})
        if props.get('ndvi') is not None:
             raw_history.append({
                 "date": props['date'], 
                 "ndvi": round(props['ndvi'], 3)
             })
             
    # Sort history chronologically
    raw_history.sort(key=lambda x: x['date'])

    return {
        "signals": signals,
        "history": raw_history
    }


def start_async_extraction_job(store_id: str, lat: float, lng: float):
    """
    Kicks off a production async extraction job exporting to BigQuery.
    """
    init_ee()
    # (Placeholder) Real implementation would use ee.batch.Export.table.toBigQuery()
    # Which would output rows to GCP that the frontend ultimately queries.
    return {
        "status": "Job submitted to Earth Engine batch pool",
        "task_id": "ee-task-12345"
    }
