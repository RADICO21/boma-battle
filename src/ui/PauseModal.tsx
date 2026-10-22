import React from 'react';
import { Play, Volume2, ArrowLeft } from 'lucide-react';
import { sound } from '../game/audio';
import { UserProfile } from '../types/game';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onExit: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onExit,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const handleVolumeChange = (type: 'sfx' | 'music' | 'announcer', val: number) => {
    const updated = {
      ...profile,
      [type === 'sfx' ? 'soundVolume' : type === 'music' ? 'musicVolume' : 'announcerVolume']: val,
    };
    onUpdateProfile(updated);
    sound.setVolumes(1.0, updated.soundVolume, updated.musicVolume, updated.announcerVolume);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Battle Paused</h2>
          <p className="text-xs text-neutral-400">Tactical intermission</p>
        </div>

        {/* Volume Controls */}
        <div className="space-y-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-neutral-300">
            <Volume2 className="w-4 h-4 text-emerald-400" /> Audio Balance
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Sound Effects (SFX)</span>
                <span>{Math.round(profile.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={profile.soundVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Battle Rhythms & Music</span>
                <span>{Math.round(profile.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={profile.musicVolume}
                onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Zambian Announcer Voice</span>
                <span>{Math.round(profile.announcerVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={profile.announcerVolume}
                onChange={(e) => handleVolumeChange('announcer', parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Controls Quick Reference */}
        <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
          <div className="font-semibold text-neutral-200">Controls Reference:</div>
          <div>WASD / Left Stick — Move, Jump & Jetpack Thrust</div>
          <div>Mouse / Right Stick — Aim & Fire Weapon</div>
          <div>R — Reload Magazine · Q — Cycle Arsenal · G — Throw Frag</div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Battle</span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Leave Match & Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
