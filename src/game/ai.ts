import { MapDef, PickupItem, PlayerState } from '../types/game';
import { WEAPON_REGISTRY } from './weapons';

export class BotController {
  private bot: PlayerState;
  private targetPlayer: PlayerState | null = null;
  private decisionTimer = 0;
  private jetpackBurstTimer = 0;
  private strafeDirection: -1 | 1 = 1;
  private strafeTimer = 0;

  constructor(bot: PlayerState) {
    this.bot = bot;
  }

  public update(
    dt: number,
    allPlayers: PlayerState[],
    map: MapDef,
    pickups: PickupItem[]
  ): {
    moveLeft: boolean;
    moveRight: boolean;
    jump: boolean;
    jetpack: boolean;
    crouch: boolean;
    aimAngle: number;
    fire: boolean;
    reload: boolean;
  } {
    const controls = {
      moveLeft: false,
      moveRight: false,
      jump: false,
      jetpack: false,
      crouch: false,
      aimAngle: this.bot.aimAngle,
      fire: false,
      reload: false,
    };

    if (this.bot.isDead) return controls;

    this.decisionTimer -= dt;
    this.jetpackBurstTimer -= dt;
    this.strafeTimer -= dt;

    if (this.strafeTimer <= 0) {
      this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
      this.strafeTimer = 1.0 + Math.random() * 2.0;
    }

    // Select target: nearest living enemy
    if (this.decisionTimer <= 0 || !this.targetPlayer || this.targetPlayer.isDead) {
      this.decisionTimer = 0.35;
      let closestDist = Infinity;
      let bestTarget: PlayerState | null = null;

      for (const p of allPlayers) {
        if (p.id === this.bot.id || p.isDead) continue;
        if (this.bot.team !== 'none' && p.team === this.bot.team) continue;

        const dx = p.x - this.bot.x;
        const dy = p.y - this.bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist < closestDist) {
          closestDist = dist;
          bestTarget = p;
        }
      }

      this.targetPlayer = bestTarget;
    }

    // Objective or Item Priority:
    // If low health (< 45), look for nearby health kit
    let targetX = this.targetPlayer ? this.targetPlayer.x : this.bot.x;
    let targetY = this.targetPlayer ? this.targetPlayer.y : this.bot.y;

    if (this.bot.health < 45) {
      const activeMedkit = pickups.find(
        (p) => p.active && (p.type === 'health' || p.type === 'armor')
      );
      if (activeMedkit) {
        const distToMed = Math.hypot(activeMedkit.x - this.bot.x, activeMedkit.y - this.bot.y);
        if (distToMed < 650) {
          targetX = activeMedkit.x;
          targetY = activeMedkit.y;
        }
      }
    } else if (map.captureZone && Math.random() > 0.3) {
      // Move toward capture zone if neutral or enemy controlled
      if (
        map.captureZone.controlTeam !== this.bot.team &&
        Math.hypot(this.bot.x - map.captureZone.x, this.bot.y - map.captureZone.y) > 200
      ) {
        targetX = map.captureZone.x;
        targetY = map.captureZone.y;
      }
    }

    // Horizontal Navigation
    const dx = targetX - this.bot.x;
    const dy = targetY - this.bot.y;
    const distToTarget = Math.hypot(dx, dy);

    const weapon = WEAPON_REGISTRY[this.bot.currentWeaponId];
    const preferredDist = weapon.projectileType === 'melee' ? 50 : weapon.projectileType === 'buckshot' ? 180 : 450;

    if (distToTarget > preferredDist + 50) {
      if (dx > 30) controls.moveRight = true;
      else if (dx < -30) controls.moveLeft = true;
    } else if (distToTarget < preferredDist - 50 && weapon.projectileType !== 'melee') {
      // Back away slightly / strafe
      if (dx > 0) controls.moveLeft = true;
      else controls.moveRight = true;
    } else {
      // In sweet spot: strafe left/right unpredictably
      if (this.strafeDirection === 1) controls.moveRight = true;
      else controls.moveLeft = true;
    }

    // Vertical Jetpack & Jump Navigation
    const isTargetAbove = dy < -70;
    const isPitBelow = this.bot.y > map.height - 200;

    if ((isTargetAbove || isPitBelow || Math.random() < 0.05) && this.bot.jetpackFuel > 15) {
      if (this.jetpackBurstTimer <= 0) {
        controls.jetpack = true;
        this.jetpackBurstTimer = 0.4 + Math.random() * 0.5;
      }
    }

    if (this.bot.isGrounded && Math.random() < 0.08) {
      controls.jump = true;
    }

    // Aiming & Firing Logic
    if (this.targetPlayer && !this.targetPlayer.isDead) {
      const aimDx = this.targetPlayer.x - this.bot.x;
      const aimDy = this.targetPlayer.y - this.bot.y;
      const baseAngle = Math.atan2(aimDy, aimDx);

      // Aim Inaccuracy based on difficulty
      let spreadOffset = 0;
      if (this.bot.botDifficulty === 'recruit') {
        spreadOffset = (Math.random() - 0.5) * 0.35;
      } else if (this.bot.botDifficulty === 'warrior') {
        spreadOffset = (Math.random() - 0.5) * 0.15;
      } else {
        // Elite
        spreadOffset = (Math.random() - 0.5) * 0.04;
      }

      controls.aimAngle = baseAngle + spreadOffset;

      const currentWeaponSlot = this.bot.weapons[this.bot.currentWeaponIndex];
      if (currentWeaponSlot && currentWeaponSlot.ammoInClip > 0) {
        // Line of sight check / range
        if (distToTarget < weapon.range && !this.bot.isReloading) {
          controls.fire = true;
        }
      } else if (currentWeaponSlot && currentWeaponSlot.ammoInClip === 0 && !this.bot.isReloading) {
        controls.reload = true;
      }
    }

    return controls;
  }
}
