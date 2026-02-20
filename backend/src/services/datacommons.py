import datacommons_client
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_location_metrics(lat: float, lng: float):
    """
    Resolves a lat/lng to a DCID and fetches relevant socio-economic metrics.
    Returns a dictionary of metrics or empty dict if failed.
    """
    api_key = os.environ.get("DATA_COMMONS_API_KEY")
    if not api_key:
        logger.warning("DATA_COMMONS_API_KEY not found in environment.")
        return {}

    try:
        client = datacommons_client.DataCommonsClient(api_key=api_key)
        
        # 1. Resolve to DCID
        # fetch_dcid_by_coordinates returns candidates
        # We want City or County
        resolve_resp = client.resolve.fetch_dcid_by_coordinates(latitude=lat, longitude=lng)
        
        candidates = []
        # Check if it has entities attribute
        if resolve_resp and hasattr(resolve_resp, 'entities') and resolve_resp.entities:
            # Check if entities[0] has candidates
            candidates = resolve_resp.entities[0].candidates
        elif resolve_resp and isinstance(resolve_resp, dict) and 'entities' in resolve_resp:
             # Fallback for dict
             candidates = resolve_resp['entities'][0].get('candidates', [])
        
        if not candidates:
            return {}
            
        # Prioritize City then County
        target_dcid = None
        target_name = "Location"
        
        for cand in candidates:
            # cand might be object or dict
            dtype = getattr(cand, 'dominantType', cand.get('dominantType') if isinstance(cand, dict) else None)
            dcid = getattr(cand, 'dcid', cand.get('dcid') if isinstance(cand, dict) else None)
            
            if dtype == 'City':
                target_dcid = dcid
                break
        
        if not target_dcid:
            for cand in candidates:
                dtype = getattr(cand, 'dominantType', cand.get('dominantType') if isinstance(cand, dict) else None)
                dcid = getattr(cand, 'dcid', cand.get('dcid') if isinstance(cand, dict) else None)
                if dtype == 'County':
                    target_dcid = dcid
                    break
        
        if not target_dcid:
            # Fallback to first one
            target_dcid = getattr(candidates[0], 'dcid', candidates[0].get('dcid') if isinstance(candidates[0], dict) else None)

        if not target_dcid:
            return {}

        logger.info(f"Resolved {lat},{lng} to DCID: {target_dcid}")

        # 2. Fetch Metrics
        # Variables of interest
        variables = [
            "Count_Person",
            "Median_Income_Person",
            "UnemploymentRate_Person"
        ]
        
        # client.observation.fetch(entity_dcids=[dcid], variable_dcids=[...])
        # Returns: {'observations': [{'variable': 'Count_Person', 'entity': 'geoId/0649670', 'measuredValue': 80436.0, ...}]} 
        # structure might vary, let's look at response carefully or use helper
        obs_resp = client.observation.fetch(entity_dcids=[target_dcid], variable_dcids=variables)
        
        metrics = {"dcid": target_dcid}
        
        # Parse response
        # The structure is usually:
        # { 'observations': [ { 'variable': ..., 'entity': ..., 'measuredValue': ... } ] }
        # Or sometimes nested differently. 
        # Let's assume standard V2 response format.
        
        if obs_resp:
             # Convert to dict tree for easier traversal
             resp_dict = obs_resp.to_dict() if hasattr(obs_resp, 'to_dict') else obs_resp
             # Also handling case where it might be a Pydantic model without to_dict but with dict()
             if not isinstance(resp_dict, dict) and hasattr(obs_resp, 'dict'):
                 resp_dict = obs_resp.dict()

             if isinstance(resp_dict, dict) and 'byVariable' in resp_dict and resp_dict['byVariable']:
                 for var_name, var_data in resp_dict['byVariable'].items():
                    if 'byEntity' in var_data and target_dcid in var_data['byEntity']:
                         entity_data = var_data['byEntity'][target_dcid]
                         # Check for orderedFacets
                         if 'orderedFacets' in entity_data and entity_data['orderedFacets']:
                             facet = entity_data['orderedFacets'][0]
                             if 'observations' in facet and facet['observations']:
                                 val = facet['observations'][0].get('value')
                                 if val is not None:
                                     metrics[var_name] = val
        
        return metrics

    except Exception as e:
        logger.error(f"Data Commons Error: {e}")
        return {}
