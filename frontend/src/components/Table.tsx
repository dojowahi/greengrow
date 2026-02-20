import React from 'react';
import type { Store, SignalResponse, LocationContext } from '../utils/api';
import { generateStockingAction } from '../utils/api';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, Calendar, ArrowRight, Loader, Leaf, X } from 'lucide-react';

interface TableViewProps {
  store: Store | null;
  data: SignalResponse | null;
  onClearSelection: () => void;
  onAnalyze: (type: 'seasonal' | 'growth' | 'history') => void;
  loadingState: { seasonal: boolean; growth: boolean; history: boolean };
  locationContext: LocationContext | null;
}

export const TableView: React.FC<TableViewProps> = ({ store, data, locationContext, onClearSelection, onAnalyze, loadingState }) => {
  const [generatedActions, setGeneratedActions] = React.useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = React.useState<Record<string, boolean>>({});

  // Reset local state when the store changes
  React.useEffect(() => {
    setGeneratedActions({});
    setLoadingAction({});
  }, [store?.id]);

  const handleGenerateAction = async (signal: any, idx: number) => {

    if (!store) return;
    const key = `${signal.type}-${idx}`;
    setLoadingAction(prev => ({ ...prev, [key]: true }));

    const request = {
      store_name: store.name,
      signal_type: signal.type,
      metric: signal.metric,
      market_signal: signal.market_signal,
      location_context: signal.location_context
    };

    const action = await generateStockingAction(request);
    if (action) {
      setGeneratedActions(prev => ({ ...prev, [key]: action }));
    }
    setLoadingAction(prev => ({ ...prev, [key]: false }));
  };

  if (!store) {

    return (
      <div className="h-full bg-[#12151C] border-l border-gray-800 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <ArrowRight className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No Location Selected</h3>
        <p className="text-gray-400 max-w-xs">Select a store on the map or search for a location to view intelligence.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Seasonal':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'Growth':
      case 'Machinery':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-400" />;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Extreme':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12151C] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-800 bg-[#1A1D24]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{store.name}</h2>
            <div className="flex items-center text-sm text-gray-400">
              <span>{store.address}</span>
            </div>
          </div>
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700"
              title="Back to National View"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Location Context - Global Display */}
        {locationContext && (
          <div className="mb-6 bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              Location Context (Census Data)
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(locationContext).map(([k, v]) => {
                if (k === 'dcid') return null;

                let label = k.replace(/_/g, ' ');
                if (k === 'Count_Person') label = 'Population';
                if (k === 'Median_Income_Person') label = 'Median Income';
                if (k === 'UnemploymentRate_Person') label = 'Unemployment Rate';

                return (
                  <div key={k}>
                    <div className="text-[10px] text-gray-400 mb-1">{label}</div>
                    <div className="text-lg font-medium text-white tracking-tight">
                      {typeof v === 'number'
                        ? (k.includes('Income') ? `$${v.toLocaleString()}`
                          : k.includes('Rate') ? `${v}%`
                            : v.toLocaleString())
                        : v}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Controls */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAnalyze('seasonal')}
            disabled={loadingState.seasonal || !!data?.signals.find(s => s.type === 'Seasonal')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                    ${data?.signals.find(s => s.type === 'Seasonal') ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-blue-600 hover:bg-blue-500 text-white'}
                    ${loadingState.seasonal ? 'opacity-70 cursor-wait' : ''}
                `}
          >
            {loadingState.seasonal ? <Loader className="w-4 h-4 animate-spin" /> : null}
            {data?.signals.find(s => s.type === 'Seasonal') ? 'NDVI Analysis Complete' : 'Satellite:NDVI'}
          </button>
          <button
            onClick={() => onAnalyze('growth')}
            disabled={loadingState.growth || !!data?.signals.find(s => s.type === 'Growth')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                    ${data?.signals.find(s => s.type === 'Growth') ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-orange-600 hover:bg-orange-500 text-white'}
                    ${loadingState.growth ? 'opacity-70 cursor-wait' : ''}
                `}
          >
            {loadingState.growth ? <Loader className="w-4 h-4 animate-spin" /> : null}
            {data?.signals.find(s => s.type === 'Growth') ? 'Construction Analysis Complete' : 'Satellite:Construction'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Render History Charts */}
        {data && data.history && data.history.length > 0 && (
          <div className="mb-8 space-y-6">
            {/* NDVI Chart */}
            <div>
              <h3 className="text-[15px] font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#4ade80]" />
                NDVI Trajectory (Vegetation Health)
              </h3>
              <div className="h-40 w-full bg-[#1A1D24] border border-gray-800 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#4A5568"
                      fontSize={11}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis stroke="#4A5568" fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#4A5568' }}
                      itemStyle={{ color: '#4ade80' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ndvi"
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={{ fill: '#4ade80', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        <div className="mb-6 flex justify-between items-end">
          <h3 className="text-lg font-semibold text-gray-300">Actionable Signals</h3>
          <span className="text-xs text-gray-500 font-mono">UPDATED: JUST NOW</span>
        </div>

        {!data || !data.signals || data.signals.length === 0 ? (
          <div className="text-center py-10 text-gray-500 italic">
            No active signals detected in the 15km radius.
          </div>
        ) : (
          <div className="space-y-4">
            {data.signals.map((signal, idx) => (
              <div
                key={idx}
                className="bg-[#1A1D24] border border-gray-700 rounded-lg p-5 hover:border-gray-500 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                      {getIcon(signal.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-200">{signal.type}</h4>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">{signal.metric}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded border ${getIntensityColor(signal.intensity)}`}>
                    {signal.intensity.toUpperCase()}
                  </span>
                </div>



                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800/50">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">MARKET SIGNAL</div>
                    <div className="text-sm text-gray-300">{signal.market_signal}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-semibold text-[#4ade80]">STOCKING ACTION</div>
                    {signal.stocking_action || generatedActions[`${signal.type}-${idx}`] ? (
                      <div className="text-sm font-medium text-white">{signal.stocking_action || generatedActions[`${signal.type}-${idx}`]}</div>
                    ) : (
                      <button
                        onClick={() => handleGenerateAction(signal, idx)}
                        disabled={loadingAction[`${signal.type}-${idx}`]}
                        className="mt-1 text-xs bg-[#4ade80]/10 text-[#4ade80] px-3 py-1.5 rounded border border-[#4ade80]/30 hover:bg-[#4ade80]/20 transition-colors flex items-center gap-2"
                      >
                        {loadingAction[`${signal.type}-${idx}`] ? <Loader className="w-3 h-3 animate-spin" /> : "Show Recommendation"}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
