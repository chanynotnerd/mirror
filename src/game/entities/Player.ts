// 단일 캐릭터. 순수 로직(React/네이티브 import 금지). dt 기반 물리.
import { params } from '../config/params';
import { Lane } from '../types';

export interface LaneBounds { top: number; bottom: number; } // 레인 y 경계

export class Player {
  y: number;
  vy = 0;
  readonly radius = params.playerRadius;

  constructor(public readonly lane: Lane, public x: number, startY: number, private bounds: LaneBounds) {
    this.y = startY;
  }

  jumpUp() { this.vy = -params.jumpImpulse; }     // parallel: 위로
  jumpDown() { this.vy = params.jumpImpulse; }    // inverted 아래 캐릭터: 반대로

  update(dt: number) {
    this.vy += params.gravity * dt;
    if (this.vy > params.maxFallSpeed) this.vy = params.maxFallSpeed;
    this.y += this.vy * dt;
    this.clampToLane();
  }

  private clampToLane() {
    const minY = this.bounds.top + this.radius;
    const maxY = this.bounds.bottom - this.radius;
    if (this.y < minY) { this.y = minY; this.vy = 0; }
    if (this.y > maxY) { this.y = maxY; this.vy = 0; }
  }
}
