import { CharacterDef, CharacterId } from '../types/game';

export const CHARACTER_REGISTRY: Record<CharacterId, CharacterDef> = {
  chibesa: {
    id: 'chibesa',
    name: 'Chibesa',
    title: 'The Pride of Lusaka',
    role: 'All-Rounder Commando',
    bio: 'Born in the heart of Lusaka, Chibesa blends tactical discipline with fearless aerial acrobatics. She leads the Zambian Vanguard with balanced combat prowess.',
    portrait: '/src/assets/images/boma_hero_chibesa_1792696302570.jpg',
    primaryColor: '#16A34A', // Emerald green
    accentColor: '#F59E0B', // Amber
    skinVariants: [
      { id: 'chibesa_classic', name: 'Zambian Vanguard', color: '#16A34A', accent: '#F59E0B' },
      { id: 'chibesa_chipolopolo', name: 'Chipolopolo Pride', color: '#059669', accent: '#EA580C' },
      { id: 'chibesa_night_ops', name: 'Midnight Commando', color: '#1E293B', accent: '#38BDF8' }
    ],
    baseSpeed: 300,
    maxHealth: 100,
    maxArmor: 100,
    jetpackMaxFuel: 100,
    fuelDrainRate: 24, // fuel per second
    fuelRechargeRate: 30, // fuel per second on ground
    passiveTrait: 'Balanced Maneuvers: +10% faster health recovery delay.'
  },
  kapaso: {
    id: 'kapaso',
    name: 'Kapaso',
    title: 'The Cheetah Scout',
    role: 'High-Speed Infiltrator',
    bio: 'A lightning-fast courier turned tactical scout from Livingstone. Kapaso maneuvers across rooftops with blistering speed and swift aerial bursts.',
    portrait: '/src/assets/images/boma_hero_chibesa_1792696302570.jpg',
    primaryColor: '#EA580C', // Copper orange
    accentColor: '#FACC15', // Yellow
    skinVariants: [
      { id: 'kapaso_classic', name: 'Savannah Velocity', color: '#EA580C', accent: '#FACC15' },
      { id: 'kapaso_cyber', name: 'Neon Dash', color: '#0284C7', accent: '#F43F5E' },
      { id: 'kapaso_stealth', name: 'Shadow Ghost', color: '#334155', accent: '#E2E8F0' }
    ],
    baseSpeed: 350, // +16% faster
    maxHealth: 90,
    maxArmor: 80,
    jetpackMaxFuel: 90,
    fuelDrainRate: 22,
    fuelRechargeRate: 35,
    passiveTrait: 'Swift Thrusters: +16% ground and flight movement speed.'
  },
  bakunda: {
    id: 'bakunda',
    name: 'Ba Kunda',
    title: 'The Copper Colossus',
    role: 'Fortified Heavy Vanguard',
    bio: 'A veteran engineer and armored frontline defender from Ndola. Encased in reinforced copper alloy exoskeleton, Ba Kunda can absorb punishment and anchor key bomas.',
    portrait: '/src/assets/images/boma_hero_bakunda_1792696303633.jpg',
    primaryColor: '#B45309', // Copper bronze
    accentColor: '#DC2626', // Red
    skinVariants: [
      { id: 'bakunda_classic', name: 'Copper Fortress', color: '#B45309', accent: '#DC2626' },
      { id: 'bakunda_industrial', name: 'Ndola Smelter', color: '#78350F', accent: '#F59E0B' },
      { id: 'bakunda_juggernaut', name: 'Black Iron Titan', color: '#0F172A', accent: '#10B981' }
    ],
    baseSpeed: 260,
    maxHealth: 120,
    maxArmor: 130, // +30% Armor
    jetpackMaxFuel: 100,
    fuelDrainRate: 27,
    fuelRechargeRate: 26,
    passiveTrait: 'Fortified Chassis: +30 Armor and 40% reduced knockback.'
  },
  mweemba: {
    id: 'mweemba',
    name: 'Mweemba',
    title: 'The Boma Tactician',
    role: 'Ordinance & Weapon Specialist',
    bio: 'A brilliant strategist from Choma with unmatched firearm knowledge. Mweemba cycles magazines in milliseconds and handles explosive ordinance with surgical precision.',
    portrait: '/src/assets/images/boma_hero_chibesa_1792696302570.jpg',
    primaryColor: '#4F46E5', // Indigo
    accentColor: '#34D399', // Emerald
    skinVariants: [
      { id: 'mweemba_classic', name: 'Strategic Fieldmaster', color: '#4F46E5', accent: '#34D399' },
      { id: 'mweemba_specops', name: 'Victoria Spec-Ops', color: '#047857', accent: '#FBBF24' },
      { id: 'mweemba_tactical', name: 'Desert Recon', color: '#D97706', accent: '#1E293B' }
    ],
    baseSpeed: 295,
    maxHealth: 100,
    maxArmor: 100,
    jetpackMaxFuel: 100,
    fuelDrainRate: 24,
    fuelRechargeRate: 28,
    passiveTrait: 'Quick Munitions: 30% faster weapon reload and starts with +1 Grenade.'
  },
  chola: {
    id: 'chola',
    name: 'Chola',
    title: 'The Eagle Aviator',
    role: 'Aerial Ace',
    bio: 'Raised near the gorges of Victoria Falls, Chola engineered ultra-efficient twin turbine jetpacks. She rules the airspace with unmatched flight duration and hover stability.',
    portrait: '/src/assets/images/boma_hero_chibesa_1792696302570.jpg',
    primaryColor: '#0284C7', // Sky Blue
    accentColor: '#F43F5E', // Rose
    skinVariants: [
      { id: 'chola_classic', name: 'Falcon Wings', color: '#0284C7', accent: '#F43F5E' },
      { id: 'chola_solar', name: 'Kariba Sunray', color: '#F59E0B', accent: '#0D9488' },
      { id: 'chola_storm', name: 'Victoria Gale', color: '#475569', accent: '#38BDF8' }
    ],
    baseSpeed: 310,
    maxHealth: 95,
    maxArmor: 90,
    jetpackMaxFuel: 140, // +40% fuel
    fuelDrainRate: 18, // much lower drain
    fuelRechargeRate: 32,
    passiveTrait: 'Mosi Turbine: +40% max jetpack fuel and 25% lower fuel consumption.'
  }
};
