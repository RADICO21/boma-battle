import React, { useState } from 'react';
import { Volume2, User, Keyboard, RotateCcw, Check } from 'lucide-react';
import { UserProfile } from '../types/game';
import { sound } from '../game/audio';
import { DEFAULT_PROFILE } from '../game/progression';

interface SettingsScreenProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const [name, setName] = useState(profile.name);
  const [sfx, setSfx] = useState(profile.soundVolume);
  const [music, setMusic] = useState(profile.musicVolume);
  const [announcer, setAnnouncer] = useState(profile.announcerVolume);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const updated = {
      ...profile,
      name: name.trim() || 'Zambian Warrior',
      soundVolume: sfx,
      musicVolume: music,
      announcerVolume: announcer,
    };
    onUpdateProfile(updated);
    sound.setVolumes(1.0, sfx, music, announcer);
    setSaved(true);
    sound.playAnnouncer('Boma secured!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all local progression and statistics?')) {
      onUpdateProfile({ ...DEFAULT_PROFILE });
      sound.playAnnouncer('Weka pressure!');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full select-none space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Game Settings</h1>
          <p className="text-xs text-neutral-400">Audio mixing, warrior callsign, and combat controls</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Back to Arena
        </button>
      </div>

      <div className="space-y-6">
        {/* Callsign / Player Name */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Warrior Callsign</span>
          </div>
          <input
            type="text"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Audio Volume Controls */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Audio Configuration</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Sound Effects (SFX)</span>
                <span className="font-mono font-bold text-emerald-400">{Math.round(sfx * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfx}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSfx(val);
                  sound.setVolumes(1.0, val, music, announcer);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Battle Rhythms (Music)</span>
                <span className="font-mono font-bold text-amber-400">{Math.round(music * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={music}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMusic(val);
                  sound.setVolumes(1.0, sfx, val, announcer);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Zambian Announcer Voice</span>
                <span className="font-mono font-bold text-orange-400">{Math.round(announcer * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={announcer}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAnnouncer(val);
                  sound.setVolumes(1.0, sfx, music, val);
                }}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Combat Controls Reference */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <span>Combat Controls Map</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400">Move Left / Right</span>
              <span className="font-mono text-neutral-200">A / D or Left/Right Arrow</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400">Jetpack Flight / Jump</span>
              <span className="font-mono text-neutral-200">W / Space / Right Mouse</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400">Crouch / Drop Platform</span>
              <span className="font-mono text-neutral-200">S / Down Arrow / C</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400">Aim & Fire Weapon</span>
              <span className="font-mono text-neutral-200">Mouse Move & Left Click</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400">Reload Magazine</span>
              <span className="font-mono text-neutral-200">R key</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400">Cycle Arsenal / Frags</span>
              <span className="font-mono text-neutral-200">Q / Numbers / G for Frag</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950 border border-neutral-800 col-span-1 sm:col-span-2">
              <span className="text-neutral-400">Touchscreen / Mobile Support</span>
              <span className="font-mono text-emerald-400">Dual Virtual Sticks Active on Touch</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-900/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Save Data</span>
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-200" /> : null}
            <span>{saved ? 'Settings Saved' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
