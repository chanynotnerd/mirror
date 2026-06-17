// 위·아래 한 쌍. 각 레인에 통과 갭.
export interface LaneGap { gapCenter: number; gapHeight: number; }

export class ObstaclePair {
  scored = false;
  constructor(
    public x: number,
    public readonly width: number,
    public readonly top: LaneGap,
    public readonly bottom: LaneGap,
  ) {}

  update(dt: number, scrollSpeed: number) { this.x -= scrollSpeed * dt; }
  passed(playerX: number) { return this.x + this.width < playerX; }
  offscreen() { return this.x + this.width < 0; }
}
