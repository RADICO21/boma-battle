import {
  CaptureZone,
  FloatingText,
  GameMode,
  KillFeedItem,
  MapDef,
  NetworkMatchResult,
  Particle,
  PickupItem,
  PlayerState,
  Projectile,
  ShellCasing,
  WeaponId,
} from '../types/game';
import { BotController } from './ai';
import { sound } from './audio';
import { CHARACTER_REGISTRY } from './characters';
import { MAP_REGISTRY } from './maps';
import { MultiplayerClient } from './multiplayerClient';
import { WEAPON_REGISTRY } from './weapons';

export interface GameEngineCallbacks {
  onScoreUpdate?: (players: PlayerState[], teamScores: { green: number; copper: number }) => void;
  onKillFeed?: (item: KillFeedItem) => void;
  onGameOver?: (winnerName: string, teamScores?: { green: number; copper: number }, networkResult?: NetworkMatchResult) => void;
}

export class BomaBattleEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public map: MapDef;
  public mode: GameMode;

  public players: PlayerState[] = [];
  public localPlayerId: string = 'player-local';
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public shellCasings: ShellCasing[] = [];
  public floatingTexts: FloatingText[] = [];
  public pickups: PickupItem[] = [];
  public killFeed: KillFeedItem[] = [];

  public botControllers: Map<string, BotController> = new Map();
  public callbacks: GameEngineCallbacks = {};

  public teamScores = { green: 0, copper: 0 };
  public matchTimeRemaining = 300; // 5 minute standard rounds
  public isMatchActive = true;
  public winnerName: string | null = null;

  // Camera tracking
  public camera = { x: 0, y: 0, targetX: 0, targetY: 0, zoom: 1.0, shake: 0 };

  // Inputs
  public inputKeys: Record<string, boolean> = {};
  public mousePos = { x: 0, y: 0 };
  public isMouseDown = false;
  public touchControls = {
    active: false,
    leftStick: { active: false, startX: 0, startY: 0, currX: 0, currY: 0, dx: 0, dy: 0 },
    rightStick: { active: false, startX: 0, startY: 0, currX: 0, currY: 0, dx: 0, dy: 0, firing: false },
  };

  public isMultiplayer = false;
  public multiClient: MultiplayerClient | null = null;
  private lastNetworkSyncTime = 0;

  private animationFrameId: number | null = null;
  private lastTime = 0;
  private projectileCounter = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mode: GameMode = 'practice',
    mapId = 'lusaka',
    localPlayerConfig: { name: string; characterId: string; skinId: string }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mode = mode;
    this.map = MAP_REGISTRY[mapId as keyof typeof MAP_REGISTRY] || MAP_REGISTRY.lusaka;

    this.initPlayers(localPlayerConfig);
    this.initPickups();
    this.setupEventListeners();
  }

  public setMultiplayerClient(client: MultiplayerClient, initialPlayers?: PlayerState[]) {
    this.isMultiplayer = true;
    this.multiClient = client;
    if (client.playerId) {
      this.localPlayerId = client.playerId;
    }

    // Dismiss bots in multiplayer mode
    this.botControllers.clear();

    if (initialPlayers && initialPlayers.length > 0) {
      this.players = initialPlayers.map((p) => ({
        ...p,
        isBot: false,
        weapons: p.weapons || [
          { id: p.currentWeaponId || 'ak_zambia', ammoInClip: 30, reserveAmmo: 120 },
          { id: 'ngoni_club', ammoInClip: 999, reserveAmmo: 999 },
        ],
        currentWeaponIndex: 0,
        grenadeCount: 3,
        grenadeCooldown: 0,
        reloadProgress: 0,
        isReloading: false,
      }));
    }

    // Hook server-authoritative listeners
    client.callbacks.onPlayerUpdate = (remote) => {
      if (remote.id === this.localPlayerId) return;
      let existing = this.players.find((p) => p.id === remote.id);
      if (!existing) {
        existing = {
          ...remote,
          isBot: false,
          weapons: [
            { id: remote.currentWeaponId || 'ak_zambia', ammoInClip: 30, reserveAmmo: 120 },
            { id: 'ngoni_club', ammoInClip: 999, reserveAmmo: 999 },
          ],
          currentWeaponIndex: 0,
          grenadeCount: 3,
          grenadeCooldown: 0,
          reloadProgress: 0,
          isReloading: false,
        };
        this.players.push(existing);
      } else {
        // Smoothly interpolate position towards authoritative network coordinates
        existing.x += (remote.x - existing.x) * 0.6;
        existing.y += (remote.y - existing.y) * 0.6;
        existing.vx = remote.vx;
        existing.vy = remote.vy;
        existing.facing = remote.facing;
        existing.aimAngle = remote.aimAngle;
        existing.isJetpacking = remote.isJetpacking;
        existing.isFiring = remote.isFiring;
        existing.isCrouching = remote.isCrouching;
        existing.currentWeaponId = remote.currentWeaponId;
        existing.jetpackFuel = remote.jetpackFuel;
        existing.health = remote.health;
        existing.armor = remote.armor;
      }
    };

    client.callbacks.onPlayerFired = (data) => {
      if (data.playerId === this.localPlayerId) return;
      const shooter = this.players.find((p) => p.id === data.playerId);
      if (shooter) {
        shooter.aimAngle = data.angle;
        this.attemptFireWeapon(shooter, true);
      }
    };

    client.callbacks.onPlayerThrewGrenade = (data) => {
      if (data.playerId === this.localPlayerId) return;
      sound.playWeaponFire('shosholoza_grenade');
      this.projectiles.push({
        id: `proj-${++this.projectileCounter}`,
        ownerId: data.playerId,
        weaponId: 'shosholoza_grenade',
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        damage: 110,
        radius: 6,
        color: '#22C55E',
        type: 'grenade',
        lifetime: 0,
        maxLifetime: 2.2,
        bounceCount: 4,
        isExplosive: true,
        explosionRadius: 130,
      });
    };

    client.callbacks.onPlayerDamaged = (data) => {
      const target = this.players.find((p) => p.id === data.victimId);
      if (target) {
        target.health = data.health;
        target.armor = data.armor;
        if (data.absorbedByArmor > 0) {
          sound.playShieldHit();
          target.shieldHitFlash = 0.35;
        } else {
          sound.playHitMarker();
        }
        this.floatingTexts.push({
          id: `float-${Math.random()}`,
          x: target.x + (Math.random() - 0.5) * 20,
          y: target.y - target.height / 2 - 10,
          text: data.isHeadshot ? `HEADSHOT -${data.damage + data.absorbedByArmor}` : `-${data.damage + data.absorbedByArmor}`,
          color: data.isHeadshot ? '#EF4444' : data.absorbedByArmor > 0 ? '#38BDF8' : '#F59E0B',
          alpha: 1.0,
          vy: -60,
          lifetime: 0.9,
        });
      }
    };

    client.callbacks.onPlayerKilled = (data) => {
      const victim = this.players.find((p) => p.id === data.victimId);
      if (victim) {
        victim.isDead = true;
        victim.health = 0;
        victim.deaths = data.victimDeaths;
        this.triggerExplosion(victim.x, victim.y, 40, 0, data.killerId, data.weaponId);
      }
      const killer = this.players.find((p) => p.id === data.killerId);
      if (killer) {
        killer.kills = data.killerKills;
      }
      this.teamScores = { ...data.teamScores };

      const feedItem: KillFeedItem = {
        id: `kill-${Date.now()}-${Math.random()}`,
        killerName: data.killerName,
        killerTeam: data.killerTeam,
        victimName: data.victimName,
        victimTeam: data.victimTeam,
        weaponName: WEAPON_REGISTRY[data.weaponId]?.name || 'Weapon',
        isHeadshot: data.isHeadshot,
        timestamp: Date.now(),
      };
      this.killFeed.unshift(feedItem);
      if (this.callbacks.onKillFeed) {
        this.callbacks.onKillFeed(feedItem);
      }
      if (data.killerId === this.localPlayerId) {
        sound.playAnnouncer(data.isHeadshot ? 'Boom! Headshot!' : 'Target eliminated!');
      }
    };

    client.callbacks.onPlayerRespawned = (data) => {
      const player = this.players.find((p) => p.id === data.playerId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.vx = 0;
        player.vy = 0;
        player.health = data.health;
        player.armor = data.armor;
        player.jetpackFuel = data.jetpackFuel;
        player.isDead = false;
        // Visual respawn beacon
        for (let i = 0; i < 16; i++) {
          this.particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 120,
            vy: -Math.random() * 150,
            radius: 3,
            color: '#10B981',
            alpha: 1.0,
            decay: 1.8,
          });
        }
      }
    };

    client.callbacks.onMatchTick = (data) => {
      this.matchTimeRemaining = data.timeRemaining;
      this.teamScores = { ...data.teamScores };
    };

    client.callbacks.onMatchResults = (results) => {
      this.isMatchActive = false;
      this.winnerName = results.winner;
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver(results.winner, results.teamScores, results);
      }
    };

    client.callbacks.onPlayerLeft = (leftId) => {
      this.players = this.players.filter((p) => p.id !== leftId);
    };
  }

  private initPlayers(localConfig: { name: string; characterId: string; skinId: string }) {
    const char = CHARACTER_REGISTRY[localConfig.characterId as keyof typeof CHARACTER_REGISTRY] || CHARACTER_REGISTRY.chibesa;
    const spawn = this.map.spawns[0] || { x: 400, y: 600 };

    const localPlayer: PlayerState = {
      id: this.localPlayerId,
      name: localConfig.name || 'Zambian Warrior',
      isBot: false,
      characterId: char.id,
      skinId: localConfig.skinId || 'classic',
      team: this.mode === 'tdm' || this.mode === 'capture_boma' ? 'green' : 'none',
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      width: 38,
      height: 52,
      facing: 'right',
      aimAngle: 0,
      health: char.maxHealth,
      maxHealth: char.maxHealth,
      armor: char.maxArmor,
      maxArmor: char.maxArmor,
      jetpackFuel: char.jetpackMaxFuel,
      maxJetpackFuel: char.jetpackMaxFuel,
      isGrounded: false,
      isJetpacking: false,
      isCrouching: false,
      isFiring: false,
      isReloading: false,
      reloadProgress: 0,
      currentWeaponId: 'ak_zambia',
      currentWeaponIndex: 0,
      weapons: [
        { id: 'ak_zambia', ammoInClip: 30, reserveAmmo: 120 },
        { id: 'nyati_smg', ammoInClip: 42, reserveAmmo: 126 },
        { id: 'ngoni_club', ammoInClip: 999, reserveAmmo: 999 },
      ],
      grenadeCount: char.id === 'mweemba' ? 4 : 3,
      grenadeCooldown: 0,
      lastFireTime: 0,
      isDead: false,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      score: 0,
      damageDealt: 0,
    };

    this.players = [localPlayer];

    // Spawn AI bots for Practice, FFA, TDM, Survival, or Boma Capture
    const botCount = this.mode === 'training' ? 2 : 4;
    const botNames = ['Kapaso AI', 'Ba Kunda AI', 'Chola AI', 'Mweemba AI', 'Sipho', 'Lulu'];
    const botDifficulties: ('recruit' | 'warrior' | 'elite')[] = ['recruit', 'warrior', 'elite'];
    const charIds: (keyof typeof CHARACTER_REGISTRY)[] = ['kapaso', 'bakunda', 'mweemba', 'chola', 'chibesa'];

    for (let i = 0; i < botCount; i++) {
      const bCharId = charIds[i % charIds.length];
      const bChar = CHARACTER_REGISTRY[bCharId];
      const bSpawn = this.map.spawns[(i + 1) % this.map.spawns.length] || { x: 800 + i * 200, y: 700 };
      const bTeam = this.mode === 'tdm' || this.mode === 'capture_boma' ? (i % 2 === 0 ? 'copper' : 'green') : 'none';

      const botPlayer: PlayerState = {
        id: `bot-${i + 1}`,
        name: botNames[i % botNames.length],
        isBot: true,
        botDifficulty: botDifficulties[i % botDifficulties.length],
        characterId: bChar.id,
        skinId: 'classic',
        team: bTeam,
        x: bSpawn.x,
        y: bSpawn.y,
        vx: 0,
        vy: 0,
        width: 38,
        height: 52,
        facing: 'left',
        aimAngle: Math.PI,
        health: bChar.maxHealth,
        maxHealth: bChar.maxHealth,
        armor: bChar.maxArmor,
        maxArmor: bChar.maxArmor,
        jetpackFuel: bChar.jetpackMaxFuel,
        maxJetpackFuel: bChar.jetpackMaxFuel,
        isGrounded: false,
        isJetpacking: false,
        isCrouching: false,
        isFiring: false,
        isReloading: false,
        reloadProgress: 0,
        currentWeaponId: i === 0 ? 'nyati_smg' : i === 1 ? 'rhino_lmg' : 'ak_zambia',
        currentWeaponIndex: 0,
        weapons: [
          { id: 'ak_zambia', ammoInClip: 30, reserveAmmo: 90 },
          { id: 'ngoni_club', ammoInClip: 999, reserveAmmo: 999 },
        ],
        grenadeCount: 2,
        grenadeCooldown: 0,
        lastFireTime: 0,
        isDead: false,
        respawnTimer: 0,
        kills: 0,
        deaths: 0,
        score: 0,
        damageDealt: 0,
      };

      this.players.push(botPlayer);
      this.botControllers.set(botPlayer.id, new BotController(botPlayer));
    }
  }

  private initPickups() {
    this.pickups = this.map.pickupLocations.map((loc, idx) => ({
      id: `pickup-${idx}`,
      type: loc.type,
      weaponId: loc.weaponId,
      x: loc.x,
      y: loc.y,
      active: true,
      respawnTimeRemaining: 0,
    }));
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch listeners
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    sound.stopJetpack();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.inputKeys[e.key.toLowerCase()] = true;
    this.inputKeys[e.code] = true;

    const local = this.getLocalPlayer();
    if (!local || local.isDead) return;

    if (e.key === 'r' || e.key === 'R') {
      this.triggerReload(local);
    } else if (e.key === 'q' || e.key === 'Q') {
      this.cycleWeapon(local);
    } else if (e.key === 'g' || e.key === 'G') {
      this.throwGrenade(local);
    } else if (['1', '2', '3'].includes(e.key)) {
      const idx = parseInt(e.key) - 1;
      if (local.weapons[idx]) {
        local.currentWeaponIndex = idx;
        local.currentWeaponId = local.weapons[idx].id;
        local.isReloading = false;
        sound.playPickup('weapon');
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.inputKeys[e.key.toLowerCase()] = false;
    this.inputKeys[e.code] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
    } else if (e.button === 2) {
      // Right click: alternate jetpack
      this.inputKeys['mouse2'] = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    } else if (e.button === 2) {
      this.inputKeys['mouse2'] = false;
    }
  };

  // Touch Handling for Dual On-Screen Joysticks
  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    this.touchControls.active = true;
    const rect = this.canvas.getBoundingClientRect();
    const halfWidth = rect.width / 2;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x < halfWidth) {
        // Left virtual stick (Movement & Jetpack)
        this.touchControls.leftStick.active = true;
        this.touchControls.leftStick.startX = x;
        this.touchControls.leftStick.startY = y;
        this.touchControls.leftStick.currX = x;
        this.touchControls.leftStick.currY = y;
      } else {
        // Right virtual stick (Aim & Fire)
        this.touchControls.rightStick.active = true;
        this.touchControls.rightStick.startX = x;
        this.touchControls.rightStick.startY = y;
        this.touchControls.rightStick.currX = x;
        this.touchControls.rightStick.currY = y;
        this.touchControls.rightStick.firing = true;
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (this.touchControls.leftStick.active && x < rect.width * 0.6) {
        this.touchControls.leftStick.currX = x;
        this.touchControls.leftStick.currY = y;
        const dx = x - this.touchControls.leftStick.startX;
        const dy = y - this.touchControls.leftStick.startY;
        this.touchControls.leftStick.dx = Math.max(-50, Math.min(50, dx));
        this.touchControls.leftStick.dy = Math.max(-50, Math.min(50, dy));
      } else if (this.touchControls.rightStick.active) {
        this.touchControls.rightStick.currX = x;
        this.touchControls.rightStick.currY = y;
        const dx = x - this.touchControls.rightStick.startX;
        const dy = y - this.touchControls.rightStick.startY;
        this.touchControls.rightStick.dx = dx;
        this.touchControls.rightStick.dy = dy;
        this.touchControls.rightStick.firing = Math.hypot(dx, dy) > 15;
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const halfWidth = rect.width / 2;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;

      if (x < halfWidth) {
        this.touchControls.leftStick.active = false;
        this.touchControls.leftStick.dx = 0;
        this.touchControls.leftStick.dy = 0;
      } else {
        this.touchControls.rightStick.active = false;
        this.touchControls.rightStick.firing = false;
        this.touchControls.rightStick.dx = 0;
        this.touchControls.rightStick.dy = 0;
      }
    }
  };

  public getLocalPlayer(): PlayerState | undefined {
    return this.players.find((p) => p.id === this.localPlayerId);
  }

  public start() {
    this.lastTime = performance.now();
    sound.startMusic();
    sound.playAnnouncer("Eya, let's go!");
    this.gameLoop(this.lastTime);
  }

  private gameLoop = (currentTime: number) => {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Clamp dt to prevent tunneling
    this.lastTime = currentTime;

    if (this.isMatchActive) {
      this.update(dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public update(dt: number) {
    // Match timer: in multiplayer, timer and score limits are authoritative on the server
    if (!this.isMultiplayer) {
      this.matchTimeRemaining -= dt;
      if (this.matchTimeRemaining <= 0) {
        this.matchTimeRemaining = 0;
        this.checkEndConditions(true);
      }
    }

    // Process Local Player Inputs
    const local = this.getLocalPlayer();
    if (local && !local.isDead) {
      this.processLocalInput(local, dt);

      // 25Hz network sync for genuine multiplayer
      if (this.isMultiplayer && this.multiClient) {
        const now = performance.now();
        if (now - this.lastNetworkSyncTime > 40) {
          this.lastNetworkSyncTime = now;
          this.multiClient.syncPlayer({
            x: Math.round(local.x),
            y: Math.round(local.y),
            vx: Math.round(local.vx),
            vy: Math.round(local.vy),
            facing: local.facing,
            aimAngle: Number(local.aimAngle.toFixed(3)),
            isJetpacking: local.isJetpacking,
            isFiring: local.isFiring,
            isCrouching: local.isCrouching,
            currentWeaponId: local.currentWeaponId,
            jetpackFuel: Math.round(local.jetpackFuel),
          });
        }
      }
    }

    // Process Bot AIs
    for (const player of this.players) {
      if (player.isBot) {
        const controller = this.botControllers.get(player.id);
        if (controller) {
          const botControls = controller.update(dt, this.players, this.map, this.pickups);
          this.applyBotInput(player, botControls, dt);
        }
      }
    }

    // Update Physics & Movement for all players
    for (const player of this.players) {
      this.updatePlayerPhysics(player, dt);
    }

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Particles & Floating Text
    this.updateParticles(dt);

    // Update Ejected Shell Casings
    this.updateShellCasings(dt);

    // Update Shield Hit Flash & Low Fuel Alerts
    for (const p of this.players) {
      if (p.shieldHitFlash && p.shieldHitFlash > 0) {
        p.shieldHitFlash = Math.max(0, p.shieldHitFlash - dt);
      }
      if (p.id === this.localPlayerId && p.isJetpacking && p.jetpackFuel < 15 && Math.random() < 0.04) {
        sound.playLowFuelWarning();
      }
    }

    // Update Pickups
    this.updatePickups(dt);

    // Update Capture the Boma objective zone
    if (this.map.captureZone && this.mode === 'capture_boma') {
      this.updateCaptureZone(dt, this.map.captureZone);
    }

    // Camera smoothing and screen shake
    this.updateCamera(dt);
  }

  private processLocalInput(player: PlayerState, dt: number) {
    const char = CHARACTER_REGISTRY[player.characterId];
    let moveX = 0;

    // Keyboard controls
    if (this.inputKeys['a'] || this.inputKeys['arrowleft']) moveX -= 1;
    if (this.inputKeys['d'] || this.inputKeys['arrowright']) moveX += 1;

    // Touch controls override
    if (this.touchControls.leftStick.active) {
      if (this.touchControls.leftStick.dx > 15) moveX = 1;
      else if (this.touchControls.leftStick.dx < -15) moveX = -1;
    }

    // Horizontal speed
    const currentSpeed = player.isCrouching ? char.baseSpeed * 0.5 : char.baseSpeed;
    player.vx = moveX * currentSpeed;

    if (moveX !== 0) {
      player.facing = moveX > 0 ? 'right' : 'left';
    }

    // Jump & Jetpack
    const wantsJetpack =
      this.inputKeys['w'] ||
      this.inputKeys['arrowup'] ||
      this.inputKeys[' '] ||
      this.inputKeys['space'] ||
      this.inputKeys['Space'] ||
      this.inputKeys['mouse2'] ||
      (this.touchControls.leftStick.active && this.touchControls.leftStick.dy < -20);

    const wantsJump =
      (this.inputKeys['w'] ||
        this.inputKeys['arrowup'] ||
        this.inputKeys[' '] ||
        this.inputKeys['space'] ||
        this.inputKeys['Space']) &&
      player.isGrounded;

    if (wantsJump) {
      player.vy = -450;
      player.isGrounded = false;
    }

    if (wantsJetpack && player.jetpackFuel > 0) {
      player.isJetpacking = true;
      player.vy = Math.max(player.vy - 1600 * dt, -580);
      player.jetpackFuel = Math.max(0, player.jetpackFuel - char.fuelDrainRate * dt);
      sound.startJetpack();

      // Emit Jetpack Fire Particles
      if (Math.random() < 0.8) {
        this.createJetpackParticle(player);
      }
    } else {
      player.isJetpacking = false;
      sound.stopJetpack();

      // Recharge jetpack when grounded
      if (player.isGrounded && player.jetpackFuel < player.maxJetpackFuel) {
        player.jetpackFuel = Math.min(player.maxJetpackFuel, player.jetpackFuel + char.fuelRechargeRate * dt);
      }
    }

    // Crouch
    player.isCrouching =
      this.inputKeys['s'] ||
      this.inputKeys['arrowdown'] ||
      this.inputKeys['c'] ||
      (this.touchControls.leftStick.active && this.touchControls.leftStick.dy > 25);

    // Aim Angle
    if (this.touchControls.rightStick.active && Math.hypot(this.touchControls.rightStick.dx, this.touchControls.rightStick.dy) > 10) {
      player.aimAngle = Math.atan2(this.touchControls.rightStick.dy, this.touchControls.rightStick.dx);
    } else {
      // Calculate aim angle based on screen camera pos
      const screenX = (player.x - this.camera.x) * this.camera.zoom + this.canvas.width / 2;
      const screenY = (player.y - this.camera.y) * this.camera.zoom + this.canvas.height / 2;
      player.aimAngle = Math.atan2(this.mousePos.y - screenY, this.mousePos.x - screenX);
    }

    // Facing direction follows aim angle
    player.facing = Math.cos(player.aimAngle) >= 0 ? 'right' : 'left';

    // Firing
    const wantsFire = this.isMouseDown || this.touchControls.rightStick.firing;
    player.isFiring = wantsFire;

    if (wantsFire) {
      this.attemptFireWeapon(player);
    }
  }

  private applyBotInput(
    bot: PlayerState,
    controls: {
      moveLeft: boolean;
      moveRight: boolean;
      jump: boolean;
      jetpack: boolean;
      crouch: boolean;
      aimAngle: number;
      fire: boolean;
      reload: boolean;
    },
    dt: number
  ) {
    const char = CHARACTER_REGISTRY[bot.characterId];
    let moveX = 0;
    if (controls.moveLeft) moveX -= 1;
    if (controls.moveRight) moveX += 1;

    bot.vx = moveX * char.baseSpeed;
    if (moveX !== 0) bot.facing = moveX > 0 ? 'right' : 'left';

    if (controls.jump && bot.isGrounded) {
      bot.vy = -440;
      bot.isGrounded = false;
    }

    if (controls.jetpack && bot.jetpackFuel > 0) {
      bot.isJetpacking = true;
      bot.vy = Math.max(bot.vy - 1500 * dt, -550);
      bot.jetpackFuel = Math.max(0, bot.jetpackFuel - char.fuelDrainRate * dt);
      if (Math.random() < 0.5) this.createJetpackParticle(bot);
    } else {
      bot.isJetpacking = false;
      if (bot.isGrounded && bot.jetpackFuel < bot.maxJetpackFuel) {
        bot.jetpackFuel = Math.min(bot.maxJetpackFuel, bot.jetpackFuel + char.fuelRechargeRate * dt);
      }
    }

    bot.aimAngle = controls.aimAngle;
    bot.isFiring = controls.fire;

    if (controls.reload && !bot.isReloading) {
      this.triggerReload(bot);
    }

    if (controls.fire) {
      this.attemptFireWeapon(bot);
    }
  }

  private updatePlayerPhysics(player: PlayerState, dt: number) {
    if (player.isDead) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        this.respawnPlayer(player);
      }
      return;
    }

    // Apply Gravity
    player.vy += this.map.gravity * dt;

    // Apply Movement
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Platform Collisions
    player.isGrounded = false;
    const playerFeetY = player.y + player.height / 2;
    const playerHeadY = player.y - player.height / 2;
    const playerLeftX = player.x - player.width / 2;
    const playerRightX = player.x + player.width / 2;

    for (const plat of this.map.platforms) {
      // Check hazard (e.g. molten copper or deep waterfall cataract)
      if (plat.type === 'hazard') {
        if (
          playerRightX > plat.x &&
          playerLeftX < plat.x + plat.width &&
          playerFeetY > plat.y &&
          playerHeadY < plat.y + plat.height
        ) {
          this.damagePlayer(player, 80 * dt, 'Environmental Hazard', 'none', false);
        }
        continue;
      }

      // Solid & One-Way Platform Collisions
      if (playerRightX > plat.x && playerLeftX < plat.x + plat.width) {
        // Falling down onto platform top
        if (player.vy >= 0 && playerFeetY >= plat.y && playerFeetY - player.vy * dt <= plat.y + 12) {
          // If crouching on one-way platform, can drop through
          if (plat.type === 'one_way' && player.isCrouching) {
            continue;
          }
          player.y = plat.y - player.height / 2;
          player.vy = 0;
          player.isGrounded = true;
        } else if (plat.type === 'solid') {
          // Head hit ceiling
          if (player.vy < 0 && playerHeadY <= plat.y + plat.height && playerHeadY - player.vy * dt >= plat.y) {
            player.y = plat.y + plat.height + player.height / 2;
            player.vy = 0;
          }
        }
      }
    }

    // Boundaries
    if (player.x < 30) player.x = 30;
    if (player.x > this.map.width - 30) player.x = this.map.width - 30;

    // Fell off bottom pit
    if (player.y > this.map.height) {
      this.damagePlayer(player, 9999, 'The Void', 'none', false);
    }

    // Reload Progress
    if (player.isReloading) {
      const weapon = WEAPON_REGISTRY[player.currentWeaponId];
      player.reloadProgress += (dt * 1000) / weapon.reloadTimeMs;
      if (player.reloadProgress >= 1) {
        this.completeReload(player);
      }
    }
  }

  public attemptFireWeapon(player: PlayerState, isRemote = false) {
    if (player.isDead || player.isReloading) return;
    const now = performance.now();
    const weapon = WEAPON_REGISTRY[player.currentWeaponId];

    if (now - player.lastFireTime < weapon.fireRateMs) return;

    const currentSlot = player.weapons[player.currentWeaponIndex];
    if (!currentSlot) return;

    if (currentSlot.ammoInClip <= 0) {
      this.triggerReload(player);
      return;
    }

    // Deduct ammo
    if (weapon.projectileType !== 'melee') {
      currentSlot.ammoInClip--;
    }
    player.lastFireTime = now;

    // Apply Recoil & Knockback
    const recoilAngle = player.aimAngle + Math.PI;
    player.vx += Math.cos(recoilAngle) * weapon.recoil * 15;
    player.vy += Math.sin(recoilAngle) * weapon.recoil * 15;

    // Camera Screen Shake if local player fired
    if (player.id === this.localPlayerId) {
      this.camera.shake = Math.min(this.camera.shake + weapon.recoil * 0.8, 18);
    }

    // Sound
    sound.playWeaponFire(weapon.id);

    // Muzzle Flash Particle
    this.createMuzzleFlash(player);

    // Eject Brass Shell Casing for firearms
    if (weapon.projectileType === 'bullet' || weapon.projectileType === 'buckshot' || weapon.projectileType === 'sniper') {
      const ejectAngle = player.aimAngle - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      const ejectSpeed = 160 + Math.random() * 80;
      this.shellCasings.push({
        id: `casing-${++this.projectileCounter}`,
        x: player.x,
        y: player.y - 6,
        vx: Math.cos(ejectAngle) * ejectSpeed,
        vy: Math.sin(ejectAngle) * ejectSpeed - 60,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 20,
        alpha: 1.0,
      });
      if (Math.random() < 0.25) {
        sound.playShellCasingPing();
      }
    }

    // Spawn Projectiles
    const spawnDist = 28;
    const spawnX = player.x + Math.cos(player.aimAngle) * spawnDist;
    const spawnY = player.y - 4 + Math.sin(player.aimAngle) * spawnDist;

    // Broadcast fire event across network
    if (player.id === this.localPlayerId && this.isMultiplayer && !isRemote && this.multiClient) {
      this.multiClient.notifyFired(weapon.id, spawnX, spawnY, player.aimAngle);
    }

    for (let p = 0; p < weapon.pelletCount; p++) {
      const spreadAngle = player.aimAngle + (Math.random() - 0.5) * weapon.spread * 2;
      const speed = weapon.bulletSpeed * (0.95 + Math.random() * 0.1);
      const vx = Math.cos(spreadAngle) * speed;
      const vy = Math.sin(spreadAngle) * speed;

      this.projectiles.push({
        id: `proj-${++this.projectileCounter}`,
        ownerId: player.id,
        ownerTeam: player.team,
        weaponId: weapon.id,
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        damage: weapon.damage,
        radius: weapon.bulletRadius,
        color: weapon.color,
        type: weapon.projectileType,
        lifetime: 0,
        maxLifetime: weapon.range / weapon.bulletSpeed,
        bounceCount: weapon.projectileType === 'grenade' ? 3 : 0,
        isExplosive: weapon.projectileType === 'rocket' || weapon.projectileType === 'grenade',
        explosionRadius: weapon.projectileType === 'rocket' ? 140 : weapon.projectileType === 'grenade' ? 120 : 0,
      });
    }
  }

  public triggerReload(player: PlayerState) {
    if (player.isReloading) return;
    const weapon = WEAPON_REGISTRY[player.currentWeaponId];
    const slot = player.weapons[player.currentWeaponIndex];
    if (!slot || slot.ammoInClip >= weapon.magazineSize || slot.reserveAmmo <= 0) return;

    player.isReloading = true;
    player.reloadProgress = 0;
    sound.playReload();
  }

  private completeReload(player: PlayerState) {
    player.isReloading = false;
    player.reloadProgress = 0;
    const weapon = WEAPON_REGISTRY[player.currentWeaponId];
    const slot = player.weapons[player.currentWeaponIndex];
    if (!slot) return;

    const needed = weapon.magazineSize - slot.ammoInClip;
    const toLoad = Math.min(needed, slot.reserveAmmo);
    slot.ammoInClip += toLoad;
    slot.reserveAmmo -= toLoad;
  }

  public cycleWeapon(player: PlayerState) {
    if (player.weapons.length <= 1) return;
    player.isReloading = false;
    player.currentWeaponIndex = (player.currentWeaponIndex + 1) % player.weapons.length;
    player.currentWeaponId = player.weapons[player.currentWeaponIndex].id;
    sound.playPickup('weapon');
  }

  public throwGrenade(player: PlayerState) {
    if (player.grenadeCount <= 0 || player.grenadeCooldown > 0) return;
    player.grenadeCount--;
    player.grenadeCooldown = 1.5;

    sound.playWeaponFire('shosholoza_grenade');
    const angle = player.aimAngle;
    const speed = 560;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 120; // Arch trajectory

    this.projectiles.push({
      id: `proj-${++this.projectileCounter}`,
      ownerId: player.id,
      ownerTeam: player.team,
      weaponId: 'shosholoza_grenade',
      x: player.x,
      y: player.y - 10,
      vx,
      vy,
      damage: 110,
      radius: 6,
      color: '#22C55E',
      type: 'grenade',
      lifetime: 0,
      maxLifetime: 2.2,
      bounceCount: 4,
      isExplosive: true,
      explosionRadius: 130,
    });

    if (player.id === this.localPlayerId && this.isMultiplayer && this.multiClient) {
      this.multiClient.notifyGrenade(player.x, player.y - 10, vx, vy);
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.lifetime += dt;

      // Grenade & Rocket Physics
      if (proj.type === 'grenade') {
        proj.vy += 850 * dt; // Gravity on grenade
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Rocket Smoke Trail
      if (proj.type === 'rocket' && Math.random() < 0.6) {
        this.particles.push({
          x: proj.x,
          y: proj.y,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          radius: 4 + Math.random() * 4,
          color: '#E2E8F0',
          alpha: 0.6,
          decay: 1.5,
        });
      }

      // Check Platform Collisions
      let hitPlatform = false;
      for (const plat of this.map.platforms) {
        if (plat.type === 'solid' || plat.type === 'metal') {
          if (
            proj.x > plat.x &&
            proj.x < plat.x + plat.width &&
            proj.y > plat.y &&
            proj.y < plat.y + plat.height
          ) {
            hitPlatform = true;
            if (proj.type === 'grenade' && (proj.bounceCount ?? 0) > 0) {
              proj.bounceCount = (proj.bounceCount ?? 1) - 1;
              proj.vy = -proj.vy * 0.55;
              proj.vx = proj.vx * 0.7;
              sound.playGrenadeBounce();
              hitPlatform = false;
            }
            break;
          }
        }
      }

      // Check Player Hits
      let hitPlayer: PlayerState | null = null;
      let isHeadshot = false;

      for (const p of this.players) {
        if (p.isDead || p.id === proj.ownerId) continue;
        if (proj.ownerTeam !== 'none' && p.team === proj.ownerTeam) continue;

        const left = p.x - p.width / 2;
        const right = p.x + p.width / 2;
        const top = p.y - p.height / 2;
        const bottom = p.y + p.height / 2;

        if (proj.x >= left && proj.x <= right && proj.y >= top && proj.y <= bottom) {
          hitPlayer = p;
          // Headshot if hit top 25% of character height
          if (proj.y < top + p.height * 0.28) {
            isHeadshot = true;
          }
          break;
        }
      }

      if (hitPlayer) {
        if (this.isMultiplayer) {
          // In multiplayer, send hit to server authoritatively
          if (proj.ownerId === this.localPlayerId && this.multiClient) {
            this.multiClient.reportHit(hitPlayer.id, proj.weaponId, isHeadshot);
          }
          if (proj.isExplosive) {
            this.triggerExplosion(proj.x, proj.y, proj.explosionRadius || 120, proj.damage, proj.ownerId, proj.weaponId);
          }
          this.projectiles.splice(i, 1);
          continue;
        }

        const finalDamage = isHeadshot ? proj.damage * 1.5 : proj.damage;
        const owner = this.players.find((p) => p.id === proj.ownerId);

        if (proj.isExplosive) {
          this.triggerExplosion(proj.x, proj.y, proj.explosionRadius || 120, proj.damage, proj.ownerId, proj.weaponId);
        } else {
          this.damagePlayer(
            hitPlayer,
            finalDamage,
            owner?.name || 'Zambian Commando',
            proj.ownerTeam || 'none',
            isHeadshot,
            proj.weaponId,
            proj.ownerId
          );
          // Knockback
          hitPlayer.vx += proj.vx * 0.12;
          hitPlayer.vy += proj.vy * 0.08;
        }

        this.projectiles.splice(i, 1);
        continue;
      }

      if (hitPlatform) {
        if (proj.isExplosive) {
          this.triggerExplosion(proj.x, proj.y, proj.explosionRadius || 120, proj.damage, proj.ownerId, proj.weaponId);
        } else {
          // Spark particles
          this.createSpark(proj.x, proj.y, proj.color);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Expired lifetime
      if (proj.lifetime >= proj.maxLifetime) {
        if (proj.isExplosive) {
          this.triggerExplosion(proj.x, proj.y, proj.explosionRadius || 120, proj.damage, proj.ownerId, proj.weaponId);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private triggerExplosion(
    x: number,
    y: number,
    radius: number,
    maxDamage: number,
    ownerId: string,
    weaponId: WeaponId
  ) {
    sound.playExplosion();
    this.camera.shake = Math.min(this.camera.shake + 14, 25);

    // Shockwave & Debris Particles
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 6,
        color: i % 2 === 0 ? '#EA580C' : '#FBBF24',
        alpha: 0.9,
        decay: 1.8,
      });
    }

    if (this.isMultiplayer) {
      if (ownerId === this.localPlayerId && this.multiClient) {
        this.multiClient.detonateExplosive(x, y, radius, maxDamage, weaponId);
      }
      return;
    }

    // Damage all players in blast radius (single player offline)
    for (const p of this.players) {
      if (p.isDead) continue;
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        const blastDamage = maxDamage * falloff;
        const owner = this.players.find((o) => o.id === ownerId);

        this.damagePlayer(
          p,
          blastDamage,
          owner?.name || 'Zambian Warrior',
          owner?.team || 'none',
          false,
          weaponId,
          ownerId
        );

        // Knockback outwards
        const kbAngle = Math.atan2(p.y - y, p.x - x);
        p.vx += Math.cos(kbAngle) * falloff * 550;
        p.vy += Math.sin(kbAngle) * falloff * 450 - 150;
      }
    }
  }

  public damagePlayer(
    victim: PlayerState,
    amount: number,
    attackerName: string,
    attackerTeam: 'green' | 'copper' | 'none',
    isHeadshot: boolean,
    weaponId: WeaponId = 'ak_zambia',
    attackerId?: string
  ) {
    if (victim.isDead) return;

    let damage = Math.round(amount);
    let absorbedByArmor = 0;

    if (victim.armor > 0) {
      sound.playShieldHit();
      victim.shieldHitFlash = 0.35;
      absorbedByArmor = Math.min(victim.armor, Math.round(damage * 0.6));
      victim.armor -= absorbedByArmor;
      if (victim.armor <= 0) {
        sound.playShieldBreak();
        victim.armor = 0;
      }
      damage -= absorbedByArmor;
    } else {
      sound.playHitMarker();
    }

    victim.health -= damage;

    // Floating text
    this.floatingTexts.push({
      id: `float-${Math.random()}`,
      x: victim.x + (Math.random() - 0.5) * 20,
      y: victim.y - victim.height / 2 - 10,
      text: isHeadshot ? `HEADSHOT -${damage + absorbedByArmor}` : `-${damage + absorbedByArmor}`,
      color: isHeadshot ? '#EF4444' : absorbedByArmor > 0 ? '#38BDF8' : '#F59E0B',
      alpha: 1.0,
      vy: -60,
      lifetime: 0.9,
    });

    // Blood / Armor Sparks
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: victim.x,
        y: victim.y,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 140,
        radius: 3,
        color: absorbedByArmor > 0 ? '#0284C7' : '#DC2626',
        alpha: 0.8,
        decay: 2.2,
      });
    }

    // Death check
    if (victim.health <= 0) {
      victim.health = 0;
      victim.isDead = true;
      victim.deaths++;
      victim.respawnTimer = 4.0;

      // Killer attribution
      if (attackerId) {
        const killer = this.players.find((p) => p.id === attackerId);
        if (killer && killer.id !== victim.id) {
          killer.kills++;
          killer.score += isHeadshot ? 150 : 100;

          if (killer.team === 'green') this.teamScores.green += 1;
          else if (killer.team === 'copper') this.teamScores.copper += 1;

          // Announcer kill streak sounds
          if (killer.kills === 3) sound.playAnnouncer('Weka pressure!');
          else if (killer.kills === 5) sound.playAnnouncer('Legendary warrior!');
          else if (killer.kills === 10) sound.playAnnouncer('Unstoppable Zambian Warrior!');
        }
      }

      // Add to kill feed
      const feedItem: KillFeedItem = {
        id: `kf-${Date.now()}-${Math.random()}`,
        killerName: attackerName,
        killerTeam: attackerTeam,
        victimName: victim.name,
        victimTeam: victim.team,
        weaponName: WEAPON_REGISTRY[weaponId]?.name || 'Combat Weapon',
        isHeadshot,
        timestamp: Date.now(),
      };
      this.killFeed.unshift(feedItem);
      if (this.killFeed.length > 5) this.killFeed.pop();

      if (this.callbacks.onKillFeed) {
        this.callbacks.onKillFeed(feedItem);
      }

      this.checkEndConditions();
    }

    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.players, this.teamScores);
    }
  }

  private respawnPlayer(player: PlayerState) {
    player.isDead = false;
    const char = CHARACTER_REGISTRY[player.characterId];
    player.health = char.maxHealth;
    player.armor = char.maxArmor;
    player.jetpackFuel = char.jetpackMaxFuel;
    player.vx = 0;
    player.vy = 0;
    player.isReloading = false;
    player.reloadProgress = 0;

    // Replenish magazine ammo on respawn
    const weapon = WEAPON_REGISTRY[player.currentWeaponId];
    const currentSlot = player.weapons[player.currentWeaponIndex];
    if (currentSlot && weapon) {
      currentSlot.ammoInClip = weapon.magazineSize;
    }

    // Pick spawn point based on team or random
    const validSpawns = this.map.spawns.filter(
      (s) => s.team === 'any' || s.team === player.team
    );
    const chosenSpawn =
      validSpawns[Math.floor(Math.random() * validSpawns.length)] || this.map.spawns[0];

    player.x = chosenSpawn.x;
    player.y = chosenSpawn.y;
  }

  private updatePickups(dt: number) {
    for (const pickup of this.pickups) {
      if (!pickup.active) {
        pickup.respawnTimeRemaining -= dt;
        if (pickup.respawnTimeRemaining <= 0) {
          pickup.active = true;
        }
        continue;
      }

      // Check if any alive player walks into pickup
      for (const p of this.players) {
        if (p.isDead) continue;
        const dist = Math.hypot(p.x - pickup.x, p.y - pickup.y);
        if (dist < 42) {
          let consumed = false;

          if (pickup.type === 'health' && p.health < p.maxHealth) {
            p.health = Math.min(p.maxHealth, p.health + 50);
            consumed = true;
          } else if (pickup.type === 'armor' && p.armor < p.maxArmor) {
            p.armor = Math.min(p.maxArmor, p.armor + 50);
            consumed = true;
          } else if (pickup.type === 'fuel' && p.jetpackFuel < p.maxJetpackFuel) {
            p.jetpackFuel = p.maxJetpackFuel;
            consumed = true;
          } else if (pickup.type === 'ammo') {
            const slot = p.weapons[p.currentWeaponIndex];
            if (slot) {
              const weapon = WEAPON_REGISTRY[slot.id];
              slot.reserveAmmo += weapon.magazineSize * 2;
              consumed = true;
            }
          } else if (pickup.type === 'weapon' && pickup.weaponId) {
            // Swap or add weapon
            const hasWeapon = p.weapons.find((w) => w.id === pickup.weaponId);
            if (!hasWeapon) {
              const def = WEAPON_REGISTRY[pickup.weaponId];
              p.weapons.push({ id: pickup.weaponId, ammoInClip: def.magazineSize, reserveAmmo: def.magazineSize * 2 });
              p.currentWeaponIndex = p.weapons.length - 1;
              p.currentWeaponId = pickup.weaponId;
              consumed = true;
            }
          }

          if (consumed) {
            pickup.active = false;
            pickup.respawnTimeRemaining = 12.0; // 12 second respawn
            sound.playPickup(pickup.type);
            this.floatingTexts.push({
              id: `float-${Math.random()}`,
              x: pickup.x,
              y: pickup.y - 15,
              text: `+${pickup.type.toUpperCase()}`,
              color: '#10B981',
              alpha: 1.0,
              vy: -40,
              lifetime: 0.8,
            });
            break;
          }
        }
      }
    }
  }

  private updateCaptureZone(dt: number, zone: CaptureZone) {
    let greenCount = 0;
    let copperCount = 0;

    for (const p of this.players) {
      if (p.isDead) continue;
      const dist = Math.hypot(p.x - zone.x, p.y - zone.y);
      if (dist <= zone.radius) {
        if (p.team === 'green') greenCount++;
        else if (p.team === 'copper') copperCount++;
      }
    }

    if (greenCount > copperCount) {
      zone.capturingTeam = 'green';
      zone.progress = Math.max(-100, zone.progress - dt * 25);
      if (zone.progress <= -100 && zone.controlTeam !== 'green') {
        zone.controlTeam = 'green';
        sound.playAnnouncer('Boma secured!');
      }
    } else if (copperCount > greenCount) {
      zone.capturingTeam = 'copper';
      zone.progress = Math.min(100, zone.progress + dt * 25);
      if (zone.progress >= 100 && zone.controlTeam !== 'copper') {
        zone.controlTeam = 'copper';
        sound.playAnnouncer('Boma secured!');
      }
    } else {
      zone.capturingTeam = null;
    }

    // Award periodic points to controlling team
    if (zone.controlTeam === 'green') {
      this.teamScores.green += dt * 3;
    } else if (zone.controlTeam === 'copper') {
      this.teamScores.copper += dt * 3;
    }

    this.checkEndConditions();
  }

  private checkEndConditions(timeExpired = false) {
    if (!this.isMatchActive) return;

    if (this.mode === 'tdm') {
      if (this.teamScores.green >= 25) {
        this.endMatch('Green Team (Chipolopolo)');
      } else if (this.teamScores.copper >= 25) {
        this.endMatch('Copper Team (Vanguard)');
      }
    } else if (this.mode === 'capture_boma') {
      if (this.teamScores.green >= 500) {
        this.endMatch('Green Team (Chipolopolo)');
      } else if (this.teamScores.copper >= 500) {
        this.endMatch('Copper Team (Vanguard)');
      }
    } else if (this.mode === 'survival') {
      const livingPlayers = this.players.filter((p) => !p.isDead);
      if (livingPlayers.length === 1) {
        this.endMatch(livingPlayers[0].name);
      }
    } else if (timeExpired) {
      // Find top scorer
      let topScorer = this.players[0];
      for (const p of this.players) {
        if (p.score > topScorer.score) topScorer = p;
      }
      this.endMatch(topScorer.name);
    }
  }

  private endMatch(winnerName: string) {
    this.isMatchActive = false;
    this.winnerName = winnerName;
    sound.playAnnouncer(`Victory to ${winnerName}!`);
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver(winnerName, this.teamScores);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.lifetime -= dt;
      t.alpha = Math.max(0, t.lifetime);
      if (t.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private createJetpackParticle(player: PlayerState) {
    const exhaustX = player.x + (player.facing === 'right' ? -14 : 14);
    const exhaustY = player.y + 16;
    this.particles.push({
      x: exhaustX,
      y: exhaustY,
      vx: (Math.random() - 0.5) * 40,
      vy: 120 + Math.random() * 80,
      radius: 4 + Math.random() * 3,
      color: Math.random() > 0.4 ? '#38BDF8' : '#F59E0B',
      alpha: 0.8,
      decay: 3.5,
    });
  }

  private createMuzzleFlash(player: PlayerState) {
    const flashDist = 28;
    const fx = player.x + Math.cos(player.aimAngle) * flashDist;
    const fy = player.y - 4 + Math.sin(player.aimAngle) * flashDist;
    this.particles.push({
      x: fx,
      y: fy,
      vx: Math.cos(player.aimAngle) * 30,
      vy: Math.sin(player.aimAngle) * 30,
      radius: 9,
      color: '#FEF08A',
      alpha: 0.9,
      decay: 12.0,
    });
  }

  private createSpark(x: number, y: number, color: string) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        radius: 2,
        color,
        alpha: 0.8,
        decay: 3.0,
      });
    }
  }

  private updateCamera(dt: number) {
    const local = this.getLocalPlayer();
    if (local) {
      this.camera.targetX = local.x;
      this.camera.targetY = local.y;
    }

    // Smooth lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * 10 * dt;
    this.camera.y += (this.camera.targetY - this.camera.y) * 10 * dt;

    // Decay screen shake
    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - 28 * dt);
    }
  }

  private updateShellCasings(dt: number) {
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const c = this.shellCasings[i];
      c.vy += 850 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.vRot * dt;
      c.alpha -= 0.18 * dt;

      // Platform bounce
      for (const plat of this.map.platforms) {
        if (plat.type === 'solid' || plat.type === 'metal') {
          if (c.x > plat.x && c.x < plat.x + plat.width && c.y >= plat.y && c.y <= plat.y + 16 && c.vy > 0) {
            c.y = plat.y - 1;
            c.vy = -c.vy * 0.45;
            c.vx = c.vx * 0.7;
            c.vRot = c.vRot * 0.5;
            break;
          }
        }
      }

      if (c.alpha <= 0) {
        this.shellCasings.splice(i, 1);
      }
    }
  }

  private drawShellCasings(ctx: CanvasRenderingContext2D) {
    for (const c of this.shellCasings) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.globalAlpha = Math.max(0, Math.min(1, c.alpha));
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-3, -1.5, 6, 3);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-3, -1.5, 1.5, 3);
      ctx.restore();
    }
  }

  // Canvas Rendering Pipeline
  public render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background gradient with parallax
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, this.map.bgGradient[0]);
    bg.addColorStop(0.5, this.map.bgGradient[1]);
    bg.addColorStop(1, this.map.bgGradient[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Apply Screen Shake
    ctx.save();
    const shakeOffsetX = (Math.random() - 0.5) * this.camera.shake;
    const shakeOffsetY = (Math.random() - 0.5) * this.camera.shake;

    // Camera Transformation (World to Viewport)
    ctx.translate(w / 2 + shakeOffsetX, h / 2 + shakeOffsetY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Parallax Mountains / Skyline
    this.drawParallaxBackdrop(ctx);

    // Draw Capture Zone if in Capture Mode
    if (this.map.captureZone && this.mode === 'capture_boma') {
      this.drawCaptureZone(ctx, this.map.captureZone);
    }

    // Draw Platforms
    this.drawPlatforms(ctx);

    // Draw Shell Casings
    this.drawShellCasings(ctx);

    // Draw Pickups
    this.drawPickups(ctx);

    // Draw Projectiles
    this.drawProjectiles(ctx);

    // Draw Particles
    this.drawParticles(ctx);

    // Draw Players
    for (const player of this.players) {
      this.drawPlayer(ctx, player);
    }

    // Draw Floating Texts
    this.drawFloatingTexts(ctx);

    ctx.restore();

    // Draw Tactical Crosshair (Desktop Mouse Mode)
    if (!this.touchControls.active) {
      this.drawCrosshair(ctx);
    }

    // Draw Touch Controls Overlay (if touch active)
    if (this.touchControls.active) {
      this.drawTouchControls(ctx);
    }
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D) {
    const mx = this.mousePos.x;
    const my = this.mousePos.y;

    ctx.save();
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 4;

    // Center dot
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.arc(mx, my, 2, 0, Math.PI * 2);
    ctx.fill();

    // Reticle circle
    ctx.beginPath();
    ctx.arc(mx, my, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle cross ticks
    const tickLen = 6;
    const gap = 4;
    ctx.beginPath();
    // Top
    ctx.moveTo(mx, my - gap);
    ctx.lineTo(mx, my - gap - tickLen);
    // Bottom
    ctx.moveTo(mx, my + gap);
    ctx.lineTo(mx, my + gap + tickLen);
    // Left
    ctx.moveTo(mx - gap, my);
    ctx.lineTo(mx - gap - tickLen, my);
    // Right
    ctx.moveTo(mx + gap, my);
    ctx.lineTo(mx + gap + tickLen, my);
    ctx.stroke();

    ctx.restore();
  }

  private drawParallaxBackdrop(ctx: CanvasRenderingContext2D) {
    const parallaxX = this.camera.x * 0.25;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    // Distant mountain / skyline silhouettes
    for (let i = -1; i < 4; i++) {
      const baseX = i * 800 - parallaxX;
      ctx.beginPath();
      ctx.moveTo(baseX, 1300);
      ctx.lineTo(baseX + 200, 750);
      ctx.lineTo(baseX + 450, 900);
      ctx.lineTo(baseX + 700, 680);
      ctx.lineTo(baseX + 800, 1300);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D) {
    for (const p of this.map.platforms) {
      if (p.type === 'hazard') {
        // Glowing molten copper or rapid river hazard
        ctx.fillStyle = p.color || '#EA580C';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Heat pulse overlay
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.fillRect(p.x, p.y, p.width, 6);
      } else {
        // Metal / Solid platform
        ctx.fillStyle = p.color || '#334155';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Platform edge highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(p.x, p.y, p.width, 3);

        // Zambian geometric patterned under-border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(p.x, p.y + p.height - 4, p.width, 4);
      }
    }
  }

  private drawCaptureZone(ctx: CanvasRenderingContext2D, zone: CaptureZone) {
    ctx.save();
    ctx.translate(zone.x, zone.y);

    // Glowing zone circle
    const color =
      zone.controlTeam === 'green'
        ? 'rgba(22, 163, 74, 0.25)'
        : zone.controlTeam === 'copper'
        ? 'rgba(234, 88, 12, 0.25)'
        : 'rgba(255, 255, 255, 0.12)';

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating perimeter ring
    const strokeColor =
      zone.controlTeam === 'green' ? '#16A34A' : zone.controlTeam === 'copper' ? '#EA580C' : '#94A3B8';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Central Boma Flag / Symbol
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.003;

    for (const p of this.pickups) {
      if (!p.active) continue;
      const hoverY = p.y + Math.sin(time + p.x) * 6;

      ctx.save();
      ctx.translate(p.x, hoverY);

      // Rotating glow aura
      ctx.shadowBlur = 12;
      if (p.type === 'health') {
        ctx.shadowColor = '#10B981';
        ctx.fillStyle = '#10B981';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-4, -10, 8, 20);
        ctx.fillRect(-10, -4, 20, 8);
      } else if (p.type === 'armor') {
        ctx.shadowColor = '#0284C7';
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(12, -6);
        ctx.lineTo(8, 12);
        ctx.lineTo(0, 16);
        ctx.lineTo(-8, 12);
        ctx.lineTo(-12, -6);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'fuel') {
        ctx.shadowColor = '#F59E0B';
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-9, -13, 18, 26);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-5, -7, 10, 14);
      } else {
        // Weapon crate
        ctx.shadowColor = '#EAB308';
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-15, -10, 30, 20);
      }

      // Floating Label & Vertical Light Pillar
      ctx.save();
      const lightGrad = ctx.createLinearGradient(0, -50, 0, 10);
      lightGrad.addColorStop(0, 'transparent');
      lightGrad.addColorStop(
        1,
        p.type === 'health'
          ? 'rgba(16, 185, 129, 0.25)'
          : p.type === 'armor'
          ? 'rgba(2, 132, 199, 0.25)'
          : p.type === 'fuel'
          ? 'rgba(245, 158, 11, 0.25)'
          : 'rgba(234, 179, 8, 0.25)'
      );
      ctx.fillStyle = lightGrad;
      ctx.fillRect(-12, -50, 24, 60);

      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      const label =
        p.type === 'weapon' && p.weaponId
          ? WEAPON_REGISTRY[p.weaponId]?.name || 'WEAPON'
          : p.type.toUpperCase();
      ctx.fillText(label, 0, -22);
      ctx.restore();

      ctx.restore();
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = proj.color;

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bullet trail
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = proj.radius;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.x - proj.vx * 0.03, proj.y - proj.vy * 0.03);
      ctx.stroke();

      // Electrical Arc Projectiles
      if (proj.type === 'arc') {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const startX = proj.x - proj.vx * 0.04;
        const startY = proj.y - proj.vy * 0.04;
        const midX = proj.x - proj.vx * 0.02 + (Math.random() - 0.5) * 14;
        const midY = proj.y - proj.vy * 0.02 + (Math.random() - 0.5) * 14;
        ctx.moveTo(startX, startY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));
      ctx.fillStyle = t.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState) {
    if (player.isDead) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    const char = CHARACTER_REGISTRY[player.characterId];
    const isFacingLeft = player.facing === 'left';

    // Player Name & Health Bar (Overhead)
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = player.team === 'green' ? '#4ADE80' : player.team === 'copper' ? '#FB923C' : '#FFFFFF';
    ctx.fillText(player.name, 0, -player.height / 2 - 20);

    // Health + Armor Bar Container
    const barW = 44;
    const barH = 5;
    const barY = -player.height / 2 - 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-barW / 2, barY, barW, barH);

    // Armor layer (blue overlay)
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    const armorRatio = Math.max(0, player.armor / player.maxArmor);

    ctx.fillStyle = hpRatio > 0.3 ? '#16A34A' : '#DC2626';
    ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

    if (armorRatio > 0) {
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(-barW / 2, barY - 3, barW * armorRatio, 2);
    }

    // Jetpack Backpack
    const jetpackX = isFacingLeft ? 12 : -12;
    ctx.fillStyle = '#334155';
    ctx.fillRect(jetpackX - 5, -12, 10, 24);

    // Jetpack Thruster Nozzle
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(jetpackX - 4, 12, 8, 4);

    // Animated Jetpack Thruster Flame
    if (player.isJetpacking) {
      const flameLen = 14 + Math.sin(performance.now() * 0.04) * 8;
      ctx.save();
      // Outer billowing flame
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(jetpackX - 4, 16);
      ctx.lineTo(jetpackX + 4, 16);
      ctx.lineTo(jetpackX, 16 + flameLen);
      ctx.closePath();
      ctx.fill();

      // Inner electric core
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(jetpackX - 2, 16);
      ctx.lineTo(jetpackX + 2, 16);
      ctx.lineTo(jetpackX, 16 + flameLen * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Animated Fluttering Chitenge Cape / Sash
    const sashWave = Math.sin(performance.now() * 0.008 + player.x * 0.01) * 6;
    const sashX = isFacingLeft ? 8 : -8;
    ctx.fillStyle = char.accentColor;
    ctx.beginPath();
    ctx.moveTo(sashX, 0);
    ctx.quadraticCurveTo(
      sashX + (isFacingLeft ? 14 : -14),
      8 + sashWave,
      sashX + (isFacingLeft ? 22 : -22),
      16 + sashWave
    );
    ctx.lineTo(sashX + (isFacingLeft ? 16 : -16), 18 + sashWave);
    ctx.closePath();
    ctx.fill();

    // Torso / Body with Zambian Hero Colors
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(-10, -14, 20, 28);

    // Chitenge Sash / Accent Strap on Chest
    ctx.fillStyle = char.accentColor;
    ctx.fillRect(-10, -4, 20, 6);

    // Head / Tactical Visor
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(0, -20, 10, 0, Math.PI * 2);
    ctx.fill();

    // Visor Glass with Glow Reflection
    ctx.fillStyle = '#38BDF8';
    const visorX = isFacingLeft ? -8 : 1;
    ctx.fillRect(visorX, -22, 7, 5);

    // Legs / Running cycle or trailing jetpack pose
    if (player.isGrounded) {
      const legOffset = Math.sin(performance.now() * 0.012) * (player.vx !== 0 ? 8 : 0);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-8, 14, 6, 12 + legOffset);
      ctx.fillRect(2, 14, 6, 12 - legOffset);
    } else {
      // In-flight trailing leg pose
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-7, 14, 5, 15);
      ctx.fillRect(2, 14, 5, 13);
    }

    // Shimmering Energy Shield Bubble when damaged or high armor
    const hasShieldEffect = (player.shieldHitFlash && player.shieldHitFlash > 0) || player.armor > 70;
    if (hasShieldEffect) {
      const shieldAlpha = (player.shieldHitFlash && player.shieldHitFlash > 0) ? 0.6 : 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldAlpha * 1.6})`;
      ctx.fillStyle = `rgba(14, 165, 233, ${shieldAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Reload Progress Ring overhead
    if (player.isReloading) {
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -player.height / 2 - 28, 8, -Math.PI / 2, -Math.PI / 2 + player.reloadProgress * Math.PI * 2);
      ctx.stroke();
      ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.textAlign = 'center';
      ctx.fillText('RELOAD', 0, -player.height / 2 - 38);
      ctx.restore();
    }

    // Weapon rendering rotated towards aim angle
    ctx.save();
    ctx.translate(0, -4);
    ctx.rotate(player.aimAngle);

    const weapon = WEAPON_REGISTRY[player.currentWeaponId];
    ctx.fillStyle = weapon.color;
    ctx.fillRect(6, -3, 20, 6);

    // Weapon Barrel
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(20, -2, 6, 4);

    // Sniper Laser Line
    if (weapon.projectileType === 'sniper' && !player.isReloading) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(400, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Twin Barrel for Sawed-Off Hand Cannon
    if (weapon.id === 'choma_cannon') {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(4, -1, 10, 6);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(18, -4, 6, 3);
      ctx.fillRect(18, 1, 6, 3);
    }

    ctx.restore();

    ctx.restore();
  }

  private drawTouchControls(ctx: CanvasRenderingContext2D) {
    // Draw Left Joystick (Movement/Jetpack)
    const ls = this.touchControls.leftStick;
    if (ls.active) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ls.startX, ls.startY, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(22, 163, 74, 0.6)';
      ctx.beginPath();
      ctx.arc(ls.startX + ls.dx, ls.startY + ls.dy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Right Joystick (Aim/Fire)
    const rs = this.touchControls.rightStick;
    if (rs.active) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rs.startX, rs.startY, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = rs.firing ? 'rgba(220, 38, 38, 0.8)' : 'rgba(234, 88, 12, 0.6)';
      ctx.beginPath();
      ctx.arc(rs.currX, rs.currY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
