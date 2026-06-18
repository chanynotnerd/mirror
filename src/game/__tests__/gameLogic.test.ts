import { spawnObstaclePair, LaneLayout } from '../systems/spawner';
import { ObstaclePair } from '../entities/ObstaclePair';

// 레이아웃: top·bottom이 대칭이고 aligned가 항상 bottom 클램프 범위 안에 들어오도록 설계.
// top [0,400], bottom [402,802], gapHeight 100 기준:
//   topCenter ∈ [50, 350]
//   aligned = 402 + topCenter ∈ [452, 752]
//   bottom 클램프 = [452, 752]  → 클램프 발동 없음 → divergence=0 테스트가 결정론적.
const LAYOUT: LaneLayout = {
  top:    { top: 0,   bottom: 400 },
  bottom: { top: 402, bottom: 802 },
  spawnX: 500,
  obstacleWidth: 48,
};
const GAP_H = 100;

// ───────────────────────────────────────────────────────────────────────────
// spawnObstaclePair — 불변식
// ───────────────────────────────────────────────────────────────────────────

describe('spawnObstaclePair 불변식', () => {
  test('위 레인 갭 중심이 항상 레인 경계 안에 있다', () => {
    const min = LAYOUT.top.top    + GAP_H / 2;
    const max = LAYOUT.top.bottom - GAP_H / 2;
    for (let i = 0; i < 200; i++) {
      const pair = spawnObstaclePair(LAYOUT, Math.random(), GAP_H);
      expect(pair.top.gapCenter).toBeGreaterThanOrEqual(min);
      expect(pair.top.gapCenter).toBeLessThanOrEqual(max);
    }
  });

  test('아래 레인 갭 중심이 항상 레인 경계 안에 있다', () => {
    const min = LAYOUT.bottom.top    + GAP_H / 2;
    const max = LAYOUT.bottom.bottom - GAP_H / 2;
    for (let i = 0; i < 200; i++) {
      const pair = spawnObstaclePair(LAYOUT, Math.random(), GAP_H);
      expect(pair.bottom.gapCenter).toBeGreaterThanOrEqual(min);
      expect(pair.bottom.gapCenter).toBeLessThanOrEqual(max);
    }
  });

  // divergence=0 → bottomCenter = aligned = bottom.top + (topCenter - top.top)
  // 이 레이아웃에선 클램프가 발동하지 않으므로 결과가 완전히 결정론적.
  test('divergence=0: 아래 갭이 위 갭과 정확히 정렬된다', () => {
    for (let i = 0; i < 100; i++) {
      const pair = spawnObstaclePair(LAYOUT, 0, GAP_H);
      const expected = LAYOUT.bottom.top + (pair.top.gapCenter - LAYOUT.top.top);
      expect(pair.bottom.gapCenter).toBe(expected);
    }
  });

  test('장애물이 spawnX에 생성된다', () => {
    const pair = spawnObstaclePair(LAYOUT, 0, GAP_H);
    expect(pair.x).toBe(LAYOUT.spawnX);
    expect(pair.width).toBe(LAYOUT.obstacleWidth);
  });

  test('생성된 gapHeight가 요청값과 일치한다', () => {
    const pair = spawnObstaclePair(LAYOUT, 0.5, GAP_H);
    expect(pair.top.gapHeight).toBe(GAP_H);
    expect(pair.bottom.gapHeight).toBe(GAP_H);
  });

  // divergence=1 → bottomCenter가 aligned에서 독립적으로 분포해야 함.
  // 100회 중 최소 1회는 aligned에서 10px 이상 벗어난다 (독립 랜덤, 범위 300px).
  test('divergence=1: 아래 갭이 위 갭과 독립적으로 분포한다 (비정렬)', () => {
    let maxDiff = 0;
    for (let i = 0; i < 100; i++) {
      const pair = spawnObstaclePair(LAYOUT, 1, GAP_H);
      const aligned = LAYOUT.bottom.top + (pair.top.gapCenter - LAYOUT.top.top);
      maxDiff = Math.max(maxDiff, Math.abs(pair.bottom.gapCenter - aligned));
    }
    expect(maxDiff).toBeGreaterThan(10);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// ObstaclePair — 스크롤 + 컬링
// ───────────────────────────────────────────────────────────────────────────

describe('ObstaclePair 스크롤', () => {
  test('update(dt, speed): x가 speed*dt만큼 정확히 감소한다', () => {
    const pair = new ObstaclePair(
      500, 48,
      { gapCenter: 200, gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    );
    const speed = 250;
    const dt = 1 / 60;
    pair.update(dt, speed);
    expect(pair.x).toBeCloseTo(500 - speed * dt, 8);
  });

  test('update 여러 프레임 누적 이동량이 정확하다', () => {
    const pair = new ObstaclePair(
      400, 48,
      { gapCenter: 200, gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    );
    const speed = 200;
    const dt = 1 / 60;
    const frames = 60;
    for (let i = 0; i < frames; i++) pair.update(dt, speed);
    expect(pair.x).toBeCloseTo(400 - speed * dt * frames, 5);
  });
});

describe('ObstaclePair 컬링', () => {
  test('x + width < 0 이면 offscreen() = true', () => {
    const pair = new ObstaclePair(
      -100, 48,
      { gapCenter: 200, gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    );
    expect(pair.offscreen()).toBe(true);
  });

  test('x + width = 0 이면 offscreen() = false (경계: 왼쪽 끝과 정확히 맞닿음)', () => {
    const pair = new ObstaclePair(
      -48, 48,   // x + width = 0 → 아직 화면 밖이 아님 (strict < 0)
      { gapCenter: 200, gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    );
    expect(pair.offscreen()).toBe(false);
  });

  test('x + width < 0 이면 offscreen() = true (1px 초과)', () => {
    const pair = new ObstaclePair(
      -49, 48,   // x + width = -1 < 0
      { gapCenter: 200, gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    );
    expect(pair.offscreen()).toBe(true);
  });

  test('x + width > 0 이면 offscreen() = false', () => {
    const pair = new ObstaclePair(
      -10, 48,    // x + width = 38 > 0
      { gapCenter: 200, gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    );
    expect(pair.offscreen()).toBe(false);
  });
});
