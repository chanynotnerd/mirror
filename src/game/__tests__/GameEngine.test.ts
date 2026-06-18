import { GameEngine } from '../GameEngine';
import { params } from '../config/params';
import type { LaneLayout } from '../systems/spawner';

// step 1에서 GameEngine이 실제로 읽는 필드만 채운 최소 레이아웃.
// top 레인 [0,400] (중앙 200), bottom 레인 [400,800] (중앙 600).
function makeLayout(): LaneLayout {
  return {
    spawnX: 500,
    top: { top: 0, bottom: 400 },
    bottom: { top: 400, bottom: 800 },
  } as unknown as LaneLayout;
}

function startedEngine(): GameEngine {
  const e = new GameEngine(makeLayout());
  e.start('parallel');
  return e;
}

describe('GameEngine — step 1 (점프 + 중력 + 클램프)', () => {
  test('start(): 두 플레이어가 각 레인 중앙, PLAYING으로 전이', () => {
    const e = startedEngine();
    expect(e.phase).toBe('PLAYING');
    expect(e.topPlayer.y).toBe(200);
    expect(e.bottomPlayer.y).toBe(600);
    expect(e.topPlayer.vy).toBe(0);
    expect(e.bottomPlayer.vy).toBe(0);
  });

  test('탭 1회 → 두 플레이어 모두 위(음수 vy)로, y가 위로 이동', () => {
    const e = startedEngine();
    // restartLockTime(0.3s) 해제 후 탭해야 점프 작동
    e.onFrame(params.restartLockTime + 0.001, { tapped: false });
    const preTopY    = e.topPlayer.y;
    const preBottomY = e.bottomPlayer.y;
    e.onFrame(1 / 60, { tapped: true });
    expect(e.topPlayer.vy).toBeLessThan(0);
    expect(e.bottomPlayer.vy).toBeLessThan(0);
    expect(e.topPlayer.y).toBeLessThan(preTopY);
    expect(e.bottomPlayer.y).toBeLessThan(preBottomY);
  });

  test('잠금 중 탭 무시 — elapsed < restartLockTime → vy>0 (중력만)', () => {
    const e = startedEngine();
    e.onFrame(0.001, { tapped: true }); // elapsed=0.001 < 0.3
    expect(e.topPlayer.vy).toBeGreaterThan(0);
    expect(e.bottomPlayer.vy).toBeGreaterThan(0);
  });

  test('잠금 후 탭 작동 — elapsed >= restartLockTime → vy<0 (점프)', () => {
    const e = startedEngine();
    e.onFrame(params.restartLockTime + 0.001, { tapped: false }); // 잠금 해제
    e.onFrame(0.001, { tapped: true });
    expect(e.topPlayer.vy).toBeLessThan(0);
    expect(e.bottomPlayer.vy).toBeLessThan(0);
  });

  test('입력 없으면 중력으로 낙하 (vy>0, y 증가)', () => {
    const e = startedEngine();
    const startY = e.topPlayer.y;
    e.onFrame(1 / 60, { tapped: false });
    expect(e.topPlayer.vy).toBeGreaterThan(0);
    expect(e.topPlayer.y).toBeGreaterThan(startY);
  });

  test('오래 낙하해도 레인 아래 경계를 안 넘는다 (clamp)', () => {
    const e = startedEngine();
    const r = params.playerRadius;
    for (let i = 0; i < 300; i++) e.onFrame(1 / 60, { tapped: false });
    expect(e.topPlayer.y).toBeLessThanOrEqual(400 - r);
    expect(e.topPlayer.y).toBeGreaterThanOrEqual(0 + r);
    expect(e.bottomPlayer.y).toBeLessThanOrEqual(800 - r);
    expect(e.bottomPlayer.y).toBeGreaterThanOrEqual(400 + r);
  });

  test('탭 연타해도 레인 위 경계를 안 넘는다 (clamp)', () => {
    const e = startedEngine();
    const r = params.playerRadius;
    for (let i = 0; i < 300; i++) e.onFrame(1 / 60, { tapped: true });
    expect(e.topPlayer.y).toBeGreaterThanOrEqual(0 + r);
    expect(e.bottomPlayer.y).toBeGreaterThanOrEqual(400 + r);
  });

  test('이동은 dt 기반 — 같은 0.25초를 거친/고운 timestep으로 돌려도 결과 근접', () => {
    const coarse = startedEngine();
    const fine = startedEngine();
    const T = 0.25, hC = 1 / 60, hF = 1 / 120;
    for (let i = 0; i < Math.round(T / hC); i++) coarse.onFrame(hC, { tapped: false });
    for (let i = 0; i < Math.round(T / hF); i++) fine.onFrame(hF, { tapped: false });
    // 프레임 수에 의존했다면 크게 벌어짐. dt 기반이면 근접(오일러 적분 오차만큼만 차이).
    expect(Math.abs(coarse.topPlayer.y - fine.topPlayer.y)).toBeLessThan(5);
  });

  test('elapsed는 PLAYING 동안 dt만큼 누적', () => {
    const e = startedEngine();
    e.onFrame(0.1, { tapped: false });
    e.onFrame(0.1, { tapped: false });
    expect(e.elapsed).toBeCloseTo(0.2, 5);
  });

  test('start 전(MENU)에는 onFrame이 아무것도 안 한다', () => {
    const e = new GameEngine(makeLayout());
    expect(() => e.onFrame(1 / 60, { tapped: true })).not.toThrow();
    expect(e.phase).toBe('MENU');
  });
});