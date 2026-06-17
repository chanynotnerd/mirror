import { params } from '../config/params';
import { Player } from '../entities/Player';
import { ObstaclePair } from '../entities/ObstaclePair';

// 두 플레이어 모두 갭 중심 ±perfectWindow 안 = 퍼펙트.
export function isPerfect(top: Player, bottom: Player, pair: ObstaclePair): boolean {
  const dt = Math.abs(top.y - pair.top.gapCenter);
  const db = Math.abs(bottom.y - pair.bottom.gapCenter);
  return dt <= params.perfectWindow && db <= params.perfectWindow;
}

export function comboMultiplier(combo: number): number {
  return Math.min(params.comboMaxMult, 1 + combo * params.comboStep);
}
