import React, { useEffect, useState } from 'react';
import { MapView } from './components/Map';
import { TableView } from './components/Table';
import { fetchStores, fetchStoreSignals } from './utils/api';
import type { Store, SignalResponse } from './utils/api';
import { Layers, RefreshCw } from 'lucide-react';

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [data, setData] = useState<SignalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const fetchedStores = await fetchStores();
      setStores(fetchedStores);
      setLoading(false);
    };
    initData();
  }, []);

  const handleSelectStore = async (store: Store | null) => {
    setSelectedStore(store);
    if (store) {
      setLoading(true);
      const apiData = await fetchStoreSignals(store.id);
      setData(apiData);
      setLoading(false);
    } else {
      setData(null);
    }
  };

  const handleExport = () => {
    if (!data || !data.signals || data.signals.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Store Name", "Store ID", "Type", "Metric", "Market Signal", "Stocking Action", "Intensity"];

    const rows = data.signals.map(signal => {
      // Escape commas in strings by wrapping them in quotes
      const safeStoreName = `"${selectedStore?.name || ''}"`;
      const safeMarketSignal = `"${signal.market_signal.replace(/"/g, '""')}"`;
      const safeStockingAction = `"${signal.stocking_action.replace(/"/g, '""')}"`;

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
    <div className="min-h-screen bg-[#0A0C10] text-[#E0E6ED] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#12151C] border-b border-gray-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4ade80] to-[#0ea5e9] rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4ade80] to-[#0ea5e9] tracking-tight">GreenGrowth</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">RETAIL INTELLIGENCE PLATFORM</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            System Active
          </span>
          {selectedStore && (
            <button
              onClick={() => handleSelectStore(null)}
              className="px-4 py-2 flex items-center gap-2 border border-[#0ea5e9]/50 text-[#0ea5e9] hover:bg-[#0ea5e9]/10 transition-colors rounded-lg font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Map
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-medium shadow-md shadow-white/5"
          >
            Export Report
          </button>
        </div>
      </header>

      {/* Main split view layout */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ade80]"></div>
        </div>
      ) : (
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
            <TableView store={selectedStore} data={data} onClearSelection={() => setSelectedStore(null)} />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
