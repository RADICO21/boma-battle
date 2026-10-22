import React from 'react';
import { Volume2, VolumeX, Shield, Play } from 'lucide-react';
import { UserProfile } from '../types/game';

interface NavbarProps {
  currentTab: 'home' | 'armory' | 'warriors' | 'maps' | 'settings';
  setCurrentTab: (tab: 'home' | 'armory' | 'warriors' | 'maps' | 'settings') => void;
  isPlaying: boolean;
  onQuickPlay: () => void;
  profile: UserProfile;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isPlaying,
  onQuickPlay,
  profile,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md z-30 select-none">
      {/* Zone 1: Single text wordmark */}
      <div 
        onClick={() => setCurrentTab('home')}
        className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
      >
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
          BOMA BATTLE
        </span>
        <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold hidden sm:inline">
          · Zambia
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
        <button
          onClick={() => setCurrentTab('home')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'home' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500 pb-0.5' : ''
          }`}
        >
          Battle Arena
        </button>
        <button
          onClick={() => setCurrentTab('warriors')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'warriors' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500 pb-0.5' : ''
          }`}
        >
          Warriors
        </button>
        <button
          onClick={() => setCurrentTab('armory')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'armory' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500 pb-0.5' : ''
          }`}
        >
          Armory
        </button>
        <button
          onClick={() => setCurrentTab('maps')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'maps' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500 pb-0.5' : ''
          }`}
        >
          Battlegrounds
        </button>
        <button
          onClick={() => setCurrentTab('settings')}
          className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'settings' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500 pb-0.5' : ''
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: Profile Badge & 1 primary action */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-xs">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-neutral-200">LVL {profile.level}</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400 truncate max-w-[100px]">{profile.name}</span>
        </div>

        <button
          onClick={onQuickPlay}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-950/40 whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isPlaying ? 'Resume Match' : 'Play Match'}</span>
        </button>
      </div>
    </header>
  );
};
