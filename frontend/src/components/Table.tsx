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
      <div className="h-full bg-white border-l border-google-gray-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-google-gray-50 rounded-full flex items-center justify-center mb-4 text-google-gray-800">
          <ArrowRight className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-xl font-medium text-google-gray-900 mb-2">No Location Selected</h3>
        <p className="text-google-gray-800 max-w-xs text-sm">Select a store on the map or search for a location to view intelligence.</p>
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
    <div className="flex flex-col h-full bg-white border border-google-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-google-gray-200 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-medium text-google-gray-900 mb-1 tracking-tight">{store.name}</h2>
            <div className="flex items-center text-sm text-google-gray-800">
              <span>{store.address}</span>
            </div>
          </div>
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="p-2 text-google-gray-800 hover:bg-google-gray-50 rounded-full transition-colors border border-transparent"
              title="Back to National View"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Location Context - Global Display */}
        {locationContext && (
          <div className="mb-6 bg-google-gray-50 p-4 rounded-xl border border-google-gray-200">
            <div className="text-[10px] text-google-gray-800 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-google-blue"></div>
              Location Context (Census Data)
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Object.entries(locationContext).map(([k, v]) => {
                if (k === 'dcid' || k === 'current_temperature' || k === 'current_condition' || k === 'forecast_summary') return null;

                let label = k.replace(/_/g, ' ');
                if (k === 'Count_Person') label = 'Population';
                if (k === 'Median_Income_Person') label = 'Median Income';
                if (k === 'UnemploymentRate_Person') label = 'Unemployment Rate';

                return (
                  <div key={k}>
                    <div className="text-[10px] text-google-gray-800 mb-1">{label}</div>
                    <div className="text-lg font-medium text-google-gray-900 tracking-tight">
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

            {/* Weather Context */}
            {locationContext.current_temperature && (
              <>
                <div className="text-[10px] text-google-gray-800 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2 pt-4 border-t border-google-gray-200 mt-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-google-yellow"></div>
                  Weather Context
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-google-gray-800 mb-1">Current</div>
                    <div className="text-lg font-medium text-google-gray-900 tracking-tight">
                      {locationContext.current_temperature} · {locationContext.current_condition}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-google-gray-800 mb-1">Forecast</div>
                    <div className="text-xs font-medium text-google-gray-800 tracking-tight leading-relaxed">
                      {locationContext.forecast_summary}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Analysis Controls */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAnalyze('seasonal')}
            disabled={loadingState.seasonal || !!data?.signals.find(s => s.type === 'Seasonal')}
            className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm
                    ${data?.signals.find(s => s.type === 'Seasonal') ? 'bg-google-green/10 text-google-green border border-google-green/30' : 'bg-google-blue hover:bg-blue-600 text-white'}
                    ${loadingState.seasonal ? 'opacity-70 cursor-wait' : ''}
                `}
          >
            {loadingState.seasonal ? <Loader className="w-4 h-4 animate-spin" /> : null}
            {data?.signals.find(s => s.type === 'Seasonal') ? 'NDVI Analysis Complete' : 'Satellite:NDVI'}
          </button>
          <button
            onClick={() => onAnalyze('growth')}
            disabled={loadingState.growth || !!data?.signals.find(s => s.type === 'Growth')}
            className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm
                    ${data?.signals.find(s => s.type === 'Growth') ? 'bg-google-green/10 text-google-green border border-google-green/30' : 'bg-google-yellow hover:bg-yellow-500 text-white'}
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
              <h3 className="text-[15px] font-semibold text-google-gray-900 mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-google-green" />
                NDVI Trajectory (Vegetation Health)
              </h3>
              <div className="h-40 w-full bg-white border border-google-gray-200 shadow-sm rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis stroke="#9ca3af" fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#34A853' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ndvi"
                      stroke="#34A853"
                      strokeWidth={2}
                      dot={{ fill: '#34A853', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        <div className="mb-6 flex justify-between items-end">
          <h3 className="text-lg font-semibold text-google-gray-900">Actionable Signals</h3>
          <span className="text-xs text-google-gray-800 font-mono">UPDATED: JUST NOW</span>
        </div>

        {!data || !data.signals || data.signals.length === 0 ? (
          <div className="text-center py-10 text-google-gray-800 italic bg-google-gray-50 rounded-xl border border-google-gray-200">
            No active signals detected in the 5 mile radius.
          </div>
        ) : (
          <div className="space-y-4">
            {data.signals.map((signal, idx) => (
              <div
                key={idx}
                className="bg-white border border-google-gray-200 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-google-gray-50 rounded-xl border border-google-gray-200">
                      {getIcon(signal.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-google-gray-900">{signal.type}</h4>
                      <div className="text-xs text-google-gray-800 uppercase tracking-wider">{signal.metric}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getIntensityColor(signal.intensity)}`}>
                    {signal.intensity.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-google-gray-200">
                  <div>
                    <div className="text-xs text-google-gray-800 mb-1">MARKET SIGNAL</div>
                    <div className="text-sm text-google-gray-900">{signal.market_signal}</div>
                  </div>
                  <div>
                    <div className="text-xs text-google-gray-800 mb-1 font-semibold text-google-green">STOCKING ACTION</div>
                    {signal.stocking_action || generatedActions[`${signal.type}-${idx}`] ? (
                      <div className="text-sm font-medium text-google-gray-900 bg-google-green/5 p-2 rounded-lg border border-google-green/20">{signal.stocking_action || generatedActions[`${signal.type}-${idx}`]}</div>
                    ) : (
                      <button
                        onClick={() => handleGenerateAction(signal, idx)}
                        disabled={loadingAction[`${signal.type}-${idx}`]}
                          className="mt-1 text-xs bg-google-green/10 text-google-green px-3 py-1.5 rounded-full border border-google-green/30 hover:bg-google-green/20 transition-colors flex items-center gap-2 font-medium"
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
