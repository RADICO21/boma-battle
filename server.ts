import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

type WeaponId =
  | 'ak_zambia'
  | 'nyati_smg'
  | 'kalulushi_sniper'
  | 'luanshya_shotgun'
  | 'rhino_lmg'
  | 'copper_blaster'
  | 'shosholoza_rocket'
  | 'ngoni_club'
  | 'shosholoza_grenade'
  | 'nyami_arc'
  | 'choma_cannon';

type GameMode = 'ffa' | 'tdm' | 'capture_boma' | 'survival' | 'practice' | 'training';
type MapId =
  | 'lusaka'
  | 'copperbelt'
  | 'victoria_falls'
  | 'kafue'
  | 'lake_kariba'
  | 'south_luangwa'
  | 'muchinga'
  | 'bangweulu'
  | 'training_camp';

// Server-authoritative weapon damage registry
const SERVER_WEAPONS: Record<
  WeaponId,
  { damage: number; fireRateMs: number; isExplosive: boolean; explosionRadius: number }
> = {
  ak_zambia: { damage: 24, fireRateMs: 120, isExplosive: false, explosionRadius: 0 },
  nyati_smg: { damage: 16, fireRateMs: 80, isExplosive: false, explosionRadius: 0 },
  kalulushi_sniper: { damage: 85, fireRateMs: 900, isExplosive: false, explosionRadius: 0 },
  luanshya_shotgun: { damage: 18, fireRateMs: 650, isExplosive: false, explosionRadius: 0 },
  rhino_lmg: { damage: 26, fireRateMs: 140, isExplosive: false, explosionRadius: 0 },
  copper_blaster: { damage: 32, fireRateMs: 250, isExplosive: false, explosionRadius: 0 },
  shosholoza_rocket: { damage: 120, fireRateMs: 1200, isExplosive: true, explosionRadius: 140 },
  ngoni_club: { damage: 65, fireRateMs: 400, isExplosive: false, explosionRadius: 0 },
  shosholoza_grenade: { damage: 110, fireRateMs: 1500, isExplosive: true, explosionRadius: 130 },
  nyami_arc: { damage: 40, fireRateMs: 290, isExplosive: false, explosionRadius: 0 },
  choma_cannon: { damage: 22, fireRateMs: 750, isExplosive: false, explosionRadius: 0 },
};

// Spawn points registry per map
const MAP_SPAWNS: Record<MapId, { x: number; y: number }[]> = {
  lusaka: [
    { x: 350, y: 550 },
    { x: 1950, y: 550 },
    { x: 650, y: 750 },
    { x: 1650, y: 750 },
    { x: 1150, y: 350 },
  ],
  copperbelt: [
    { x: 300, y: 650 },
    { x: 2050, y: 650 },
    { x: 750, y: 400 },
    { x: 1600, y: 400 },
    { x: 1200, y: 750 },
  ],
  victoria_falls: [
    { x: 350, y: 500 },
    { x: 2150, y: 500 },
    { x: 800, y: 680 },
    { x: 1700, y: 680 },
    { x: 1250, y: 380 },
  ],
  kafue: [
    { x: 300, y: 600 },
    { x: 2000, y: 600 },
    { x: 800, y: 450 },
    { x: 1500, y: 450 },
  ],
  lake_kariba: [
    { x: 300, y: 600 },
    { x: 2200, y: 600 },
    { x: 900, y: 480 },
    { x: 1600, y: 480 },
  ],
  south_luangwa: [
    { x: 320, y: 580 },
    { x: 2180, y: 580 },
    { x: 850, y: 420 },
    { x: 1650, y: 420 },
  ],
  muchinga: [
    { x: 350, y: 500 },
    { x: 2150, y: 500 },
    { x: 900, y: 380 },
    { x: 1600, y: 380 },
  ],
  bangweulu: [
    { x: 300, y: 650 },
    { x: 2100, y: 650 },
    { x: 800, y: 480 },
    { x: 1600, y: 480 },
  ],
  training_camp: [
    { x: 300, y: 600 },
    { x: 1500, y: 600 },
    { x: 600, y: 400 },
    { x: 1200, y: 400 },
  ],
};

interface ServerPlayer {
  id: string;
  name: string;
  characterId: string;
  team: 'green' | 'copper' | 'none';
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  aimAngle: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  jetpackFuel: number;
  isJetpacking: boolean;
  isFiring: boolean;
  isCrouching: boolean;
  currentWeaponId: WeaponId;
  kills: number;
  deaths: number;
  score: number;
  damageDealt: number;
  isDead: boolean;
  respawnTimer: number;
  lastFireTime: number;
}

interface ServerRoom {
  code: string;
  name: string;
  hostId: string;
  mode: GameMode;
  mapId: MapId;
  players: Map<string, { ws: WebSocket; data: ServerPlayer }>;
  teamScores: { green: number; copper: number };
  status: 'lobby' | 'playing' | 'ended';
  matchTimeRemaining: number;
  matchDurationSeconds: number;
  objectiveControl: {
    greenProgress: number;
    copperProgress: number;
    controllingTeam: 'green' | 'copper' | 'neutral';
  };
  tickTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: ServerRoom, message: object, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  room.players.forEach(({ ws }) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function getSafeSpawn(room: ServerRoom, team: 'green' | 'copper' | 'none'): { x: number; y: number } {
  const spawnList = MAP_SPAWNS[room.mapId] || MAP_SPAWNS.lusaka;
  if (team === 'green') {
    return spawnList[0] || { x: 400, y: 600 };
  } else if (team === 'copper') {
    return spawnList[spawnList.length - 1] || { x: 1900, y: 600 };
  }
  const idx = Math.floor(Math.random() * spawnList.length);
  return spawnList[idx] || { x: 500, y: 600 };
}

function checkWinCondition(room: ServerRoom) {
  if (room.status !== 'playing') return;

  let gameOver = false;
  let winner = '';
  let winningTeam: 'green' | 'copper' | 'draw' | 'none' = 'none';

  if (room.mode === 'tdm') {
    // 15 Kills target or timer reached
    if (room.teamScores.green >= 15) {
      gameOver = true;
      winner = 'Green Warriors Victory!';
      winningTeam = 'green';
    } else if (room.teamScores.copper >= 15) {
      gameOver = true;
      winner = 'Copper Rebels Victory!';
      winningTeam = 'copper';
    } else if (room.matchTimeRemaining <= 0) {
      gameOver = true;
      if (room.teamScores.green > room.teamScores.copper) {
        winner = 'Green Warriors Victory!';
        winningTeam = 'green';
      } else if (room.teamScores.copper > room.teamScores.green) {
        winner = 'Copper Rebels Victory!';
        winningTeam = 'copper';
      } else {
        winner = 'Honorable Stalemate (Draw)';
        winningTeam = 'draw';
      }
    }
  } else if (room.mode === 'capture_boma') {
    // 100 points target or timer reached
    if (room.teamScores.green >= 100) {
      gameOver = true;
      winner = 'Green Warriors Secured the Boma!';
      winningTeam = 'green';
    } else if (room.teamScores.copper >= 100) {
      gameOver = true;
      winner = 'Copper Rebels Secured the Boma!';
      winningTeam = 'copper';
    } else if (room.matchTimeRemaining <= 0) {
      gameOver = true;
      if (room.teamScores.green > room.teamScores.copper) {
        winner = 'Green Warriors Hold the Boma!';
        winningTeam = 'green';
      } else if (room.teamScores.copper > room.teamScores.green) {
        winner = 'Copper Rebels Hold the Boma!';
        winningTeam = 'copper';
      } else {
        winner = 'Contested Boma (Draw)';
        winningTeam = 'draw';
      }
    }
  } else if (room.mode === 'ffa') {
    // First to 10 kills or timer reached
    const playerList = Array.from(room.players.values()).map((p) => p.data);
    playerList.sort((a, b) => b.kills - a.kills);
    const topPlayer = playerList[0];
    const topName = topPlayer ? topPlayer.name : 'Warrior';

    if (topPlayer && topPlayer.kills >= 10) {
      gameOver = true;
      winner = `${topName} Champion of the Arena!`;
    } else if (room.matchTimeRemaining <= 0) {
      gameOver = true;
      winner = `${topName} Wins by Elimination!`;
    }
  } else if (room.mode === 'survival') {
    // Last warrior standing
    const alivePlayers: ServerPlayer[] = [];
    room.players.forEach(({ data }) => {
      if (!data.isDead) alivePlayers.push(data);
    });

    if (room.players.size > 1 && alivePlayers.length <= 1) {
      gameOver = true;
      winner = alivePlayers.length === 1 ? `${alivePlayers[0].name} Last Warrior Standing!` : 'All Warriors Fallen!';
    } else if (room.matchTimeRemaining <= 0) {
      gameOver = true;
      winner = alivePlayers[0] ? `${alivePlayers[0].name} Survived the Battle!` : 'Time Expired!';
    }
  }

  if (gameOver) {
    endMatch(room, winner, winningTeam);
  }
}

function endMatch(room: ServerRoom, winner: string, winningTeam: 'green' | 'copper' | 'draw' | 'none') {
  if (room.status === 'ended') return;
  room.status = 'ended';

  if (room.tickTimer) {
    clearInterval(room.tickTimer);
    room.tickTimer = undefined;
  }

  // Calculate Leaderboard
  const playerList = Array.from(room.players.values()).map((p) => ({
    id: p.data.id,
    name: p.data.name,
    team: p.data.team,
    characterId: p.data.characterId as any,
    kills: p.data.kills,
    deaths: p.data.deaths,
    score: p.data.score,
    damageDealt: p.data.damageDealt,
  }));

  playerList.sort((a, b) => b.score - a.score || b.kills - a.kills);

  const mvp = playerList[0] || {
    id: '',
    name: 'Top Warrior',
    team: 'none',
    characterId: 'chibesa',
    kills: 0,
    deaths: 0,
    score: 0,
    damageDealt: 0,
  };

  const results = {
    winner,
    winningTeam,
    teamScores: { ...room.teamScores },
    mvp,
    leaderboard: playerList,
    matchDurationSeconds: 300 - room.matchTimeRemaining,
  };

  broadcastToRoom(room, {
    type: 'match_results',
    ...results,
  });
}

function startRoomGameLoop(room: ServerRoom) {
  if (room.tickTimer) clearInterval(room.tickTimer);

  room.status = 'playing';
  room.matchTimeRemaining = 300;

  room.tickTimer = setInterval(() => {
    if (room.status !== 'playing' || room.players.size === 0) {
      if (room.tickTimer) clearInterval(room.tickTimer);
      return;
    }

    room.matchTimeRemaining = Math.max(0, room.matchTimeRemaining - 1);

    // Capture the Boma objective logic
    if (room.mode === 'capture_boma') {
      const bomaCenterX = 1200;
      const bomaCenterY = 700;
      const bomaRadius = 220;

      let greenInZone = 0;
      let copperInZone = 0;

      room.players.forEach(({ data }) => {
        if (!data.isDead) {
          const dist = Math.hypot(data.x - bomaCenterX, data.y - bomaCenterY);
          if (dist <= bomaRadius) {
            if (data.team === 'green') greenInZone++;
            if (data.team === 'copper') copperInZone++;
          }
        }
      });

      if (greenInZone > 0 && copperInZone === 0) {
        room.objectiveControl.greenProgress = Math.min(100, room.objectiveControl.greenProgress + 2);
        room.teamScores.green += 1;
        room.objectiveControl.controllingTeam = 'green';
      } else if (copperInZone > 0 && greenInZone === 0) {
        room.objectiveControl.copperProgress = Math.min(100, room.objectiveControl.copperProgress + 2);
        room.teamScores.copper += 1;
        room.objectiveControl.controllingTeam = 'copper';
      } else if (greenInZone === 0 && copperInZone === 0) {
        room.objectiveControl.controllingTeam = 'neutral';
      }
    }

    // Respawn timers
    if (room.mode !== 'survival') {
      room.players.forEach(({ data }) => {
        if (data.isDead) {
          data.respawnTimer -= 1;
          if (data.respawnTimer <= 0) {
            data.isDead = false;
            data.health = data.maxHealth;
            data.armor = data.maxArmor;
            data.jetpackFuel = 100;

            const spawn = getSafeSpawn(room, data.team);
            data.x = spawn.x;
            data.y = spawn.y;
            data.vx = 0;
            data.vy = 0;

            broadcastToRoom(room, {
              type: 'player_respawned',
              playerId: data.id,
              x: data.x,
              y: data.y,
              health: data.health,
              armor: data.armor,
              jetpackFuel: data.jetpackFuel,
            });
          }
        }
      });
    }

    // Broadcast Tick
    broadcastToRoom(room, {
      type: 'match_tick',
      timeRemaining: room.matchTimeRemaining,
      teamScores: { ...room.teamScores },
      objectiveControl: room.objectiveControl,
    });

    checkWinCondition(room);
  }, 1000);
}

function setupMultiplayerWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let playerId: string | null = null;

    ws.on('message', (raw: string) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'create_room': {
            const code = generateRoomCode();
            playerId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            currentRoomCode = code;

            const targetMode: GameMode = msg.mode || 'ffa';
            const targetMap: MapId = msg.mapId || 'lusaka';

            const room: ServerRoom = {
              code,
              name: (msg.name || `Room ${code}`).slice(0, 32),
              hostId: playerId,
              mode: targetMode,
              mapId: targetMap,
              players: new Map(),
              teamScores: { green: 0, copper: 0 },
              status: 'lobby',
              matchTimeRemaining: 300,
              matchDurationSeconds: 300,
              objectiveControl: {
                greenProgress: 0,
                copperProgress: 0,
                controllingTeam: 'neutral',
              },
            };

            const spawn = getSafeSpawn(room, targetMode === 'tdm' || targetMode === 'capture_boma' ? 'green' : 'none');

            const player: ServerPlayer = {
              id: playerId,
              name: (msg.playerName || 'Zambian Warrior').slice(0, 20),
              characterId: msg.characterId || 'chibesa',
              team: targetMode === 'tdm' || targetMode === 'capture_boma' ? 'green' : 'none',
              x: spawn.x,
              y: spawn.y,
              vx: 0,
              vy: 0,
              facing: 'right',
              aimAngle: 0,
              health: 100,
              maxHealth: 100,
              armor: 100,
              maxArmor: 100,
              jetpackFuel: 100,
              isJetpacking: false,
              isFiring: false,
              isCrouching: false,
              currentWeaponId: 'ak_zambia',
              kills: 0,
              deaths: 0,
              score: 0,
              damageDealt: 0,
              isDead: false,
              respawnTimer: 0,
              lastFireTime: 0,
            };

            room.players.set(playerId, { ws, data: player });
            rooms.set(code, room);

            ws.send(
              JSON.stringify({
                type: 'room_created',
                code,
                playerId,
                roomInfo: {
                  code,
                  name: room.name,
                  mode: room.mode,
                  mapId: room.mapId,
                  status: room.status,
                  hostId: room.hostId,
                  maxPlayers: 8,
                  currentPlayers: 1,
                },
                players: [player],
              })
            );
            break;
          }

          case 'join_room': {
            const targetCode = (msg.code || '').toUpperCase().trim();
            const room = rooms.get(targetCode);

            if (!room) {
              ws.send(JSON.stringify({ type: 'error', message: 'Room not found! Check the room code.' }));
              return;
            }

            if (room.players.size >= 8) {
              ws.send(JSON.stringify({ type: 'error', message: 'Room is full (max 8 warriors)!' }));
              return;
            }

            playerId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            currentRoomCode = targetCode;

            // Assign balanced team
            let assignedTeam: 'green' | 'copper' | 'none' = 'none';
            if (room.mode === 'tdm' || room.mode === 'capture_boma') {
              let greenCount = 0;
              let copperCount = 0;
              room.players.forEach(({ data }) => {
                if (data.team === 'green') greenCount++;
                if (data.team === 'copper') copperCount++;
              });
              assignedTeam = greenCount <= copperCount ? 'green' : 'copper';
            }

            const spawn = getSafeSpawn(room, assignedTeam);

            const player: ServerPlayer = {
              id: playerId,
              name: (msg.playerName || `Warrior ${room.players.size + 1}`).slice(0, 20),
              characterId: msg.characterId || 'chibesa',
              team: assignedTeam,
              x: spawn.x,
              y: spawn.y,
              vx: 0,
              vy: 0,
              facing: assignedTeam === 'copper' ? 'left' : 'right',
              aimAngle: 0,
              health: 100,
              maxHealth: 100,
              armor: 100,
              maxArmor: 100,
              jetpackFuel: 100,
              isJetpacking: false,
              isFiring: false,
              isCrouching: false,
              currentWeaponId: 'ak_zambia',
              kills: 0,
              deaths: 0,
              score: 0,
              damageDealt: 0,
              isDead: false,
              respawnTimer: 0,
              lastFireTime: 0,
            };

            room.players.set(playerId, { ws, data: player });

            const allPlayers = Array.from(room.players.values()).map((p) => p.data);

            ws.send(
              JSON.stringify({
                type: 'room_joined',
                code: targetCode,
                playerId,
                roomInfo: {
                  code: room.code,
                  name: room.name,
                  mode: room.mode,
                  mapId: room.mapId,
                  status: room.status,
                  hostId: room.hostId,
                  maxPlayers: 8,
                  currentPlayers: room.players.size,
                },
                players: allPlayers,
              })
            );

            // Notify others
            broadcastToRoom(room, { type: 'player_joined', player }, ws);
            break;
          }

          case 'start_match': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room || room.hostId !== playerId) return;

            startRoomGameLoop(room);
            broadcastToRoom(room, { type: 'match_started' });
            break;
          }

          case 'player_sync': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const existing = room.players.get(playerId);
            if (existing && msg.player && !existing.data.isDead) {
              // Sanity validation & clamping
              existing.data.x = Math.max(0, Math.min(3000, msg.player.x ?? existing.data.x));
              existing.data.y = Math.max(0, Math.min(2000, msg.player.y ?? existing.data.y));
              existing.data.vx = Math.max(-1000, Math.min(1000, msg.player.vx ?? 0));
              existing.data.vy = Math.max(-1000, Math.min(1000, msg.player.vy ?? 0));
              existing.data.facing = msg.player.facing === 'left' ? 'left' : 'right';
              existing.data.aimAngle = typeof msg.player.aimAngle === 'number' ? msg.player.aimAngle : 0;
              existing.data.isJetpacking = !!msg.player.isJetpacking;
              existing.data.isFiring = !!msg.player.isFiring;
              existing.data.isCrouching = !!msg.player.isCrouching;
              if (msg.player.currentWeaponId) {
                existing.data.currentWeaponId = msg.player.currentWeaponId;
              }
              if (typeof msg.player.jetpackFuel === 'number') {
                existing.data.jetpackFuel = Math.max(0, Math.min(100, msg.player.jetpackFuel));
              }

              broadcastToRoom(room, { type: 'player_update', player: existing.data }, ws);
            }
            break;
          }

          case 'fire_weapon': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const shooter = room.players.get(playerId);
            if (!shooter || shooter.data.isDead) return;

            const weaponId: WeaponId = msg.weaponId || 'ak_zambia';
            const weaponStat = SERVER_WEAPONS[weaponId] || SERVER_WEAPONS.ak_zambia;
            const now = Date.now();

            // Fire rate validation (tolerance 20ms)
            if (now - shooter.data.lastFireTime < weaponStat.fireRateMs - 20) {
              return;
            }
            shooter.data.lastFireTime = now;

            broadcastToRoom(
              room,
              {
                type: 'player_fired',
                playerId,
                weaponId,
                x: msg.x,
                y: msg.y,
                angle: msg.angle,
              },
              ws
            );
            break;
          }

          case 'throw_grenade': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const thrower = room.players.get(playerId);
            if (!thrower || thrower.data.isDead) return;

            broadcastToRoom(
              room,
              {
                type: 'player_threw_grenade',
                playerId,
                x: msg.x,
                y: msg.y,
                vx: msg.vx,
                vy: msg.vy,
              },
              ws
            );
            break;
          }

          case 'report_hit': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room || room.status !== 'playing') return;

            const attacker = room.players.get(playerId);
            const target = room.players.get(msg.targetId);

            if (!attacker || !target || attacker.data.isDead || target.data.isDead) return;

            // Check friendly fire in team modes
            if (
              (room.mode === 'tdm' || room.mode === 'capture_boma') &&
              attacker.data.team === target.data.team &&
              attacker.data.team !== 'none'
            ) {
              return;
            }

            const weaponId: WeaponId = msg.weaponId || 'ak_zambia';
            const weaponStat = SERVER_WEAPONS[weaponId] || SERVER_WEAPONS.ak_zambia;
            const isHeadshot = !!msg.isHeadshot;

            const rawDamage = isHeadshot ? weaponStat.damage * 1.5 : weaponStat.damage;
            let finalDamage = Math.round(rawDamage);
            let absorbed = 0;

            if (target.data.armor > 0) {
              absorbed = Math.min(target.data.armor, Math.round(finalDamage * 0.6));
              target.data.armor = Math.max(0, target.data.armor - absorbed);
              finalDamage -= absorbed;
            }

            target.data.health = Math.max(0, target.data.health - finalDamage);
            attacker.data.damageDealt += finalDamage + absorbed;

            if (target.data.health <= 0) {
              // Target is eliminated!
              target.data.isDead = true;
              target.data.deaths++;
              attacker.data.kills++;
              attacker.data.score += isHeadshot ? 150 : 100;

              if (room.mode === 'tdm' || room.mode === 'capture_boma') {
                if (attacker.data.team === 'green') room.teamScores.green += 1;
                if (attacker.data.team === 'copper') room.teamScores.copper += 1;
              }

              target.data.respawnTimer = 3;

              broadcastToRoom(room, {
                type: 'player_killed',
                killerId: attacker.data.id,
                killerName: attacker.data.name,
                killerTeam: attacker.data.team,
                victimId: target.data.id,
                victimName: target.data.name,
                victimTeam: target.data.team,
                weaponId,
                isHeadshot,
                teamScores: { ...room.teamScores },
                killerKills: attacker.data.kills,
                victimDeaths: target.data.deaths,
              });

              checkWinCondition(room);
            } else {
              // Target took damage
              broadcastToRoom(room, {
                type: 'player_damaged',
                victimId: target.data.id,
                attackerId: attacker.data.id,
                damage: finalDamage,
                absorbedByArmor: absorbed,
                health: target.data.health,
                armor: target.data.armor,
                isHeadshot,
                weaponId,
              });
            }
            break;
          }

          case 'detonate_explosive': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room || room.status !== 'playing') return;

            const attacker = room.players.get(playerId);
            if (!attacker) return;

            const expX = msg.x;
            const expY = msg.y;
            const radius = Math.min(160, Math.max(30, msg.radius || 120));
            const maxDmg = Math.min(130, Math.max(20, msg.damage || 100));
            const weaponId: WeaponId = msg.weaponId || 'shosholoza_rocket';

            room.players.forEach(({ data: target }) => {
              if (target.isDead) return;
              if (
                (room.mode === 'tdm' || room.mode === 'capture_boma') &&
                attacker.data.team === target.team &&
                attacker.data.team !== 'none'
              ) {
                return;
              }

              const dist = Math.hypot(target.x - expX, target.y - expY);
              if (dist <= radius) {
                const falloff = 1 - dist / radius;
                const dmg = Math.round(maxDmg * falloff);
                let damage = dmg;
                let absorbed = 0;

                if (target.armor > 0) {
                  absorbed = Math.min(target.armor, Math.round(damage * 0.6));
                  target.armor = Math.max(0, target.armor - absorbed);
                  damage -= absorbed;
                }

                target.health = Math.max(0, target.health - damage);
                attacker.data.damageDealt += damage + absorbed;

                if (target.health <= 0) {
                  target.isDead = true;
                  target.deaths++;
                  attacker.data.kills++;
                  attacker.data.score += 100;

                  if (room.mode === 'tdm' || room.mode === 'capture_boma') {
                    if (attacker.data.team === 'green') room.teamScores.green += 1;
                    if (attacker.data.team === 'copper') room.teamScores.copper += 1;
                  }

                  target.respawnTimer = 3;

                  broadcastToRoom(room, {
                    type: 'player_killed',
                    killerId: attacker.data.id,
                    killerName: attacker.data.name,
                    killerTeam: attacker.data.team,
                    victimId: target.id,
                    victimName: target.name,
                    victimTeam: target.team,
                    weaponId,
                    isHeadshot: false,
                    teamScores: { ...room.teamScores },
                    killerKills: attacker.data.kills,
                    victimDeaths: target.deaths,
                  });
                } else {
                  broadcastToRoom(room, {
                    type: 'player_damaged',
                    victimId: target.id,
                    attackerId: attacker.data.id,
                    damage,
                    absorbedByArmor: absorbed,
                    health: target.health,
                    armor: target.armor,
                    isHeadshot: false,
                    weaponId,
                  });
                }
              }
            });

            checkWinCondition(room);
            break;
          }

          case 'chat_message': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const sender = room.players.get(playerId);
            const sanitizedText = (msg.message || '').slice(0, 140).trim();
            if (sanitizedText) {
              broadcastToRoom(room, {
                type: 'chat',
                senderName: sender?.data.name || 'Warrior',
                message: sanitizedText,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && playerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(playerId);

          if (room.players.size === 0) {
            if (room.tickTimer) clearInterval(room.tickTimer);
            rooms.delete(currentRoomCode);
          } else {
            broadcastToRoom(room, { type: 'player_left', playerId });

            // Host migration
            if (room.hostId === playerId) {
              const nextHost = room.players.keys().next().value;
              if (nextHost) {
                room.hostId = nextHost;
                broadcastToRoom(room, { type: 'new_host', hostId: nextHost });
              }
            }

            // Check if game ended due to remaining players
            if (room.status === 'playing') {
              checkWinCondition(room);
            }
          }
        }
      }
    });
  });
}

async function createServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      game: 'BOMA BATTLE: Rise of the Zambian Warriors',
      activeRooms: rooms.size,
    });
  });

  app.get('/api/rooms', (req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      code: r.code,
      name: r.name,
      mode: r.mode,
      mapId: r.mapId,
      playersCount: r.players.size,
      status: r.status,
    }));
    res.json(list);
  });

  setupMultiplayerWebSocket(wss);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Boma Battle server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
