# BOMA BATTLE — Rise of the Zambian Warriors

A fast-paced, addictive 2D side-scrolling multiplayer arena shooter inspired by the accessible controls, jetpack movement, and chaotic combat . Set in a fictional futuristic Zambia where elite warriors compete to defend their communities, secure strategic Boma outposts, and become legendary champions.

---

## Features

### 1. Core Jetpack & Combat Mechanics
- **Jetpack Flight**: Limited fuel gauge with smooth vertical acceleration, particle exhaust, and automatic recharge upon grounding.
- **Fluid Movement**: Left/right sprint, duck/crouch, platform drops, and knockback from heavy calibers and explosions.
- **Dual-Mode Controls**: 
  - **Desktop**: Mouse aim + Left click fire, WASD / Space / Right-click jetpack, R reload, Q weapon cycle, G grenade throw.
  - **Mobile / Touch**: Dual virtual joysticks (Left: Move & Thrust, Right: Aim & Fire) plus on-screen touch buttons for grenade, reload, and weapon cycling.
- **Combat Vitals**: Dual-layer Health + Armor Shield systems, headshot multipliers, and floating damage numbers.

### 2. Authentic Zambian Heroes
- **Chibesa (All-Rounder Commando)**: Balanced warrior equipped with Chitenge combat scarf and rapid health recovery.
- **Kapaso (The Cheetah Scout)**: High-velocity agile ranger with +16% flight and ground speed.
- **Ba Kunda (The Copper Colossus)**: Heavy powerhouse encased in reinforced copper exoskeleton with +30 Armor and knockback reduction.
- **Mweemba (The Boma Tactician)**: Fast-cycling firearms specialist with 30% quicker reload and bonus frag grenades.
- **Chola (The Eagle Aviator)**: Sky ace with +40% jetpack fuel capacity and reduced burn rate.

### 3. Complete 9-Weapon Arsenal
1. **Kalambo AR-24**: Balanced assault rifle with reliable burst fire.
2. **Nyati Rapid SMG**: Blistering fire rate for close-quarters shredding.
3. **Eagle Eye Precision 50**: High-caliber sniper rifle with supersonic velocity.
4. **Boma Striker 12G**: Pump-action shotgun firing 8 lead buckshot pellets.
5. **Rhino LMG-77**: Belt-fed suppression heavy machine gun with screen shake.
6. **Victoria Plasma Blaster**: Ionized hydroelectric plasma caster with glowing neon projectile.
7. **Mosi-o-Tunya Heavy RPG**: "Smoke That Thunders" rocket with massive blast radius.
8. **Shosholoza Frag Grenade**: Bouncing timed explosive canister.
9. **Ngoni Battle Panga**: Forged steel melee blade with devastating close-range cleave.

### 4. 6 Zambian Battleground Arenas
1. **Lusaka Outskirts**: Vertical urban battleground with high-rises and unfinished building scaffolds.
2. **Copperbelt Mines**: Industrial gantries, conveyor belts, and molten copper smelter hazards.
3. **Victoria Falls Frontier**: Suspension bridges hanging over roaring cascades and misty drop-offs.
4. **Kafue Wildlands**: Savannah baobab branches, granite kopjes, and hidden bush perches.
5. **Lake Kariba**: Hydroelectric transmission platforms, floating docks, and open skyways.
6. **Boma Training Camp**: Tutorial range with target zones, boost pads, and obstacle platforms.

### 5. Game Modes
- **Local Practice**: Instant offline match against intelligent bots.
- **Free-for-All (FFA)**: Solo combat until target score.
- **Team Deathmatch (TDM)**: Chipolopolo (Green) vs Vanguard (Copper).
- **Capture the Boma**: Strategic territory control with rotating capture ring and continuous scoring.
- **Last Warrior Standing**: Elimination battle royale with no respawns.
- **Training Grounds**: Practice maneuvers and weapon handling.
- **Private Multiplayer Rooms**: Real-time WebSocket rooms with 6-character room codes.

### 6. Procedural Audio & Game Feel
- **Web Audio API Engine**: Synthesized muzzle cracks, explosions, jetpack loop, shield impacts, and reload clicks.
- **Zambian Announcer Lines**: Authentic spoken callouts including *"Eya, let's go!"*, *"Boma secured!"*, *"Weka pressure!"*, and *"Legendary warrior!"*.
- **African Percussion Grooves**: Dynamic procedural drum and kalimba rhythm tracks.

### 7. Progression & Replayability
- XP gains per match, level ups, unlocked skins, K/D tracking, and local persistence.

---

## Development & Run Instructions

```bash
# Install dependencies
npm install

# Start local full-stack development server (Express + WebSockets + Vite)
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
