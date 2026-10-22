import React from 'react';
import { MapId, GameMode } from '../types/game';
import { MAP_REGISTRY } from '../game/maps';
import { MapPin, Play } from 'lucide-react';

interface MapSelectScreenProps {
  selectedMap: MapId;
  onSelectMap: (mapId: MapId) => void;
  onStartMatch: (mode: GameMode, mapId: MapId) => void;
  onBack: () => void;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({
  selectedMap,
  onSelectMap,
  onStartMatch,
  onBack,
}) => {
  const current = MAP_REGISTRY[selectedMap] || MAP_REGISTRY.lusaka;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full select-none space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Zambian Battlegrounds</h1>
          <p className="text-xs text-neutral-400">Explore 9 authentic arenas inspired by Zambian landmarks, mines, and landscapes</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Back to Arena
        </button>
      </div>

      {/* Map Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(MAP_REGISTRY).map((m) => {
          const isSelected = m.id === selectedMap;

          return (
            <div
              key={m.id}
              onClick={() => onSelectMap(m.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500 shadow-xl'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Zambia</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500">
                    {m.ambientParticles}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {m.name}
                </h3>
                <span className="text-xs text-amber-400 font-medium block mt-0.5">
                  {m.subtitle}
                </span>
                <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                  {m.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {m.platforms.length} Platforms · {m.pickupLocations.length} Supplies
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMap(m.id);
                    onStartMatch('practice', m.id);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Fight Here</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured Arena Banner (Copperbelt Mines or Selected) */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
          <span>Active Battleground Focus</span>
          <span aria-hidden="true">·</span>
          <span>{current.name}</span>
        </div>
        <h2 className="text-2xl font-bold text-white">{current.subtitle}</h2>
        <p className="text-neutral-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          {current.description}
        </p>

        {current.id === 'copperbelt' && (
          <div className="rounded-xl overflow-hidden border border-neutral-800 max-h-64 mt-4">
            <img
              src="/src/assets/images/boma_map_copperbelt_1792696303128.jpg"
              alt="Copperbelt Mines Arena"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};
