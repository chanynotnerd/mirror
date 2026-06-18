// 루프 + 상태 머신. 순수 로직 — 렌더러가 매 프레임 onFrame(dt, input) 호출.
import { params } from './config/params';
import { Player } from './entities/Player';
import { ObstaclePair } from './entities/ObstaclePair';
import { Coin } from './entities/Coin';
import { spawnObstaclePair, LaneLayout } from './systems/spawner';
import { difficulty } from './systems/difficulty';
import { hitsObstacle } from './systems/collision';
import { isPerfect, comboMultiplier } from './systems/scoring';
import { GamePhase, Mode } from './types';

export interface FrameInput { tapped: boolean; }

export class GameEngine {
  phase: GamePhase = 'MENU';
  mode: Mode = 'parallel';
  elapsed = 0;
  score = 0;
  combo = 0;
  coins = 0;

  topPlayer!: Player;
  bottomPlayer!: Player;
  obstacles: ObstaclePair[] = [];
  coinList: Coin[] = [];
  private timeSinceSpawn = 0;

  constructor(private layout: LaneLayout) {}

  start(mode: Mode = 'parallel') {
    this.mode = mode;
    this.phase = 'PLAYING';
    this.elapsed = 0; this.score = 0; this.combo = 0; this.coins = 0;
    this.obstacles = []; this.coinList = []; this.timeSinceSpawn = 0;

    const topMid    = (this.layout.top.top    + this.layout.top.bottom)    / 2;
    const bottomMid = (this.layout.bottom.top + this.layout.bottom.bottom) / 2;
    const playerX   = this.layout.spawnX * params.playerXRatio;

    this.topPlayer = new Player('top', playerX, topMid, {
      top: this.layout.top.top, bottom: this.layout.top.bottom,
    });
    this.bottomPlayer = new Player('bottom', playerX, bottomMid, {
      top: this.layout.bottom.top, bottom: this.layout.bottom.bottom,
    });
  }

  // SPEC §3 루프: 1 입력 → 2 물리 → 3 스크롤 → 4 스폰 → 5 충돌 → 6 점수/코인 → 7 컬링
  onFrame(dt: number, input: FrameInput) {
    if (this.phase !== 'PLAYING') return;
    this.elapsed += dt;
    this.timeSinceSpawn += dt;

    // 1. 입력 소비 — restartLockTime 이전 탭 무시 (전환 직후 오입력 방지)
    if (input.tapped && this.elapsed >= this.restartLockTime) {
      this.topPlayer.jumpUp();
      this.bottomPlayer.jumpUp();
    }

    // 2. 플레이어 물리 (중력 + 레인 클램프)
    this.topPlayer.update(dt);
    this.bottomPlayer.update(dt);

    // 3. 월드 스크롤
    const speed = difficulty.scrollSpeed(this.elapsed);
    for (const obs of this.obstacles) obs.update(dt, speed);

    // 4. 스폰
    if (this.timeSinceSpawn > difficulty.spawnInterval(this.elapsed)) {
      this.obstacles.push(spawnObstaclePair(
        this.layout,
        difficulty.divergence(this.elapsed),
        difficulty.gapHeight(this.elapsed),
      ));
      this.timeSinceSpawn = 0;
    }

    // 5. 충돌 (레인별 AABB — 첫 히트에 gameOver + return)
    for (const obs of this.obstacles) {
      if (hitsObstacle(this.topPlayer, obs.top, obs.x, obs.width)) {
        this.gameOver(); return;
      }
      if (hitsObstacle(this.bottomPlayer, obs.bottom, obs.x, obs.width)) {
        this.gameOver(); return;
      }
    }

    // 6. 점수 (충돌 없이 통과한 쌍 — 퍼펙트면 combo++·배수 적용, 아니면 combo 리셋)
    for (const obs of this.obstacles) {
      if (!obs.scored && obs.passed(this.topPlayer.x)) {
        obs.scored = true;
        if (isPerfect(this.topPlayer, this.bottomPlayer, obs)) {
          this.combo++;
          this.score += params.pointsPerPair * comboMultiplier(this.combo);
        } else {
          this.combo = 0;
          this.score += params.pointsPerPair;
        }
      }
    }

    // 7. 컬링 (화면 왼쪽 밖 제거)
    this.obstacles = this.obstacles.filter(o => !o.offscreen());
  }

  get currentMultiplier(): number { return comboMultiplier(this.combo); }

  private gameOver() {
    this.phase = 'GAMEOVER';
  }

  readonly restartLockTime = params.restartLockTime;
}
