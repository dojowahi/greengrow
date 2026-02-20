const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Signal {
  type: string;
  metric: string;
  market_signal: string;
  stocking_action: string | null;
  intensity: 'High' | 'Medium' | 'Extreme';

  tile_url?: string;
  geo_points?: { lat: number; lng: number }[];
  location_context?: Record<string, any>;
}

export interface HistoryData {
  date: string;
  ndvi: number;
}

export interface SignalResponse {
  signals: Signal[];
  history: HistoryData[];
}

// Stateless Analysis: Returns signals directly for a given location
// On-Demand Analysis Functions

export const analyzeSeasonal = async (store: Store): Promise<Signal | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/seasonal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
    if (!response.ok) throw new Error("Seasonal analysis failed");
    return await response.json();
  } catch (error) {
    console.error('Error analyzing seasonal:', error);
    return null;
  }
};

export const analyzeGrowth = async (store: Store): Promise<Signal | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/growth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
    if (!response.ok) throw new Error("Growth analysis failed");
    return await response.json();
  } catch (error) {
    console.error('Error analyzing growth:', error);
    return null;
  }
};

export const analyzeHistory = async (store: Store): Promise<HistoryData[] | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
    if (!response.ok) throw new Error("History analysis failed");
    return await response.json();
  } catch (error) {
    console.error('Error analyzing history:', error);
    return null;
  }
};

export interface StockingRequest {
  store_name: string;
  signal_type: string;
  metric: string;
  market_signal: string;
  location_context?: Record<string, any>;
}

export const generateStockingAction = async (request: StockingRequest): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate_stocking_action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error("Stocking action generation failed");
    const data = await response.json();
    return data.stocking_action;
  } catch (error) {
    console.error('Error generating stocking action:', error);
    return null;
  }
};


export interface LocationContext {
  dcid?: string;
  Count_Person?: number;
  Median_Income_Person?: number;
  UnemploymentRate_Person?: number;
  [key: string]: any;
}

export const fetchLocationContext = async (store: Store): Promise<LocationContext | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
    if (!response.ok) throw new Error("Context fetch failed");
    return await response.json();
  } catch (error) {
    console.error('Error fetching context:', error);
    return null;
  }
};

