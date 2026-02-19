import axios from 'axios';

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
  stocking_action: string;
  intensity: 'High' | 'Medium' | 'Extreme';
  tile_url?: string;
  geo_points?: { lat: number; lng: number }[];
}

export interface HistoryData {
  date: string;
  ndvi: number;
}

export interface SignalResponse {
  signals: Signal[];
  history: HistoryData[];
}

export const fetchStores = async (): Promise<Store[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stores`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    console.error("API did not return an array. Check backend connection.");
    return [];
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
};

export const fetchStoreSignals = async (storeId: string): Promise<SignalResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stores/${storeId}/signals`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching signals for store ${storeId}:`, error);
    return { signals: [], history: [] };
  }
};
