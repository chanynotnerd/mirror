// 경과시간 → scrollSpeed/spawnInterval/divergence/gapHeight (구간 선형 보간).
import { params, DifficultyTier } from '../config/params';

type Curve = 'scrollSpeed' | 'spawnInterval' | 'divergence' | 'gapHeight';

function lerpTier(elapsed: number, key: Curve): number {
  const t = params.difficultyTiers;
  if (elapsed <= t[0].from) return t[0][key];
  for (let i = 0; i < t.length - 1; i++) {
    const a = t[i] as DifficultyTier, b = t[i + 1] as DifficultyTier;
    if (elapsed >= a.from && elapsed < b.from) {
      const r = (elapsed - a.from) / (b.from - a.from);
      return a[key] + (b[key] - a[key]) * r;
    }
  }
  return t[t.length - 1][key];
}

export const difficulty = {
  scrollSpeed: (elapsed: number) => lerpTier(elapsed, 'scrollSpeed'),
  spawnInterval: (elapsed: number) => lerpTier(elapsed, 'spawnInterval'),
  divergence: (elapsed: number) => lerpTier(elapsed, 'divergence'),
  gapHeight: (elapsed: number) => lerpTier(elapsed, 'gapHeight'),
};
