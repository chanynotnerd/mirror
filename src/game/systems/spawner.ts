// 게임의 핵심. divergence로 위·아래 갭 어긋남 제어, 코인은 위험 자리 우선.
// ⚠ 디자인 민감 영역 — 본 구현/튜닝 전 짧은 계획 제안 권장 (CLAUDE.md 워크플로).
import { params } from '../config/params';
import { ObstaclePair, LaneGap } from '../entities/ObstaclePair';
import { Coin } from '../entities/Coin';
import { Lane } from '../types';

export interface LaneLayout {
  top: { top: number; bottom: number };    // 위 레인 y 범위
  bottom: { top: number; bottom: number }; // 아래 레인 y 범위
  spawnX: number;                          // 화면 오른쪽 밖
  obstacleWidth: number;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function randomGapCenter(lane: { top: number; bottom: number }, gapHeight: number) {
  const min = lane.top + gapHeight / 2;
  const max = lane.bottom - gapHeight / 2;
  return min + Math.random() * (max - min);
}

// divergence 0 → 아래 갭을 위 갭과 정렬, 1 → 독립 랜덤.
export function spawnObstaclePair(layout: LaneLayout, divergence: number, gapHeight: number): ObstaclePair {
  const topCenter = randomGapCenter(layout.top, gapHeight);
  const aligned = layout.bottom.top + (topCenter - layout.top.top);
  const independent = randomGapCenter(layout.bottom, gapHeight);
  const bottomCenter = clamp(
    aligned + (independent - aligned) * divergence,
    layout.bottom.top + gapHeight / 2,
    layout.bottom.bottom - gapHeight / 2,
  );
  const top: LaneGap = { gapCenter: topCenter, gapHeight };
  const bottom: LaneGap = { gapCenter: bottomCenter, gapHeight };
  return new ObstaclePair(layout.spawnX, layout.obstacleWidth, top, bottom);
}

// TODO: coinRiskBias로 divergence 큰 쌍의 '갭 가장자리'(위험 자리) 우선 배치.
export function maybeSpawnCoin(pair: ObstaclePair, _layout: LaneLayout): Coin | null {
  if (Math.random() > params.coinSpawnChance) return null;
  const lane: Lane = Math.random() < 0.5 ? 'top' : 'bottom';
  const gap = lane === 'top' ? pair.top : pair.bottom;
  return new Coin(pair.x, gap.gapCenter, lane); // 임시: 갭 중심. 위험 자리 로직은 TODO.
}
