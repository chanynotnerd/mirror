import { Player } from '../entities/Player';
import { ObstaclePair } from '../entities/ObstaclePair';
import { hitsObstacle } from '../systems/collision';
import { GameEngine } from '../GameEngine';
import type { LaneLayout } from '../systems/spawner';

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

// params.playerRadius = 16 를 쓰는 Player 인스턴스 생성.
// bounds를 넓게 잡아 clamp가 테스트 위치를 흐트러뜨리지 않게 함.
function makePlayer(x: number, y: number): Player {
  return new Player('top', x, y, { top: -99999, bottom: 99999 });
}

// obstacleWidth 포함, start()가 사용하는 모든 필드가 채워진 레이아웃.
// spawnX=500, playerXRatio=0.2 → playerX=100
// top 레인 [0,400] 중앙 200 / bottom 레인 [400,800] 중앙 600
function makeLayout(): LaneLayout {
  return {
    spawnX: 500,
    obstacleWidth: 48,
    top:    { top: 0,   bottom: 400 },
    bottom: { top: 400, bottom: 800 },
  };
}

// GameEngine을 start()까지 한 번에 초기화
function startedEngine(): GameEngine {
  const e = new GameEngine(makeLayout());
  e.start('parallel');
  return e;
}

// ─────────────────────────────────────────────────────────────────────────────
// hitsObstacle — 순수 함수 경계 케이스
//
// 기준값
//   gap: gapCenter=200, gapHeight=100  →  갭 영역 y ∈ [150, 250]
//   obs: x=100, width=48              →  x ∈ [100, 148]
//   player radius = 16 (params.playerRadius)
// ─────────────────────────────────────────────────────────────────────────────

const GAP  = { gapCenter: 200, gapHeight: 100 };
const OX   = 100;
const OW   = 48;

describe('hitsObstacle — X 범위 밖', () => {
  test('플레이어가 장애물 완전히 왼쪽 (x+r ≤ obsX) → false', () => {
    // player.x + radius = 84 ≤ 100 → overlapX false
    const p = makePlayer(68, 200);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(false);
  });

  test('플레이어가 장애물 완전히 오른쪽 (x−r ≥ obsX+width) → false', () => {
    // player.x - radius = 164 ≥ 148 → overlapX false
    const p = makePlayer(164, 200);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(false);
  });

  test('경계: x−r = obsX+width (strict <, 딱 붙음) → false', () => {
    // player.x - radius = 148 < 148 → false (strict <)
    const p = makePlayer(164, 80);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(false);
  });
});

describe('hitsObstacle — X 오버랩 + 갭 상태', () => {
  // x=124: player.x + radius=140 > 100 ✓  player.x - radius=108 < 148 ✓ → X 오버랩

  test('갭 안에 완전히 들어감 → false', () => {
    // y=200: 200-16=184 ≥ 150  &&  200+16=216 ≤ 250 → insideGap true → false
    const p = makePlayer(124, 200);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(false);
  });

  test('갭 위쪽 블록에 걸침 (y 너무 높음) → true', () => {
    // y=80: 80+16=96 ≤ 250 but 80-16=64 < 150 → insideGap false → true
    const p = makePlayer(124, 80);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(true);
  });

  test('갭 아래쪽 블록에 걸침 (y 너무 낮음) → true', () => {
    // y=320: 320+16=336 > 250 → insideGap false → true
    const p = makePlayer(124, 320);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(true);
  });

  test('경계: 1px 앞 (x−r = obsX+width−1) → X 오버랩 + 갭 밖 → true', () => {
    // player.x = 163: 163-16=147 < 148 → X 오버랩 성립. y=80 → 갭 밖 → true
    const p = makePlayer(163, 80);
    expect(hitsObstacle(p, GAP, OX, OW)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GameEngine 통합 — 충돌 + 점수
//
// dt=0.001 : 중력/스크롤로 인한 위치 변화가 무시할 수준(~0.001px)이어서
//            직전에 셋업한 위치가 거의 그대로 유지됨.
// timeSinceSpawn=0 → spawnInterval≈1.8s이므로 스폰 없음.
// ─────────────────────────────────────────────────────────────────────────────

const DT = 0.001; // 작은 dt

describe('GameEngine 통합 — 충돌', () => {
  // 위 플레이어: x=100, y=200 (기본)
  // 장애물: x=70, width=48 → x 오버랩 성립 [84, 116] ∩ [70, 118]
  // top gap: gapCenter=50, gapHeight=100 → 갭 y ∈ [0, 100]
  //   → 플레이어 y=200: 200-16=184 > 100(gapBottom) → 갭 밖 → 충돌!
  test('위 플레이어 충돌 → phase=GAMEOVER', () => {
    const e = startedEngine();
    e.obstacles.push(new ObstaclePair(70, 48,
      { gapCenter: 50,  gapHeight: 100 },  // top gap: [0,100]  → player y=200 밖
      { gapCenter: 600, gapHeight: 100 },  // bottom gap (무관)
    ));
    e.onFrame(DT, { tapped: false });
    expect(e.phase).toBe('GAMEOVER');
  });

  // 아래 플레이어: x=100, y=600 (기본)
  // bottom gap: gapCenter=450, gapHeight=100 → 갭 y ∈ [400, 500]
  //   → 플레이어 y=600: 600+16=616 > 500 → 갭 밖 → 충돌!
  // top gap: gapCenter=200, gapHeight=100 → 갭 y ∈ [150,250] → 플레이어 y=200 안 → 위는 통과
  test('아래 플레이어 충돌 → phase=GAMEOVER', () => {
    const e = startedEngine();
    e.obstacles.push(new ObstaclePair(70, 48,
      { gapCenter: 200, gapHeight: 100 },  // top gap: [150,250] → player y=200 안 → 통과
      { gapCenter: 450, gapHeight: 100 },  // bottom gap: [400,500] → player y=600 밖 → 충돌!
    ));
    e.onFrame(DT, { tapped: false });
    expect(e.phase).toBe('GAMEOVER');
  });

  test('충돌이 없으면 PLAYING 유지', () => {
    const e = startedEngine();
    // 두 레인 모두 플레이어가 갭 안에 있는 장애물
    e.obstacles.push(new ObstaclePair(70, 48,
      { gapCenter: 200, gapHeight: 170 },  // top: [115,285] → player y=200 안
      { gapCenter: 600, gapHeight: 170 },  // bottom: [515,685] → player y=600 안
    ));
    e.onFrame(DT, { tapped: false });
    expect(e.phase).toBe('PLAYING');
  });
});

describe('GameEngine 통합 — 점수', () => {
  // 장애물 x=0, width=48 → right edge=48.
  // 스크롤 후: 48 - 200*0.001 = 47.8 < playerX(100) → passed=true
  // X 오버랩: playerX-radius=84 < 47.8 → false → 충돌 없음 → 점수 가산
  function passedObs(): ObstaclePair {
    return new ObstaclePair(0, 48,
      { gapCenter: 200, gapHeight: 170 },
      { gapCenter: 600, gapHeight: 170 },
    );
  }

  test('장애물 통과 시 score += 1', () => {
    const e = startedEngine();
    e.obstacles.push(passedObs());
    e.onFrame(DT, { tapped: false });
    expect(e.score).toBe(1);
  });

  test('같은 쌍을 두 번 통과해도 score는 1에서 멈춤 (scored 플래그)', () => {
    const e = startedEngine();
    e.obstacles.push(passedObs());
    e.onFrame(DT, { tapped: false });
    e.onFrame(DT, { tapped: false });
    expect(e.score).toBe(1);
  });

  test('충돌한 장애물은 점수 없이 GAMEOVER', () => {
    const e = startedEngine();
    // x 오버랩 + 갭 밖 → 충돌 → gameOver() + return → 점수 단계 미도달
    e.obstacles.push(new ObstaclePair(70, 48,
      { gapCenter: 50,  gapHeight: 100 },
      { gapCenter: 600, gapHeight: 100 },
    ));
    e.onFrame(DT, { tapped: false });
    expect(e.phase).toBe('GAMEOVER');
    expect(e.score).toBe(0);
  });
});
