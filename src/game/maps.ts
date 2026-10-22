import { MapDef, MapId } from '../types/game';

export const MAP_REGISTRY: Record<MapId, MapDef> = {
  lusaka: {
    id: 'lusaka',
    name: 'Lusaka Outskirts',
    subtitle: 'Urban Rooftops & Neon Scaffolds',
    description: 'Fast-paced vertical skirmishes atop modern Lusaka high-rises, unfinished concrete structures, and lively market skyways.',
    width: 2400,
    height: 1400,
    gravity: 980,
    bgGradient: ['#0F172A', '#1E293B', '#334155'],
    ambientParticles: 'urban_glow',
    platforms: [
      // Ground floor
      { x: 0, y: 1320, width: 2400, height: 80, type: 'solid', color: '#1E293B' },
      
      // Left Building Complex (Lusaka Trade Tower)
      { x: 120, y: 1080, width: 380, height: 30, type: 'solid', color: '#334155' },
      { x: 180, y: 840, width: 320, height: 26, type: 'one_way', color: '#475569' },
      { x: 140, y: 600, width: 360, height: 30, type: 'solid', color: '#334155' },
      { x: 220, y: 380, width: 220, height: 24, type: 'one_way', color: '#0F766E' },
      
      // Central Rooftop & Skybridge
      { x: 700, y: 1140, width: 300, height: 26, type: 'one_way', color: '#475569' },
      { x: 800, y: 900, width: 800, height: 36, type: 'solid', color: '#16A34A' }, // Central Boma Hub
      { x: 950, y: 660, width: 500, height: 26, type: 'one_way', color: '#F59E0B' },
      { x: 1050, y: 440, width: 300, height: 24, type: 'one_way', color: '#0284C7' },

      // Right Building Complex (East Park Tech Plaza)
      { x: 1900, y: 1080, width: 380, height: 30, type: 'solid', color: '#334155' },
      { x: 1900, y: 840, width: 320, height: 26, type: 'one_way', color: '#475569' },
      { x: 1880, y: 600, width: 380, height: 30, type: 'solid', color: '#334155' },
      { x: 1960, y: 380, width: 220, height: 24, type: 'one_way', color: '#EA580C' },

      // Lower connective platforms
      { x: 550, y: 1240, width: 220, height: 20, type: 'one_way', color: '#64748B' },
      { x: 1630, y: 1240, width: 220, height: 20, type: 'one_way', color: '#64748B' },
    ],
    spawns: [
      { x: 220, y: 550, team: 'green' },
      { x: 260, y: 1030, team: 'green' },
      { x: 600, y: 1200, team: 'green' },
      { x: 2100, y: 550, team: 'copper' },
      { x: 2050, y: 1030, team: 'copper' },
      { x: 1750, y: 1200, team: 'copper' },
      { x: 1200, y: 400, team: 'any' },
      { x: 1200, y: 850, team: 'any' }
    ],
    captureZone: {
      x: 1200,
      y: 860,
      radius: 120,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1200, y: 630, type: 'armor' },
      { x: 1200, y: 400, type: 'weapon', weaponId: 'mosi_rpg' },
      { x: 300, y: 340, type: 'weapon', weaponId: 'eagle_sniper' },
      { x: 2070, y: 340, type: 'weapon', weaponId: 'eagle_sniper' },
      { x: 280, y: 800, type: 'health' },
      { x: 2050, y: 800, type: 'health' },
      { x: 1200, y: 1280, type: 'fuel' },
      { x: 850, y: 860, type: 'ammo' },
      { x: 1550, y: 860, type: 'ammo' }
    ]
  },

  copperbelt: {
    id: 'copperbelt',
    name: 'Copperbelt Mines',
    subtitle: 'Industrial Catwalks & Smelter Pits',
    description: 'A subterranean industrial stronghold with heated smelting zones, conveyor gantries, and dense vertical combat.',
    width: 2500,
    height: 1500,
    gravity: 1000,
    bgGradient: ['#1C1917', '#44281D', '#78350F'],
    ambientParticles: 'embers',
    platforms: [
      // Ground with central molten copper hazard
      { x: 0, y: 1420, width: 850, height: 80, type: 'solid', color: '#292524' },
      { x: 850, y: 1440, width: 800, height: 60, type: 'hazard', color: '#EA580C' }, // Lava/Molten Copper
      { x: 1650, y: 1420, width: 850, height: 80, type: 'solid', color: '#292524' },

      // Lower Conveyor Catwalks
      { x: 300, y: 1220, width: 450, height: 24, type: 'metal', color: '#78350F' },
      { x: 1750, y: 1220, width: 450, height: 24, type: 'metal', color: '#78350F' },
      { x: 920, y: 1180, width: 660, height: 26, type: 'one_way', color: '#D97706' },

      // Mid Level Ore Refinery
      { x: 150, y: 960, width: 500, height: 30, type: 'solid', color: '#44403C' },
      { x: 1850, y: 960, width: 500, height: 30, type: 'solid', color: '#44403C' },
      { x: 800, y: 920, width: 900, height: 34, type: 'solid', color: '#B45309' }, // Central Copper Hearth

      // Upper Crane Rails & Silos
      { x: 380, y: 680, width: 420, height: 24, type: 'one_way', color: '#F59E0B' },
      { x: 1700, y: 680, width: 420, height: 24, type: 'one_way', color: '#F59E0B' },
      { x: 950, y: 580, width: 600, height: 28, type: 'metal', color: '#78350F' },
      { x: 1100, y: 360, width: 300, height: 22, type: 'one_way', color: '#FCD34D' },
    ],
    spawns: [
      { x: 280, y: 910, team: 'green' },
      { x: 400, y: 1170, team: 'green' },
      { x: 2220, y: 910, team: 'copper' },
      { x: 2100, y: 1170, team: 'copper' },
      { x: 1250, y: 860, team: 'any' },
      { x: 1250, y: 520, team: 'any' }
    ],
    captureZone: {
      x: 1250,
      y: 880,
      radius: 125,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1250, y: 320, type: 'weapon', weaponId: 'rhino_lmg' },
      { x: 1250, y: 540, type: 'armor' },
      { x: 500, y: 640, type: 'health' },
      { x: 2000, y: 640, type: 'health' },
      { x: 1250, y: 1140, type: 'weapon', weaponId: 'boma_striker' },
      { x: 380, y: 1180, type: 'fuel' },
      { x: 2120, y: 1180, type: 'fuel' },
      { x: 980, y: 880, type: 'ammo' },
      { x: 1520, y: 880, type: 'ammo' }
    ]
  },

  victoria_falls: {
    id: 'victoria_falls',
    name: 'Victoria Falls Frontier',
    subtitle: 'The Smoke That Thunders (Mosi-oa-Tunya)',
    description: 'Spectacular cliffside bridges suspended above roaring cascades, misty rainbow vistas, and high-altitude drop zones.',
    width: 2600,
    height: 1500,
    gravity: 960,
    bgGradient: ['#0C4A6E', '#0369A1', '#38BDF8'],
    ambientParticles: 'mist',
    platforms: [
      // Left Gorge Rock Cliff
      { x: 0, y: 1280, width: 650, height: 220, type: 'solid', color: '#334155' },
      { x: 100, y: 1020, width: 450, height: 32, type: 'solid', color: '#1E293B' },
      { x: 180, y: 760, width: 360, height: 28, type: 'one_way', color: '#0284C7' },
      { x: 80, y: 500, width: 380, height: 30, type: 'solid', color: '#0F766E' },

      // Right Gorge Rock Cliff
      { x: 1950, y: 1280, width: 650, height: 220, type: 'solid', color: '#334155' },
      { x: 2050, y: 1020, width: 450, height: 32, type: 'solid', color: '#1E293B' },
      { x: 2060, y: 760, width: 360, height: 28, type: 'one_way', color: '#0284C7' },
      { x: 2140, y: 500, width: 380, height: 30, type: 'solid', color: '#0F766E' },

      // Historic Knife-Edge Suspension Bridges
      { x: 750, y: 1180, width: 1100, height: 24, type: 'one_way', color: '#D97706' },
      { x: 900, y: 880, width: 800, height: 26, type: 'one_way', color: '#0D9488' }, // Central Misty Bridge
      { x: 1050, y: 620, width: 500, height: 24, type: 'one_way', color: '#38BDF8' },
      { x: 1150, y: 380, width: 300, height: 22, type: 'one_way', color: '#FACC15' },

      // Hazard at bottom of chasm (River cataract)
      { x: 650, y: 1470, width: 1300, height: 30, type: 'hazard', color: '#0284C7' }
    ],
    spawns: [
      { x: 300, y: 970, team: 'green' },
      { x: 250, y: 450, team: 'green' },
      { x: 2300, y: 970, team: 'copper' },
      { x: 2350, y: 450, team: 'copper' },
      { x: 1300, y: 830, team: 'any' },
      { x: 1300, y: 330, team: 'any' }
    ],
    captureZone: {
      x: 1300,
      y: 840,
      radius: 120,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1300, y: 340, type: 'weapon', weaponId: 'victoria_plasma' },
      { x: 1300, y: 580, type: 'armor' },
      { x: 320, y: 720, type: 'health' },
      { x: 2280, y: 720, type: 'health' },
      { x: 1300, y: 1140, type: 'weapon', weaponId: 'mosi_rpg' },
      { x: 820, y: 1140, type: 'fuel' },
      { x: 1780, y: 1140, type: 'fuel' },
      { x: 1050, y: 840, type: 'ammo' },
      { x: 1550, y: 840, type: 'ammo' }
    ]
  },

  kafue: {
    id: 'kafue',
    name: 'Kafue Wildlands',
    subtitle: 'Savannah Plateaus & Baobab Perches',
    description: 'Rugged wild terrain with natural granite kopjes, sweeping baobab branches, and hidden ambush routes.',
    width: 2400,
    height: 1400,
    gravity: 980,
    bgGradient: ['#1E1B4B', '#4C1D95', '#B45309'],
    ambientParticles: 'dust',
    platforms: [
      // Savannah Ground Base
      { x: 0, y: 1320, width: 2400, height: 80, type: 'solid', color: '#451A03' },

      // Left Baobab & Granite Crag
      { x: 140, y: 1120, width: 380, height: 32, type: 'solid', color: '#78350F' },
      { x: 220, y: 880, width: 320, height: 26, type: 'one_way', color: '#16A34A' },
      { x: 160, y: 640, width: 340, height: 28, type: 'solid', color: '#78350F' },
      { x: 260, y: 420, width: 240, height: 24, type: 'one_way', color: '#15803D' },

      // Central Plateau (Boma Outpost)
      { x: 750, y: 1180, width: 250, height: 22, type: 'one_way', color: '#B45309' },
      { x: 850, y: 940, width: 700, height: 34, type: 'solid', color: '#78350F' },
      { x: 1000, y: 700, width: 400, height: 26, type: 'one_way', color: '#16A34A' },
      { x: 1080, y: 460, width: 240, height: 24, type: 'one_way', color: '#EAB308' },
      { x: 1400, y: 1180, width: 250, height: 22, type: 'one_way', color: '#B45309' },

      // Right Kopje Rock
      { x: 1880, y: 1120, width: 380, height: 32, type: 'solid', color: '#78350F' },
      { x: 1860, y: 880, width: 320, height: 26, type: 'one_way', color: '#16A34A' },
      { x: 1900, y: 640, width: 340, height: 28, type: 'solid', color: '#78350F' },
      { x: 1900, y: 420, width: 240, height: 24, type: 'one_way', color: '#15803D' },
    ],
    spawns: [
      { x: 300, y: 1070, team: 'green' },
      { x: 320, y: 590, team: 'green' },
      { x: 2100, y: 1070, team: 'copper' },
      { x: 2080, y: 590, team: 'copper' },
      { x: 1200, y: 900, team: 'any' },
      { x: 1200, y: 420, team: 'any' }
    ],
    captureZone: {
      x: 1200,
      y: 900,
      radius: 120,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1200, y: 420, type: 'weapon', weaponId: 'eagle_sniper' },
      { x: 1200, y: 660, type: 'armor' },
      { x: 320, y: 840, type: 'health' },
      { x: 2080, y: 840, type: 'health' },
      { x: 1200, y: 1280, type: 'weapon', weaponId: 'nyati_smg' },
      { x: 500, y: 1280, type: 'fuel' },
      { x: 1900, y: 1280, type: 'fuel' },
      { x: 920, y: 900, type: 'ammo' },
      { x: 1480, y: 900, type: 'ammo' }
    ]
  },

  lake_kariba: {
    id: 'lake_kariba',
    name: 'Lake Kariba',
    subtitle: 'Floating Pontoons & Transmission Struts',
    description: 'Battles across hydroelectric transmission towers, wooden boat docks, and calm shimmering water.',
    width: 2500,
    height: 1400,
    gravity: 980,
    bgGradient: ['#082F49', '#0369A1', '#065F46'],
    ambientParticles: 'mist',
    platforms: [
      // Deep Lake Water Level Hazard
      { x: 0, y: 1360, width: 2500, height: 40, type: 'hazard', color: '#0284C7' },

      // Floating Pier Catwalks
      { x: 120, y: 1240, width: 550, height: 32, type: 'solid', color: '#78350F' },
      { x: 800, y: 1220, width: 900, height: 32, type: 'solid', color: '#0F766E' },
      { x: 1830, y: 1240, width: 550, height: 32, type: 'solid', color: '#78350F' },

      // Transmission Tower Levels
      { x: 250, y: 960, width: 380, height: 26, type: 'one_way', color: '#334155' },
      { x: 1870, y: 960, width: 380, height: 26, type: 'one_way', color: '#334155' },

      // Hydro Dam Substation Center
      { x: 750, y: 880, width: 1000, height: 36, type: 'solid', color: '#1E293B' },
      { x: 920, y: 640, width: 660, height: 26, type: 'one_way', color: '#0284C7' },
      { x: 1080, y: 400, width: 340, height: 24, type: 'one_way', color: '#F59E0B' },

      { x: 300, y: 680, width: 300, height: 24, type: 'one_way', color: '#0F766E' },
      { x: 1900, y: 680, width: 300, height: 24, type: 'one_way', color: '#0F766E' }
    ],
    spawns: [
      { x: 350, y: 1190, team: 'green' },
      { x: 400, y: 630, team: 'green' },
      { x: 2150, y: 1190, team: 'copper' },
      { x: 2100, y: 630, team: 'copper' },
      { x: 1250, y: 830, team: 'any' },
      { x: 1250, y: 350, team: 'any' }
    ],
    captureZone: {
      x: 1250,
      y: 840,
      radius: 125,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1250, y: 360, type: 'weapon', weaponId: 'rhino_lmg' },
      { x: 1250, y: 600, type: 'armor' },
      { x: 400, y: 920, type: 'health' },
      { x: 2100, y: 920, type: 'health' },
      { x: 1250, y: 1180, type: 'weapon', weaponId: 'boma_striker' },
      { x: 900, y: 1180, type: 'fuel' },
      { x: 1600, y: 1180, type: 'fuel' },
      { x: 880, y: 840, type: 'ammo' },
      { x: 1620, y: 840, type: 'ammo' }
    ]
  },

  training_camp: {
    id: 'training_camp',
    name: 'Boma Training Camp',
    subtitle: 'Warrior Academy & Obstacle Range',
    description: 'Special training facility with wide open spaces, clearly marked fuel stations, target platforms, and jetpack rings.',
    width: 2200,
    height: 1300,
    gravity: 960,
    bgGradient: ['#064E3B', '#047857', '#0F172A'],
    ambientParticles: 'urban_glow',
    platforms: [
      // Training Floor
      { x: 0, y: 1220, width: 2200, height: 80, type: 'solid', color: '#166534' },

      // Training Obstacle Tier 1
      { x: 200, y: 1020, width: 350, height: 26, type: 'one_way', color: '#F59E0B' },
      { x: 750, y: 980, width: 700, height: 32, type: 'solid', color: '#15803D' },
      { x: 1650, y: 1020, width: 350, height: 26, type: 'one_way', color: '#F59E0B' },

      // Tier 2 Elevated Platforms
      { x: 300, y: 780, width: 300, height: 24, type: 'one_way', color: '#0284C7' },
      { x: 900, y: 720, width: 400, height: 28, type: 'solid', color: '#166534' },
      { x: 1600, y: 780, width: 300, height: 24, type: 'one_way', color: '#0284C7' },

      // High Sniper Perch
      { x: 980, y: 460, width: 240, height: 22, type: 'one_way', color: '#EAB308' },
    ],
    spawns: [
      { x: 350, y: 1170, team: 'green' },
      { x: 400, y: 730, team: 'green' },
      { x: 1850, y: 1170, team: 'copper' },
      { x: 1800, y: 730, team: 'copper' },
      { x: 1100, y: 930, team: 'any' },
      { x: 1100, y: 410, team: 'any' }
    ],
    captureZone: {
      x: 1100,
      y: 940,
      radius: 120,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1100, y: 420, type: 'weapon', weaponId: 'ak_zambia' },
      { x: 1100, y: 680, type: 'armor' },
      { x: 350, y: 980, type: 'health' },
      { x: 1800, y: 980, type: 'health' },
      { x: 500, y: 1180, type: 'fuel' },
      { x: 1700, y: 1180, type: 'fuel' },
      { x: 900, y: 940, type: 'ammo' },
      { x: 1300, y: 940, type: 'ammo' }
    ]
  },

  south_luangwa: {
    id: 'south_luangwa',
    name: 'South Luangwa Safari',
    subtitle: 'Riverbank Watchtowers & Acacia Canopy',
    description: 'Iconic African wildlife valley with wooden safari outposts, high mahogany canopy catwalks, and oxbow water crossings.',
    width: 2500,
    height: 1450,
    gravity: 980,
    bgGradient: ['#451A03', '#9A3412', '#D97706'],
    ambientParticles: 'dust',
    platforms: [
      // Riverbed ground with central water hazard
      { x: 0, y: 1360, width: 900, height: 90, type: 'solid', color: '#78350F' },
      { x: 900, y: 1390, width: 700, height: 60, type: 'hazard', color: '#0369A1' }, // Luangwa River Hippo Channel
      { x: 1600, y: 1360, width: 900, height: 90, type: 'solid', color: '#78350F' },

      // Lower Riverbank Boardwalks
      { x: 250, y: 1180, width: 450, height: 26, type: 'one_way', color: '#B45309' },
      { x: 1800, y: 1180, width: 450, height: 26, type: 'one_way', color: '#B45309' },

      // Safari Lodge Observation Deck (Central Boma)
      { x: 800, y: 1020, width: 900, height: 34, type: 'solid', color: '#854D0E' },
      { x: 1000, y: 760, width: 500, height: 26, type: 'one_way', color: '#EAB308' },

      // Tree Canopy Sniping Platforms
      { x: 160, y: 840, width: 380, height: 28, type: 'solid', color: '#15803D' },
      { x: 1960, y: 840, width: 380, height: 28, type: 'solid', color: '#15803D' },
      { x: 300, y: 560, width: 260, height: 22, type: 'one_way', color: '#16A34A' },
      { x: 1940, y: 560, width: 260, height: 22, type: 'one_way', color: '#16A34A' },

      // High Skybridge
      { x: 850, y: 480, width: 800, height: 24, type: 'one_way', color: '#B45309' },
    ],
    spawns: [
      { x: 300, y: 790, team: 'green' },
      { x: 350, y: 1130, team: 'green' },
      { x: 2150, y: 790, team: 'copper' },
      { x: 2100, y: 1130, team: 'copper' },
      { x: 1250, y: 970, team: 'any' },
      { x: 1250, y: 430, team: 'any' }
    ],
    captureZone: {
      x: 1250,
      y: 980,
      radius: 125,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1250, y: 430, type: 'weapon', weaponId: 'nyami_arc' },
      { x: 1250, y: 710, type: 'armor' },
      { x: 420, y: 510, type: 'health' },
      { x: 2060, y: 510, type: 'health' },
      { x: 1250, y: 1280, type: 'fuel' },
      { x: 400, y: 1130, type: 'ammo' },
      { x: 2000, y: 1130, type: 'ammo' }
    ]
  },

  muchinga: {
    id: 'muchinga',
    name: 'Muchinga Escarpment',
    subtitle: 'High Mountain Pass & Cableway Gantries',
    description: 'Dramatic granite cliffs carved into the Great Rift Valley with hanging cable bridges, fierce updrafts, and treacherous chasms.',
    width: 2600,
    height: 1550,
    gravity: 950,
    bgGradient: ['#020617', '#1E293B', '#334155'],
    ambientParticles: 'mist',
    platforms: [
      // Deep Abyssal Chasm (Deadly void bottom)
      { x: 0, y: 1500, width: 2600, height: 50, type: 'hazard', color: '#0F172A' },

      // Left Mountain Spur
      { x: 80, y: 1320, width: 600, height: 180, type: 'solid', color: '#334155' },
      { x: 160, y: 1040, width: 420, height: 30, type: 'solid', color: '#475569' },
      { x: 120, y: 740, width: 360, height: 26, type: 'one_way', color: '#64748B' },
      { x: 240, y: 460, width: 280, height: 24, type: 'one_way', color: '#94A3B8' },

      // Right Mountain Spur
      { x: 1920, y: 1320, width: 600, height: 180, type: 'solid', color: '#334155' },
      { x: 2020, y: 1040, width: 420, height: 30, type: 'solid', color: '#475569' },
      { x: 2120, y: 740, width: 360, height: 26, type: 'one_way', color: '#64748B' },
      { x: 2080, y: 460, width: 280, height: 24, type: 'one_way', color: '#94A3B8' },

      // Central Suspended Cable Fortress (Boma Core)
      { x: 750, y: 1140, width: 1100, height: 28, type: 'one_way', color: '#0284C7' },
      { x: 900, y: 880, width: 800, height: 36, type: 'solid', color: '#1E293B' },
      { x: 1050, y: 620, width: 500, height: 24, type: 'one_way', color: '#38BDF8' },
      { x: 1180, y: 360, width: 240, height: 22, type: 'one_way', color: '#FACC15' },
    ],
    spawns: [
      { x: 300, y: 990, team: 'green' },
      { x: 350, y: 410, team: 'green' },
      { x: 2300, y: 990, team: 'copper' },
      { x: 2250, y: 410, team: 'copper' },
      { x: 1300, y: 830, team: 'any' },
      { x: 1300, y: 310, team: 'any' }
    ],
    captureZone: {
      x: 1300,
      y: 840,
      radius: 125,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1300, y: 310, type: 'weapon', weaponId: 'choma_cannon' },
      { x: 1300, y: 570, type: 'armor' },
      { x: 320, y: 690, type: 'health' },
      { x: 2280, y: 690, type: 'health' },
      { x: 1300, y: 1090, type: 'weapon', weaponId: 'eagle_sniper' },
      { x: 800, y: 1090, type: 'fuel' },
      { x: 1800, y: 1090, type: 'fuel' },
      { x: 1080, y: 830, type: 'ammo' },
      { x: 1520, y: 830, type: 'ammo' }
    ]
  },

  bangweulu: {
    id: 'bangweulu',
    name: 'Bangweulu Wetlands',
    subtitle: 'Papyrus Shoals & Stilt Boardwalks',
    description: 'Vast shimmering marshes where water meets the sky, featuring elevated fisherman stilt huts and shoebill roosting perches.',
    width: 2500,
    height: 1400,
    gravity: 980,
    bgGradient: ['#064E3B', '#047857', '#0E7490'],
    ambientParticles: 'mist',
    platforms: [
      // Wetland Water Bottom
      { x: 0, y: 1350, width: 2500, height: 50, type: 'hazard', color: '#0369A1' },

      // Stilt Boardwalks
      { x: 100, y: 1220, width: 650, height: 30, type: 'solid', color: '#854D0E' },
      { x: 850, y: 1200, width: 800, height: 30, type: 'solid', color: '#15803D' },
      { x: 1750, y: 1220, width: 650, height: 30, type: 'solid', color: '#854D0E' },

      // Mid Level Reed Watchtowers
      { x: 250, y: 940, width: 420, height: 26, type: 'one_way', color: '#B45309' },
      { x: 1830, y: 940, width: 420, height: 26, type: 'one_way', color: '#B45309' },

      // Central Shoebill Roost (Boma Outpost)
      { x: 800, y: 880, width: 900, height: 34, type: 'solid', color: '#166534' },
      { x: 950, y: 640, width: 600, height: 26, type: 'one_way', color: '#22C55E' },
      { x: 1080, y: 400, width: 340, height: 24, type: 'one_way', color: '#38BDF8' },

      // High Reed Perches
      { x: 380, y: 680, width: 260, height: 22, type: 'one_way', color: '#15803D' },
      { x: 1860, y: 680, width: 260, height: 22, type: 'one_way', color: '#15803D' },
    ],
    spawns: [
      { x: 320, y: 1170, team: 'green' },
      { x: 400, y: 630, team: 'green' },
      { x: 2180, y: 1170, team: 'copper' },
      { x: 2100, y: 630, team: 'copper' },
      { x: 1250, y: 830, team: 'any' },
      { x: 1250, y: 350, team: 'any' }
    ],
    captureZone: {
      x: 1250,
      y: 840,
      radius: 125,
      controlTeam: 'neutral',
      progress: 0
    },
    pickupLocations: [
      { x: 1250, y: 350, type: 'weapon', weaponId: 'rhino_lmg' },
      { x: 1250, y: 590, type: 'armor' },
      { x: 420, y: 890, type: 'health' },
      { x: 2080, y: 890, type: 'health' },
      { x: 1250, y: 1150, type: 'weapon', weaponId: 'boma_striker' },
      { x: 920, y: 1150, type: 'fuel' },
      { x: 1580, y: 1150, type: 'fuel' },
      { x: 900, y: 830, type: 'ammo' },
      { x: 1600, y: 830, type: 'ammo' }
    ]
  }
};
