import {
  GameMode,
  MapId,
  NetworkDamagePayload,
  NetworkKillPayload,
  NetworkMatchResult,
  NetworkRespawnPayload,
  NetworkTickPayload,
  PlayerState,
  RoomInfo,
  WeaponId,
} from '../types/game';

export interface MultiplayerClientCallbacks {
  onRoomCreated?: (code: string, playerId: string, roomInfo: RoomInfo, players: PlayerState[]) => void;
  onRoomJoined?: (code: string, playerId: string, roomInfo: RoomInfo, players: PlayerState[]) => void;
  onPlayerJoined?: (player: PlayerState) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerUpdate?: (player: PlayerState) => void;
  onPlayerFired?: (data: { playerId: string; weaponId: WeaponId; x: number; y: number; angle: number }) => void;
  onPlayerThrewGrenade?: (data: { playerId: string; x: number; y: number; vx: number; vy: number }) => void;
  onPlayerDamaged?: (data: NetworkDamagePayload) => void;
  onPlayerKilled?: (data: NetworkKillPayload) => void;
  onPlayerRespawned?: (data: NetworkRespawnPayload) => void;
  onMatchStarted?: () => void;
  onMatchTick?: (data: NetworkTickPayload) => void;
  onMatchResults?: (data: NetworkMatchResult) => void;
  onNewHost?: (hostId: string) => void;
  onChat?: (senderName: string, message: string) => void;
  onError?: (message: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public playerId: string | null = null;
  public currentRoom: RoomInfo | null = null;
  public isConnected = false;
  public callbacks: MultiplayerClientCallbacks = {};

  constructor(callbacks: MultiplayerClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (err) => {
          console.warn('Multiplayer WebSocket notice:', err);
          this.isConnected = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
        };
      } catch (e) {
        console.warn('Failed to initialize WebSocket client:', e);
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  private handleMessage(dataStr: string) {
    try {
      const msg = JSON.parse(dataStr);

      switch (msg.type) {
        case 'room_created':
          this.playerId = msg.playerId;
          this.currentRoom = msg.roomInfo;
          if (this.callbacks.onRoomCreated) {
            this.callbacks.onRoomCreated(msg.code, msg.playerId, msg.roomInfo, msg.players);
          }
          break;

        case 'room_joined':
          this.playerId = msg.playerId;
          this.currentRoom = msg.roomInfo;
          if (this.callbacks.onRoomJoined) {
            this.callbacks.onRoomJoined(msg.code, msg.playerId, msg.roomInfo, msg.players);
          }
          break;

        case 'player_joined':
          if (this.callbacks.onPlayerJoined) {
            this.callbacks.onPlayerJoined(msg.player);
          }
          break;

        case 'player_left':
          if (this.callbacks.onPlayerLeft) {
            this.callbacks.onPlayerLeft(msg.playerId);
          }
          break;

        case 'new_host':
          if (this.callbacks.onNewHost) {
            this.callbacks.onNewHost(msg.hostId);
          }
          break;

        case 'player_update':
          if (this.callbacks.onPlayerUpdate) {
            this.callbacks.onPlayerUpdate(msg.player);
          }
          break;

        case 'player_fired':
          if (this.callbacks.onPlayerFired) {
            this.callbacks.onPlayerFired(msg);
          }
          break;

        case 'player_threw_grenade':
          if (this.callbacks.onPlayerThrewGrenade) {
            this.callbacks.onPlayerThrewGrenade(msg);
          }
          break;

        case 'player_damaged':
          if (this.callbacks.onPlayerDamaged) {
            this.callbacks.onPlayerDamaged(msg);
          }
          break;

        case 'player_killed':
          if (this.callbacks.onPlayerKilled) {
            this.callbacks.onPlayerKilled(msg);
          }
          break;

        case 'player_respawned':
          if (this.callbacks.onPlayerRespawned) {
            this.callbacks.onPlayerRespawned(msg);
          }
          break;

        case 'match_started':
          if (this.callbacks.onMatchStarted) {
            this.callbacks.onMatchStarted();
          }
          break;

        case 'match_tick':
          if (this.callbacks.onMatchTick) {
            this.callbacks.onMatchTick(msg);
          }
          break;

        case 'match_results':
          if (this.callbacks.onMatchResults) {
            this.callbacks.onMatchResults(msg);
          }
          break;

        case 'chat':
          if (this.callbacks.onChat) {
            this.callbacks.onChat(msg.senderName, msg.message);
          }
          break;

        case 'error':
          if (this.callbacks.onError) {
            this.callbacks.onError(msg.message);
          }
          break;
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  }

  public createRoom(
    name: string,
    playerName: string,
    characterId: string,
    mode: GameMode,
    mapId: MapId
  ) {
    this.send({
      type: 'create_room',
      name,
      playerName,
      characterId,
      mode,
      mapId,
    });
  }

  public joinRoom(code: string, playerName: string, characterId: string) {
    this.send({
      type: 'join_room',
      code,
      playerName,
      characterId,
    });
  }

  public startMatch() {
    this.send({ type: 'start_match' });
  }

  public syncPlayer(player: Partial<PlayerState>) {
    this.send({
      type: 'player_sync',
      player,
    });
  }

  public notifyFired(weaponId: WeaponId, x: number, y: number, angle: number) {
    this.send({
      type: 'fire_weapon',
      weaponId,
      x,
      y,
      angle,
    });
  }

  public notifyGrenade(x: number, y: number, vx: number, vy: number) {
    this.send({
      type: 'throw_grenade',
      x,
      y,
      vx,
      vy,
    });
  }

  public reportHit(targetId: string, weaponId: WeaponId, isHeadshot: boolean) {
    this.send({
      type: 'report_hit',
      targetId,
      weaponId,
      isHeadshot,
    });
  }

  public detonateExplosive(x: number, y: number, radius: number, damage: number, weaponId: WeaponId) {
    this.send({
      type: 'detonate_explosive',
      x,
      y,
      radius,
      damage,
      weaponId,
    });
  }

  public sendChat(message: string) {
    this.send({
      type: 'chat_message',
      message,
    });
  }

  private send(obj: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
