import React, { useState } from 'react';
import { Volume2, Zap, Target, Gauge, ShieldAlert } from 'lucide-react';
import { WeaponId } from '../types/game';
import { WEAPON_REGISTRY } from '../game/weapons';
import { sound } from '../game/audio';

interface ArmoryScreenProps {
  onBack: () => void;
}

export const ArmoryScreen: React.FC<ArmoryScreenProps> = ({ onBack }) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId>('ak_zambia');
  const weapon = WEAPON_REGISTRY[selectedWeaponId];

  const handleTestSound = (id: WeaponId) => {
    sound.playWeaponFire(id);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full select-none space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">The Boma Armory</h1>
          <p className="text-xs text-neutral-400">11 authentic Zambian firearms, explosive ordinance, and melee armaments</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Back to Arena
        </button>
      </div>

      {/* Weapons Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.values(WEAPON_REGISTRY).map((w) => {
          const isSelected = w.id === selectedWeaponId;
          return (
            <div
              key={w.id}
              onClick={() => {
                setSelectedWeaponId(w.id);
                sound.playWeaponFire(w.id);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  {w.category}
                </span>
                <h3 className="text-sm font-bold text-white truncate">{w.name}</h3>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {w.damage} DMG
                </span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: w.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Weapon Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {weapon.category}
              </span>
              <button
                onClick={() => handleTestSound(weapon.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Muzzle Sound</span>
              </button>
            </div>
            <h2 className="text-3xl font-black text-white">{weapon.name}</h2>
            <p className="text-xs text-neutral-300 leading-relaxed">{weapon.description}</p>
          </div>

          {/* Weapon Visual Silhouette Preview */}
          <div className="p-8 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-center min-h-[160px]">
            <div className="flex items-center gap-3">
              <div
                className="h-8 rounded"
                style={{
                  width: `${Math.max(100, Math.min(220, weapon.range / 8))}px`,
                  backgroundColor: weapon.color,
                }}
              />
              <div className="w-4 h-4 rounded-full bg-neutral-800 border border-neutral-600" />
            </div>
          </div>
        </div>

        {/* Tactical Metrics & Balancing */}
        <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
            Ballistic Profile
          </h3>

          <div className="space-y-3.5">
            {/* Damage */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Kinetic / Blast Damage
                </span>
                <span className="font-bold text-white">{weapon.damage}</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${Math.min(100, (weapon.damage / 140) * 100)}%` }}
                />
              </div>
            </div>

            {/* Fire Rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Cadence / Fire Rate
                </span>
                <span className="font-bold text-white">{weapon.fireRateMs} ms/round</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${Math.max(10, 100 - (weapon.fireRateMs / 1400) * 100)}%` }}
                />
              </div>
            </div>

            {/* Velocity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" /> Muzzle Velocity
                </span>
                <span className="font-bold text-white">{weapon.bulletSpeed} px/s</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full"
                  style={{ width: `${(weapon.bulletSpeed / 2000) * 100}%` }}
                />
              </div>
            </div>

            {/* Range */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" /> Effective Range
                </span>
                <span className="font-bold text-white">{weapon.range} px</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full"
                  style={{ width: `${(weapon.range / 2200) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs">
              <div className="text-neutral-400">Magazine Capacity</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {weapon.magazineSize === 999 ? 'Infinite' : `${weapon.magazineSize} Rnds`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs">
              <div className="text-neutral-400">Reload Duration</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {weapon.reloadTimeMs === 0 ? 'Instant' : `${(weapon.reloadTimeMs / 1000).toFixed(1)}s`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
