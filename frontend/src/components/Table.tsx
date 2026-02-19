import React from 'react';
import type { Store, SignalResponse } from '../utils/api';
import { Leaf, Hammer, AlertTriangle, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TableViewProps {
  store: Store | null;
  data: SignalResponse | null;
  onClearSelection?: () => void;
}

export const TableView: React.FC<TableViewProps> = ({ store, data, onClearSelection }) => {
  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 border border-gray-800 rounded-xl bg-[#12151C]">
        <AlertTriangle className="w-12 h-12 mb-4 text-gray-600" />
        <h3 className="text-xl font-medium text-gray-400">No Store Selected</h3>
        <p className="mt-2 text-sm">Select a store marker on the map to view predictive inventory signals.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Seasonal':
        return <Leaf className="w-5 h-5 text-green-400" />;
      case 'Growth':
      case 'Machinery':
        return <Hammer className="w-5 h-5 text-amber-500" />;
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
      <div className="p-6 border-b border-gray-800 bg-[#1A1D24] flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{store.name}</h2>
          <div className="flex items-center text-sm text-gray-400">
            <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 mr-3">Store #{store.id}</span>
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
                    <div className="text-sm font-medium text-white">{signal.stocking_action}</div>
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
