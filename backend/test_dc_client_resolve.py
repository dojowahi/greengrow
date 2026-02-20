import datacommons_client
import os
from dotenv import load_dotenv

load_dotenv()

try:
    client = datacommons_client.DataCommonsClient(api_key=os.environ.get("DATA_COMMONS_API_KEY"))
    print("Client created.")
    print(dir(client))
    
    # Inspect client.observation
    print("Observation endpoint attributes:")
    print(dir(client.observation))

        
except Exception as e:
    print(f"Error: {e}")
