import React from 'react';
import {
  Users,
  Target,
  Flag,
  Crosshair,
  Shield,
  Zap,
  Globe,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { GameMode, MapId, UserProfile } from '../types/game';
import { CHARACTER_REGISTRY } from '../game/characters';
import { MAP_REGISTRY } from '../game/maps';

interface MainMenuProps {
  onStartGame: (mode: GameMode, mapId: MapId) => void;
  onOpenMultiplayer: () => void;
  profile: UserProfile;
  selectedMap: MapId;
  setSelectedMap: (mapId: MapId) => void;
  onGoToWarriors: () => void;
  onGoToArmory: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenMultiplayer,
  profile,
  selectedMap,
  setSelectedMap,
  onGoToWarriors,
  onGoToArmory,
}) => {
  const currentHero = CHARACTER_REGISTRY[profile.selectedCharacter] || CHARACTER_REGISTRY.chibesa;
  const currentMap = MAP_REGISTRY[selectedMap] || MAP_REGISTRY.lusaka;

  const modes: {
    id: GameMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    tag: string;
  }[] = [
    {
      id: 'practice',
      title: 'Local Practice',
      description: 'Instant offline arena match against smart AI opponents with full jetpack mechanics.',
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-600/40 hover:border-emerald-500 bg-emerald-950/20',
      tag: 'Offline Instant',
    },
    {
      id: 'ffa',
      title: 'Free-for-All',
      description: 'Chaotic solo deathmatch. Every warrior for themselves until match score limit.',
      icon: <Crosshair className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-600/40 hover:border-amber-500 bg-amber-950/20',
      tag: 'Solo Combat',
    },
    {
      id: 'tdm',
      title: 'Team Deathmatch',
      description: 'Green Chipolopolo vs Copper Vanguard. Coordinated squad firefights.',
      icon: <Users className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-600/40 hover:border-sky-500 bg-sky-950/20',
      tag: 'Red vs Blue',
    },
    {
      id: 'capture_boma',
      title: 'Capture the Boma',
      description: 'Hold the strategic fortified central Boma outpost to accumulate victory points.',
      icon: <Flag className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-600/40 hover:border-orange-500 bg-orange-950/20',
      tag: 'Territory Control',
    },
    {
      id: 'survival',
      title: 'Last Warrior Standing',
      description: 'No respawns! Survive against waves of relentless warriors in an intense elimination ring.',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-600/40 hover:border-rose-500 bg-rose-950/20',
      tag: 'Battle Royale',
    },
    {
      id: 'training',
      title: 'Training Grounds',
      description: 'Learn jetpack fuel conservation, platform navigation, weapons, and aiming.',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      color: 'border-yellow-600/40 hover:border-yellow-500 bg-yellow-950/20',
      tag: 'Bootcamp',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-8 select-none">
      {/* Hero Banner Area */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src="/src/assets/images/boma_battle_banner_1792696301239.jpg"
            alt="Boma Battle Banner"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-neutral-950/40" />

          {/* Banner Content */}
          <div className="absolute bottom-6 left-6 sm:left-8 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest">
                <span>Zambian Jetpack Arena Shooter</span>
                <span aria-hidden="true">·</span>
                <span>Mini Militia Spirit</span>
                <span aria-hidden="true">·</span>
                <span>Season 1</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                Boma Battle
              </h1>
              <p className="text-neutral-300 text-sm sm:text-base max-w-xl text-balance">
                Rise as Zambia's greatest warrior. Take to the skies with high-thrust jetpacks, master 11 devastating weapons, and conquer 9 authentic battlegrounds from Lusaka to Bangweulu.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={onOpenMultiplayer}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-orange-950/50 active:scale-95 transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>Multiplayer Rooms</span>
              </button>

              <button
                onClick={() => onStartGame('practice', selectedMap)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
              >
                <Crosshair className="w-4 h-4" />
                <span>Quick Battle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero & Selected Arena Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Warrior Card */}
        <div
          onClick={onGoToWarriors}
          className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-600/50 cursor-pointer transition-all group"
        >
          <img
            src={currentHero.portrait}
            alt={currentHero.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-lg object-cover border border-neutral-700 group-hover:border-emerald-500 transition-colors"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-400 flex items-center justify-between">
              <span>Active Warrior</span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Change <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-base font-bold text-white truncate">{currentHero.name}</div>
            <div className="text-xs text-neutral-400 truncate">{currentHero.title}</div>
          </div>
        </div>

        {/* Selected Map Card */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-400">Battleground Arena</div>
            <div className="text-base font-bold text-white truncate">{currentMap.name}</div>
            <div className="text-xs text-neutral-400 truncate">{currentMap.subtitle}</div>
          </div>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value as MapId)}
            className="bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {Object.values(MAP_REGISTRY).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Progression & Stats */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Warrior Level {profile.level}</span>
            <span className="font-semibold text-amber-400">
              {profile.xp} / {profile.xpToNextLevel} XP
            </span>
          </div>
          {/* XP Progress Bar */}
          <div className="w-full bg-neutral-800 rounded-full h-2 my-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all"
              style={{ width: `${Math.min(100, (profile.xp / profile.xpToNextLevel) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{profile.totalKills} Kills</span>
            <span>{profile.totalWins} Wins</span>
            <span>
              K/D:{' '}
              {profile.totalDeaths === 0
                ? profile.totalKills
                : (profile.totalKills / profile.totalDeaths).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Game Mode Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Select Game Mode</h2>
            <p className="text-neutral-400 text-xs">Jump into combat alone or with other warriors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => onStartGame(mode.id, selectedMap)}
              className={`p-5 rounded-xl border ${mode.color} cursor-pointer transition-all group flex flex-col justify-between hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    {mode.icon}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {mode.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {mode.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {mode.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Deploy to Match</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zambian Lore & Community Banner */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Authentic Zambian Arsenal & Lore</h4>
            <p className="text-xs text-neutral-400">
              Featuring Kalambo Rifles, Nyati SMGs, Mosi-o-Tunya RPGs, and legendary fighters defending the Bomas.
            </p>
          </div>
        </div>
        <button
          onClick={onGoToArmory}
          className="px-4 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          View All 11 Weapons
        </button>
      </div>
    </div>
  );
};
