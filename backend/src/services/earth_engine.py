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

def analyze_seasonal_gee(lat: float, lng: float):
    init_ee()
    
    poi = ee.Geometry.Point([lng, lat])
    buffer = poi.buffer(8046)
    
    past_start = ee.Date('2020-06-01')
    past_end = ee.Date('2020-09-01')
    current_start = ee.Date('2025-06-01')
    current_end = ee.Date('2025-09-01')
    
    # Sentinel-2 for NDVI
    # Note: original analyze_seasonal logic was:
    end_date = ee.Date(round(time.time() * 1000))
    start_date = end_date.advance(-30, 'day')

    collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(buffer)
                  .filterDate(start_date, end_date)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)))
    
    recent_image = collection.median()
    ndvi = recent_image.normalizedDifference(['B8', 'B4']).rename('NDVI')

    # Dynamic World for 'Built' context
    dw_collection = (ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
                  .filterBounds(buffer)
                  .filterDate(start_date, end_date))
    dw_image = dw_collection.median()
    dw_built = dw_image.select('built')

    # Statistics
    stats = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=buffer,
        scale=500,
        maxPixels=1e9
    ).getInfo()

    # Geo Points for impact
    is_built = dw_built.gt(0.2)
    built_and_yards = is_built.focalMax(10, 'circle', 'pixels')
    lawn_mask = ndvi.gt(0.3).And(built_and_yards.eq(1))
    ndvi_class = lawn_mask.rename('class')
    
    ndvi_sample = ndvi_class.stratifiedSample(
        numPoints=15, classBand='class', region=buffer, scale=250, geometries=True
    ).getInfo()
    ndvi_points = [{"lat": f.get('geometry', {}).get('coordinates', [0,0])[1], "lng": f.get('geometry', {}).get('coordinates', [0,0])[0]} 
                   for f in ndvi_sample.get('features', []) if f.get('geometry') and f.get('properties', {}).get('class') == 1]

    ndvi_val = stats.get('NDVI', 0)

    # Visualization
    ndvi_vis = {
        'min': 0,
        'max': 1,
        'palette': ['white', 'green']
    }
    map_id_dict = ndvi.clip(buffer).getMapId(ndvi_vis)
    tile_url = map_id_dict['tile_fetcher'].url_format

    if ndvi_val is not None and ndvi_val > 0.4:
         return {
            "type": "Seasonal",
            "metric": f"High Vegetation Active (NDVI {ndvi_val:.2f})",
            "market_signal": "Grass is heavily active",
            "stocking_action": None,
            "intensity": "High",
            "tile_url": tile_url,
            "geo_points": ndvi_points
         }
    elif ndvi_val is not None and ndvi_val > 0.2:
         return {
            "type": "Seasonal",
            "metric": f"Vegetation Waking Up (NDVI {ndvi_val:.2f})",
            "market_signal": "Spring transition detected",
            "stocking_action": None,
            "intensity": "Medium",
            "tile_url": tile_url,
            "geo_points": ndvi_points
         }
    else:
         return {
            "type": "Seasonal",
            "metric": f"Dormant (NDVI {ndvi_val:.2f})",
            "market_signal": "Winter conditions",
            "stocking_action": None,
            "intensity": "Low",
            "tile_url": tile_url,
            "geo_points": []
         }

def analyze_growth_gee(lat: float, lng: float):
    init_ee()
    
    poi = ee.Geometry.Point([lng, lat])
    buffer = poi.buffer(8046)
    
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
    
    new_construction = built_new.gt(built_old).rename('class').clip(buffer)
    
    pixel_area = ee.Image.pixelArea()
    hotspot_area = new_construction.multiply(pixel_area).reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=buffer,
        scale=10, 
        maxPixels=1e9
    ).getInfo()

    hotspot_sq_meters = hotspot_area.get('class', 0)
    hotspot_ha = hotspot_sq_meters / 10000 if hotspot_sq_meters else 0
    
    masked_construction = new_construction.updateMask(new_construction)
    map_id_dict = masked_construction.getMapId({'palette': ['#FF4500']})
    tile_url = map_id_dict['tile_fetcher'].url_format

    if hotspot_ha > 1000:
         return {
            "type": "Growth",
            "metric": f"High Land Disturbance ({hotspot_ha:.1f} Ha)",
            "market_signal": "Major residential subdivisions or commercial build",
            "stocking_action": None,
            "intensity": "Extreme",
            "tile_url": tile_url,
            "geo_points": []
         }
    elif hotspot_ha >= 400:
         return {
            "type": "Growth",
            "metric": f"Active Construction ({hotspot_ha:.1f} Ha)",
            "market_signal": "New residential or commercial structures popping up",
            "stocking_action": None,
            "intensity": "Medium",
            "tile_url": tile_url,
            "geo_points": []
         }
    else:
         return {
            "type": "Growth",
            "metric": f"Stable Grid ({hotspot_ha:.1f} Ha)",
            "market_signal": "No significant new structures in the 2020-2025 window",
            "stocking_action": None,
            "intensity": "Low",
#            "tile_url": tile_url, 
            "geo_points": []
         }

def analyze_history(store_id: str, lat: float, lng: float):
    init_ee()
    
    poi = ee.Geometry.Point([lng, lat])
    buffer = poi.buffer(8046)
    
    end_date = ee.Date(round(time.time() * 1000))
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
        return ee.Feature(None, {
            'date': img.date().format('YYYY-MM-dd'),
            'ndvi': stats.get('NDVI')
        })
        
    hist_fc = ee.FeatureCollection(history_collection.map(extract_history)).getInfo()
    
    raw_history = []
    for f in hist_fc.get('features', []):
        props = f.get('properties', {})
        if props.get('ndvi') is not None:
             raw_history.append({
                 "date": props['date'], 
                 "ndvi": round(props['ndvi'], 3)
             })
             
    raw_history.sort(key=lambda x: x['date'])
    return raw_history

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
