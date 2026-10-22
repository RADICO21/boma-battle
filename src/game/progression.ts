import { CharacterId, UserProfile } from '../types/game';

const STORAGE_KEY = 'boma_battle_profile_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Zambian Warrior',
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  totalKills: 0,
  totalDeaths: 0,
  totalWins: 0,
  totalMatches: 0,
  unlockedCharacters: ['chibesa', 'kapaso', 'bakunda', 'mweemba', 'chola'],
  unlockedSkins: [
    'chibesa_classic',
    'chibesa_chipolopolo',
    'kapaso_classic',
    'bakunda_classic',
    'mweemba_classic',
    'chola_classic',
  ],
  selectedCharacter: 'chibesa',
  selectedSkin: 'chibesa_classic',
  soundVolume: 0.8,
  musicVolume: 0.45,
  announcerVolume: 0.9,
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveUserProfile(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Could not save user profile:', err);
  }
}

export function recordMatchProgression(
  profile: UserProfile,
  kills: number,
  deaths: number,
  won: boolean,
  damageDealt: number
): { updatedProfile: UserProfile; xpEarned: number; leveledUp: boolean } {
  const xpEarned = kills * 100 + (won ? 500 : 200) + Math.round(damageDealt * 0.2);
  let newXp = profile.xp + xpEarned;
  let newLevel = profile.level;
  let leveledUp = false;

  while (newXp >= profile.xpToNextLevel) {
    newXp -= profile.xpToNextLevel;
    newLevel++;
    leveledUp = true;
  }

  const updatedProfile: UserProfile = {
    ...profile,
    level: newLevel,
    xp: newXp,
    xpToNextLevel: 1000 + newLevel * 250,
    totalKills: profile.totalKills + kills,
    totalDeaths: profile.totalDeaths + deaths,
    totalWins: profile.totalWins + (won ? 1 : 0),
    totalMatches: profile.totalMatches + 1,
  };

  // Milestone skin unlocks
  if (newLevel >= 3 && !updatedProfile.unlockedSkins.includes('chibesa_night_ops')) {
    updatedProfile.unlockedSkins.push('chibesa_night_ops');
  }
  if (newLevel >= 5 && !updatedProfile.unlockedSkins.includes('bakunda_industrial')) {
    updatedProfile.unlockedSkins.push('bakunda_industrial');
  }
  if (newLevel >= 8 && !updatedProfile.unlockedSkins.includes('kapaso_cyber')) {
    updatedProfile.unlockedSkins.push('kapaso_cyber');
  }

  saveUserProfile(updatedProfile);
  return { updatedProfile, xpEarned, leveledUp };
}
