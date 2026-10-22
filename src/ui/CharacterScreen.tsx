import React, { useState } from 'react';
import { Shield, Zap, Heart, Wind, Check, Lock } from 'lucide-react';
import { CharacterId, UserProfile } from '../types/game';
import { CHARACTER_REGISTRY } from '../game/characters';
import { sound } from '../game/audio';

interface CharacterScreenProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onBack: () => void;
}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<CharacterId>(profile.selectedCharacter);
  const [selectedSkinId, setSelectedSkinId] = useState<string>(profile.selectedSkin);

  const hero = CHARACTER_REGISTRY[selectedCharId];

  const handleSelectSkin = (skinId: string) => {
    setSelectedSkinId(skinId);
    sound.playPickup('armor');
  };

  const handleEquip = () => {
    sound.playAnnouncer('Legendary warrior!');
    onUpdateProfile({
      ...profile,
      selectedCharacter: selectedCharId,
      selectedSkin: selectedSkinId,
    });
  };

  const isCurrentEquipped =
    profile.selectedCharacter === selectedCharId && profile.selectedSkin === selectedSkinId;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full select-none space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Zambian Warriors</h1>
          <p className="text-xs text-neutral-400">Choose your champion, inspect passive traits, and customize skins</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Back to Arena
        </button>
      </div>

      {/* Hero Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.values(CHARACTER_REGISTRY).map((c) => {
          const isSelected = c.id === selectedCharId;
          const isEquipped = c.id === profile.selectedCharacter;

          return (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCharId(c.id);
                setSelectedSkinId(c.skinVariants[0].id);
                sound.playPickup('armor');
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div className="relative mb-2 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-neutral-700">
                <img
                  src={c.portrait}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                {isEquipped && (
                  <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-white truncate w-full">{c.name}</h3>
              <span className="text-[11px] text-neutral-400 truncate w-full">{c.role}</span>
            </div>
          );
        })}
      </div>

      {/* Selected Hero Showcase & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Hero Portrait & Lore */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-between space-y-4">
          <div className="relative aspect-square max-h-80 w-full rounded-xl overflow-hidden border border-neutral-700/80 shadow-2xl">
            <img
              src={hero.portrait}
              alt={hero.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                {hero.title}
              </span>
              <h2 className="text-2xl font-black text-white">{hero.name}</h2>
              <div className="text-xs text-neutral-300 font-medium">{hero.role}</div>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
            "{hero.bio}"
          </p>
        </div>

        {/* Right: Stats & Customization */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-between space-y-6">
          {/* Attributes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
              Combat Attributes
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Health */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Max Health
                  </span>
                  <span className="font-bold text-white">{hero.maxHealth} HP</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${(hero.maxHealth / 140) * 100}%` }}
                  />
                </div>
              </div>

              {/* Armor */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sky-400" /> Armor Shield
                  </span>
                  <span className="font-bold text-white">{hero.maxArmor} Shield</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full"
                    style={{ width: `${(hero.maxArmor / 140) * 100}%` }}
                  />
                </div>
              </div>

              {/* Jetpack Fuel */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-amber-400" /> Jetpack Capacity
                  </span>
                  <span className="font-bold text-white">{hero.jetpackMaxFuel} L</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${(hero.jetpackMaxFuel / 150) * 100}%` }}
                  />
                </div>
              </div>

              {/* Base Speed */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> Velocity
                  </span>
                  <span className="font-bold text-white">{hero.baseSpeed} px/s</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full"
                    style={{ width: `${(hero.baseSpeed / 400) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Passive Trait */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs">
              <span className="font-bold text-emerald-400">Passive Ability Trait: </span>
              <span className="text-neutral-200">{hero.passiveTrait}</span>
            </div>
          </div>

          {/* Skin Variants */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
              Select Warrior Skin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {hero.skinVariants.map((skin) => {
                const isSkinUnlocked = profile.unlockedSkins.includes(skin.id);
                const isSkinSelected = selectedSkinId === skin.id;

                return (
                  <button
                    key={skin.id}
                    disabled={!isSkinUnlocked}
                    onClick={() => handleSelectSkin(skin.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                      isSkinSelected
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : isSkinUnlocked
                        ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                        : 'border-neutral-800/40 bg-neutral-950/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-600"
                        style={{ backgroundColor: skin.color }}
                      />
                      <span className="font-semibold text-neutral-200">{skin.name}</span>
                    </div>
                    {!isSkinUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-neutral-500" />
                    ) : isSkinSelected ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equip Button */}
          <button
            onClick={handleEquip}
            disabled={isCurrentEquipped}
            className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg ${
              isCurrentEquipped
                ? 'bg-neutral-800 text-neutral-500 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 active:scale-98'
            }`}
          >
            {isCurrentEquipped ? 'Warrior Equipped' : 'Equip as Main Warrior'}
          </button>
        </div>
      </div>
    </div>
  );
};
