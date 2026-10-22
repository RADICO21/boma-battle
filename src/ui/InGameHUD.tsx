import React from 'react';
import {
  Shield,
  Heart,
  Flame,
  Pause,
  RotateCw,
  Repeat,
  Bomb,
  Crosshair,
} from 'lucide-react';
import { GameMode, KillFeedItem, MapDef, PlayerState } from '../types/game';
import { WEAPON_REGISTRY } from '../game/weapons';

interface InGameHUDProps {
  player: PlayerState | undefined;
  allPlayers: PlayerState[];
  teamScores: { green: number; copper: number };
  timeRemaining: number;
  mode: GameMode;
  map: MapDef;
  killFeed: KillFeedItem[];
  onPause: () => void;
  onReload: () => void;
  onCycleWeapon: () => void;
  onThrowGrenade: () => void;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  player,
  allPlayers,
  teamScores,
  timeRemaining,
  mode,
  map,
  killFeed,
  onPause,
  onReload,
  onCycleWeapon,
  onThrowGrenade,
}) => {
  if (!player) return null;

  const currentWeapon = WEAPON_REGISTRY[player.currentWeaponId] || WEAPON_REGISTRY.ak_zambia;
  const currentSlot = player.weapons[player.currentWeaponIndex];

  // Format timer
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const hpRatio = Math.max(0, Math.min(1, player.health / player.maxHealth));
  const armorRatio = Math.max(0, Math.min(1, player.armor / player.maxArmor));
  const fuelRatio = Math.max(0, Math.min(1, player.jetpackFuel / player.maxJetpackFuel));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden font-sans">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Player Vital Meters (Health, Armor, Jetpack) */}
        <div className="flex items-start gap-3 pointer-events-auto">
          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors shadow-lg active:scale-95"
            title="Pause Game"
          >
            <Pause className="w-5 h-5" />
          </button>

          {/* Vitals Container */}
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 min-w-[200px] sm:min-w-[260px] shadow-2xl space-y-2">
            {/* Health Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3.5 h-3.5 fill-current" /> HP
                </span>
                <span className="font-mono text-neutral-200">
                  {Math.round(player.health)} / {player.maxHealth}
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-gradient-to-r from-rose-600 to-emerald-500 h-full transition-all duration-150"
                  style={{ width: `${hpRatio * 100}%` }}
                />
              </div>
            </div>

            {/* Armor Shield Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1 text-sky-400">
                  <Shield className="w-3.5 h-3.5 fill-current" /> ARMOR
                </span>
                <span className="font-mono text-neutral-200">
                  {Math.round(player.armor)} / {player.maxArmor}
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-sky-400 h-full transition-all duration-150"
                  style={{ width: `${armorRatio * 100}%` }}
                />
              </div>
            </div>

            {/* Jetpack Fuel Gauge */}
            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame className="w-3.5 h-3.5 fill-current" /> JETPACK
                </span>
                <span className="font-mono text-neutral-200">
                  {Math.round(player.jetpackFuel)}%
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-100 ${
                    player.isJetpacking
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${fuelRatio * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Match Status, Score & Timer */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800/90 rounded-2xl px-5 py-2 shadow-2xl flex items-center gap-4 text-center">
            {mode === 'tdm' || mode === 'capture_boma' ? (
              <div className="flex items-center gap-4 text-xs font-black">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>CHIPOLOPOLO</span>
                  <span className="text-base text-white px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800">
                    {Math.round(teamScores.green)}
                  </span>
                </div>
                <span className="text-neutral-500 font-mono text-sm">{formattedTime}</span>
                <div className="flex items-center gap-1.5 text-orange-400">
                  <span className="text-base text-white px-2 py-0.5 rounded bg-orange-950/70 border border-orange-800">
                    {Math.round(teamScores.copper)}
                  </span>
                  <span>VANGUARD</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-bold text-neutral-400">{mode}</span>
                <span className="text-lg font-mono font-black text-amber-400 tracking-wider">
                  {formattedTime}
                </span>
                <div className="text-xs text-neutral-300 font-semibold">
                  Score: <span className="text-emerald-400">{player.score}</span>
                </div>
              </div>
            )}
          </div>
          {allPlayers.length > 1 && allPlayers.some((p) => !p.isBot && p.id !== player.id) && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Online Match · {allPlayers.length} Warriors Connected</span>
            </div>
          )}
        </div>

        {/* Top-Right: Killfeed */}
        <div className="space-y-1.5 max-w-xs w-full flex flex-col items-end">
          {killFeed.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-950/80 backdrop-blur-sm border border-neutral-800/80 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-md animate-fade-in"
            >
              <span
                className={`font-bold ${
                  item.killerTeam === 'green'
                    ? 'text-emerald-400'
                    : item.killerTeam === 'copper'
                    ? 'text-orange-400'
                    : 'text-amber-400'
                }`}
              >
                {item.killerName}
              </span>
              <span className="text-neutral-500">[{item.weaponName}]</span>
              <span
                className={`font-bold ${
                  item.victimTeam === 'green'
                    ? 'text-emerald-400'
                    : item.victimTeam === 'copper'
                    ? 'text-orange-400'
                    : 'text-neutral-300'
                }`}
              >
                {item.victimName}
              </span>
              {item.isHeadshot && (
                <span className="text-[10px] text-rose-500 font-black">HEADSHOT</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Weapons, Radar & Mobile Touch Controls */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Touch Quick Action Buttons (for Mobile / Tablet) */}
        <div className="flex items-center gap-2 pointer-events-auto sm:hidden">
          <button
            onClick={onCycleWeapon}
            className="p-3 rounded-full bg-neutral-900/90 border border-neutral-700 text-white shadow-xl active:scale-90"
            title="Switch Weapon"
          >
            <Repeat className="w-5 h-5 text-amber-400" />
          </button>
          <button
            onClick={onReload}
            className="p-3 rounded-full bg-neutral-900/90 border border-neutral-700 text-white shadow-xl active:scale-90"
            title="Reload Weapon"
          >
            <RotateCw className="w-5 h-5 text-sky-400" />
          </button>
          <button
            onClick={onThrowGrenade}
            className="p-3 rounded-full bg-neutral-900/90 border border-neutral-700 text-white shadow-xl active:scale-90"
            title="Throw Grenade"
          >
            <Bomb className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        {/* Bottom-Center / Desktop Controls Legend */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400">
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">WASD</kbd> Move/Jetpack</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">Mouse</kbd> Aim & Fire</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">R</kbd> Reload</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">Q</kbd> Swap</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">G</kbd> Frag</span>
        </div>

        {/* Bottom-Right: Weapon HUD & Minimap */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Grenade Button */}
          <button
            onClick={onThrowGrenade}
            disabled={player.grenadeCount <= 0}
            className={`p-3 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${
              player.grenadeCount > 0
                ? 'bg-neutral-950/85 border-neutral-800 hover:border-emerald-500 text-emerald-400'
                : 'bg-neutral-950/40 border-neutral-800/40 opacity-40 text-neutral-600'
            }`}
            title="Throw Frag Grenade (G)"
          >
            <Bomb className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-black font-mono mt-0.5">{player.grenadeCount}</span>
          </button>

          {/* Active Weapon Card */}
          <div
            onClick={onCycleWeapon}
            className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800/90 hover:border-amber-500/50 cursor-pointer rounded-2xl p-3 shadow-2xl flex items-center gap-3 transition-colors group"
            title="Click to Switch Weapon (Q)"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  {currentWeapon.category}
                </span>
                <span className="text-[10px] font-semibold text-amber-400 group-hover:text-amber-300">
                  [Q] Swap
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate max-w-[140px]">
                {currentWeapon.name}
              </div>

              {/* Ammo display */}
              <div className="flex items-baseline gap-1 font-mono font-bold">
                <span className="text-2xl text-amber-400">
                  {currentWeapon.projectileType === 'melee' ? '∞' : currentSlot?.ammoInClip ?? 0}
                </span>
                {currentWeapon.projectileType !== 'melee' && (
                  <span className="text-xs text-neutral-500">
                    / {currentSlot?.reserveAmmo ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* Reloading circular indicator or click to reload */}
            {player.isReloading ? (
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-950/40 border border-amber-800 animate-pulse">
                <RotateCw className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-[10px] font-bold text-amber-300 mt-1">RELOAD</span>
              </div>
            ) : currentSlot && currentSlot.ammoInClip < currentWeapon.magazineSize && currentSlot.reserveAmmo > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReload();
                }}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-sky-500 text-sky-400 transition-colors"
                title="Reload (R)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Minimap Radar */}
          <div className="hidden sm:block w-36 h-24 bg-neutral-950/90 border border-neutral-800 rounded-xl relative overflow-hidden shadow-2xl">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Capture Zone Ring in minimap */}
            {map.captureZone && mode === 'capture_boma' && (
              <div
                className="absolute w-4 h-4 rounded-full border border-amber-400/80 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(map.captureZone.x / map.width) * 100}%`,
                  top: `${(map.captureZone.y / map.height) * 100}%`,
                }}
              />
            )}

            {/* Player Blips */}
            {allPlayers.map((p) => {
              if (p.isDead) return null;
              const isLocal = p.id === player.id;
              const blipX = (p.x / map.width) * 100;
              const blipY = (p.y / map.height) * 100;

              return (
                <div
                  key={p.id}
                  className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 ${
                    isLocal
                      ? 'w-2.5 h-2.5 bg-emerald-400 ring-2 ring-emerald-500/50'
                      : p.team === 'green'
                      ? 'w-2 h-2 bg-emerald-500'
                      : p.team === 'copper'
                      ? 'w-2 h-2 bg-orange-500'
                      : 'w-2 h-2 bg-rose-500'
                  }`}
                  style={{ left: `${blipX}%`, top: `${blipY}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
