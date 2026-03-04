import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapView } from './components/Map';
import { TableView } from './components/Table';
import { PlaceSearch } from './components/PlaceSearch';
import { analyzeSeasonal, analyzeGrowth, analyzeHistory, fetchLocationContext } from './utils/api';
import type { Store, SignalResponse, LocationContext, Signal } from './utils/api';
import { RefreshCw, HelpCircle } from 'lucide-react';
import { AboutModal } from './components/AboutModal';

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [data, setData] = useState<SignalResponse>({ signals: [], history: [] }); // Initialize empty
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [loadingState, setLoadingState] = useState({ seasonal: false, growth: false, history: false });
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Removed useEffect for initial fetch - app starts empty now.

  const handleAnalyze = async (type: 'seasonal' | 'growth' | 'history') => {
    if (!selectedStore) return;

    if (type === 'seasonal') {
      // Trigger both Seasonal and History for "Analyze Veg"
      setLoadingState(prev => ({ ...prev, seasonal: true, history: true }));
      try {
        const [seasonalSignal, historyData] = await Promise.all([
          analyzeSeasonal(selectedStore),
          analyzeHistory(selectedStore)
        ]);

        if (seasonalSignal) {
          setData((prev: SignalResponse) => ({ ...prev, signals: [...prev.signals, seasonalSignal] }));
        }
        if (historyData) {
          setData((prev: SignalResponse) => ({ ...prev, history: historyData }));
        }
      } catch (e) {
        console.error("Error analyzing vegetation:", e);
      } finally {
        setLoadingState(prev => ({ ...prev, seasonal: false, history: false }));
      }
    } else if (type === 'growth') {
      setLoadingState(prev => ({ ...prev, growth: true }));
      try {
        const signal = await analyzeGrowth(selectedStore);
        if (signal) {
          setData((prev: SignalResponse) => ({ ...prev, signals: [...prev.signals, signal] }));
        }
      } catch (e) {
        console.error("Error analyzing growth:", e);
      } finally {
        setLoadingState(prev => ({ ...prev, growth: false }));
      }
    }
    // History case removed as it's now part of seasonal
  };

  const handleSelectStore = async (store: Store | null) => {
    setSelectedStore(store);
    setData({ signals: [], history: [] }); // Clear data on new selection
    setLocationContext(null); // Clear context
    if (!store) {
      setStores([]); // Clear map pins on reset
    } else {
      // Fetch context immediately
      fetchLocationContext(store).then(ctx => setLocationContext(ctx));
    }
  };

  const handlePlaceSelect = async (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) {
      alert("Selected place has no geometry.");
      return;
    }

    // Use place_id as a stable ID
    const newStore: Store = {
      id: place.place_id || crypto.randomUUID(),
      name: place.name || place.formatted_address || "Unknown Location",
      address: place.formatted_address || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    // 1. Plot Immediately!
    setStores([newStore]); // Replace existing stores - Single Store Mode
    setSelectedStore(newStore);

    // Fetch context immediately
    fetchLocationContext(newStore).then(ctx => setLocationContext(ctx));

    // Reset Data - User will manually trigger analysis
    setData({ signals: [], history: [] });
    setLocationContext(null);
    // Actually setLocationContext(null) above might race with the promise if not careful, but JS is single threaded.
    // Better to just set it to null then fetch.

  };

  const handleExport = () => {
    if (!data || !data.signals || data.signals.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Store Name", "Store ID", "Type", "Metric", "Market Signal", "Stocking Action", "Intensity"];

    const rows = data.signals.map((signal: Signal) => {
      // Escape commas in strings by wrapping them in quotes
      const safeStoreName = `"${selectedStore?.name || ''}"`;
      const safeMarketSignal = `"${signal.market_signal.replace(/"/g, '""')}"`;
      const safeStockingAction = signal.stocking_action ? `"${signal.stocking_action.replace(/"/g, '""')}"` : '""';


      return [
        safeStoreName,
        selectedStore?.id || '',
        signal.type,
        `"${signal.metric}"`,
        safeMarketSignal,
        safeStockingAction,
        signal.intensity
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GreenGrowth_Export_${selectedStore?.id || 'National'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} libraries={['places']}>
      <div className="min-h-screen bg-google-gray-50 text-google-gray-900 flex flex-col font-sans">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center">
              {/* Google Colors Logo representation */}
              <div className="flex gap-1">
                <div className="w-3 h-6 bg-google-blue rounded-full"></div>
                <div className="w-3 h-6 bg-google-red rounded-full"></div>
                <div className="w-3 h-6 bg-google-yellow rounded-full"></div>
                <div className="w-3 h-6 bg-google-green rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-medium text-google-gray-900 tracking-tight">GreenGrowth</h1>
              <p className="text-xs text-google-gray-800 font-medium tracking-wide">RETAIL INTELLIGENCE PLATFORM</p>
            </div>
          </div>

          {/* Centered Search Bar */}
          <div className="flex-1 max-w-xl mx-4">
            <PlaceSearch onPlaceSelect={handlePlaceSelect} />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-google-green/10 text-google-green rounded-full border border-google-green/20 font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-google-green"></span>
              System Active
            </span>
            {selectedStore && (
              <button
                onClick={() => handleSelectStore(null)}
                className="px-4 py-2 flex items-center gap-2 border border-google-gray-200 text-google-gray-800 hover:bg-google-gray-50 transition-colors rounded-full font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Map
              </button>
            )}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-2 text-google-gray-800 hover:bg-google-gray-50 rounded-full transition-colors border border-transparent"
              title="About GreenGrowth"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-google-blue text-white hover:bg-blue-600 transition-colors rounded-full font-medium shadow-sm shadow-google-blue/20"
            >
              Export Report
            </button>
          </div>
        </header>

        {/* Main split view layout */}
        <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-76px)]">

          {/* Left side: The Live Map */}
          <div className="flex-1 min-h-[500px] lg:min-h-0 relative">
            <MapView
              stores={stores}
              signals={data?.signals || []}
              selectedStore={selectedStore}
              onSelectStore={handleSelectStore}
            />
          </div>

          {/* Right side: Action Table */}
          <div className="w-full lg:w-[450px] xl:w-[500px] flex-shrink-0 h-full">
            <TableView
              store={selectedStore}
              data={data}
              locationContext={locationContext}
              onClearSelection={() => setSelectedStore(null)}
              onAnalyze={handleAnalyze}
              loadingState={loadingState}
            />
          </div>
        </main>
      </div>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </APIProvider>
  );
}

export default App;
