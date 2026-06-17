// 루프 + 상태 머신. 순수 로직 — 렌더러가 매 프레임 onFrame(dt, input) 호출.
// ⚠ 루프 본 구현(2~7단계)은 계획 제안 후 채우기.
import { params } from './config/params';
import { Player } from './entities/Player';
import { ObstaclePair } from './entities/ObstaclePair';
import { Coin } from './entities/Coin';
import { difficulty } from './systems/difficulty';
import { LaneLayout } from './systems/spawner';
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
    // TODO: this.layout으로 topPlayer/bottomPlayer 초기화
  }

  // SPEC §3 루프: 1 입력 → 2 물리 → 3 스크롤 → 4 스폰 → 5 충돌 → 6 점수/코인 → 7 컬링
  onFrame(dt: number, _input: FrameInput) {
    if (this.phase !== 'PLAYING') return;
    this.elapsed += dt;
    this.timeSinceSpawn += dt;
    const _speed = difficulty.scrollSpeed(this.elapsed);
    // TODO: 각 단계 구현
  }

  private gameOver() {
    this.phase = 'GAMEOVER';
    // TODO: bestScore 갱신은 화면/서비스 레이어에서 storage 통해.
  }

  readonly restartLockTime = params.restartLockTime;
}
