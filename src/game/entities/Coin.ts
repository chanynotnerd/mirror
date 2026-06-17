import { Lane } from '../types';

export class Coin {
  collected = false;
  constructor(public x: number, public y: number, public readonly lane: Lane, public readonly radius = 8) {}
  update(dt: number, scrollSpeed: number) { this.x -= scrollSpeed * dt; }
  offscreen() { return this.x + this.radius < 0; }
}
