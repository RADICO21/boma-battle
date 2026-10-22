export type GameMode = 'ffa' | 'tdm' | 'survival' | 'capture_boma' | 'practice' | 'training';

export type WeaponId = 
  | 'ak_zambia'
  | 'nyati_smg'
  | 'eagle_sniper'
  | 'boma_striker'
  | 'rhino_lmg'
  | 'victoria_plasma'
  | 'mosi_rpg'
  | 'shosholoza_grenade'
  | 'ngoni_club'
  | 'nyami_arc'
  | 'choma_cannon';

export type ProjectileType = 'bullet' | 'buckshot' | 'sniper' | 'rocket' | 'plasma' | 'grenade' | 'melee' | 'arc';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: string;
  damage: number;
  fireRateMs: number;
  magazineSize: number;
  reloadTimeMs: number;
  bulletSpeed: number;
  spread: number;
  pelletCount: number;
  range: number;
  projectileType: ProjectileType;
  color: string;
  bulletRadius: number;
  recoil: number;
  description: string;
}

export type CharacterId = 'chibesa' | 'kapaso' | 'bakunda' | 'mweemba' | 'chola';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  role: string;
  bio: string;
  portrait: string;
  primaryColor: string;
  accentColor: string;
  skinVariants: { id: string; name: string; color: string; accent: string }[];
  baseSpeed: number;
  maxHealth: number;
  maxArmor: number;
  jetpackMaxFuel: number;
  fuelDrainRate: number;
  fuelRechargeRate: number;
  passiveTrait: string;
}

export type MapId = 
  | 'lusaka' 
  | 'copperbelt' 
  | 'victoria_falls' 
  | 'kafue' 
  | 'lake_kariba' 
  | 'training_camp'
  | 'south_luangwa'
  | 'muchinga'
  | 'bangweulu';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'one_way' | 'metal' | 'hazard' | 'moving';
  movingRange?: { minX: number; maxX: number; speed: number };
  color?: string;
}

export interface SpawnPoint {
  x: number;
  y: number;
  team?: 'green' | 'copper' | 'any';
}

export interface CaptureZone {
  x: number;
  y: number;
  radius: number;
  controlTeam: 'neutral' | 'green' | 'copper';
  progress: number; // -100 to +100 (-100 = green full, +100 = copper full, 0 = neutral)
  capturingTeam?: 'green' | 'copper' | null;
}

export interface MapDef {
  id: MapId;
  name: string;
  subtitle: string;
  description: string;
  width: number;
  height: number;
  gravity: number;
  bgGradient: [string, string, string];
  platforms: Platform[];
  spawns: SpawnPoint[];
  captureZone?: CaptureZone;
  pickupLocations: { x: number; y: number; type: 'health' | 'armor' | 'fuel' | 'ammo' | 'weapon'; weaponId?: WeaponId }[];
  ambientParticles: 'dust' | 'mist' | 'embers' | 'urban_glow';
}

export interface Projectile {
  id: string;
  ownerId: string;
  ownerTeam?: 'green' | 'copper' | 'none';
  weaponId: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  type: ProjectileType;
  lifetime: number;
  maxLifetime: number;
  bounceCount?: number;
  isExplosive?: boolean;
  explosionRadius?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity?: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  lifetime: number;
}

export interface PickupItem {
  id: string;
  type: 'health' | 'armor' | 'fuel' | 'ammo' | 'weapon';
  weaponId?: WeaponId;
  x: number;
  y: number;
  active: boolean;
  respawnTimeRemaining: number;
}

export interface ShellCasing {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  botDifficulty?: 'recruit' | 'warrior' | 'elite';
  characterId: CharacterId;
  skinId: string;
  team: 'green' | 'copper' | 'none';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  aimAngle: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  jetpackFuel: number;
  maxJetpackFuel: number;
  isGrounded: boolean;
  isJetpacking: boolean;
  isCrouching: boolean;
  isFiring: boolean;
  isReloading: boolean;
  reloadProgress: number;
  shieldHitFlash?: number;
  currentWeaponId: WeaponId;
  weapons: { id: WeaponId; ammoInClip: number; reserveAmmo: number }[];
  currentWeaponIndex: number;
  grenadeCount: number;
  grenadeCooldown: number;
  lastFireTime: number;
  isDead: boolean;
  respawnTimer: number;
  kills: number;
  deaths: number;
  score: number;
  damageDealt: number;
}

export interface KillFeedItem {
  id: string;
  killerName: string;
  killerTeam: 'green' | 'copper' | 'none';
  victimName: string;
  victimTeam: 'green' | 'copper' | 'none';
  weaponName: string;
  isHeadshot?: boolean;
  timestamp: number;
}

export interface RoomInfo {
  code: string;
  name: string;
  mode: GameMode;
  mapId: MapId;
  maxPlayers: number;
  currentPlayers: number;
  status: 'lobby' | 'playing' | 'ended';
  hostId: string;
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalKills: number;
  totalDeaths: number;
  totalWins: number;
  totalMatches: number;
  unlockedCharacters: CharacterId[];
  unlockedSkins: string[];
  selectedCharacter: CharacterId;
  selectedSkin: string;
  soundVolume: number;
  musicVolume: number;
  announcerVolume: number;
}

export interface NetworkLeaderboardEntry {
  id: string;
  name: string;
  team: 'green' | 'copper' | 'none';
  characterId: CharacterId;
  kills: number;
  deaths: number;
  score: number;
  damageDealt: number;
  ping?: number;
}

export interface NetworkMatchResult {
  winner: string;
  winningTeam: 'green' | 'copper' | 'draw' | 'none';
  teamScores: { green: number; copper: number };
  mvp: NetworkLeaderboardEntry;
  leaderboard: NetworkLeaderboardEntry[];
  matchDurationSeconds: number;
}

export interface NetworkDamagePayload {
  victimId: string;
  attackerId: string;
  damage: number;
  absorbedByArmor: number;
  health: number;
  armor: number;
  isHeadshot: boolean;
  weaponId: WeaponId;
}

export interface NetworkKillPayload {
  killerId: string;
  killerName: string;
  killerTeam: 'green' | 'copper' | 'none';
  victimId: string;
  victimName: string;
  victimTeam: 'green' | 'copper' | 'none';
  weaponId: WeaponId;
  isHeadshot: boolean;
  teamScores: { green: number; copper: number };
  killerKills: number;
  victimDeaths: number;
}

export interface NetworkRespawnPayload {
  playerId: string;
  x: number;
  y: number;
  health: number;
  armor: number;
  jetpackFuel: number;
}

export interface NetworkTickPayload {
  timeRemaining: number;
  teamScores: { green: number; copper: number };
  objectiveControl?: {
    greenProgress: number;
    copperProgress: number;
    controllingTeam: 'green' | 'copper' | 'neutral';
  };
}
