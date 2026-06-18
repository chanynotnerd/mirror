// src/game/config/params.ts
// PARAMS.xlsx 미러. 숫자를 바꿀 땐 이 파일과 PARAMS.xlsx를 같이 수정 (CLAUDE.md 규칙).
// 아래는 전부 초기값(가설) — 프로토타입에서 손맛 보며 조정.

export type InputMode = 'tap_jump' | 'hold_rise';
export type SkinUnlock = 'default' | 'coins' | 'rewarded_ad';

export interface DifficultyTier {
  from: number;          // 구간 시작 경과시간 (s) — 구간 사이는 코드에서 보간
  scrollSpeed: number;   // px/s
  spawnInterval: number; // s
  divergence: number;    // 0..1 (위·아래 갭 어긋남)
  gapHeight: number;     // px
}

export interface SkinDef {
  id: string;
  name: string;
  cost: number;          // 코인
  unlock: SkinUnlock;
}

export const params = {
  // --- Gameplay (물리·입력·점수) ---
  gravity: 2400,            // px/s^2
  jumpImpulse: 700,         // px/s, 탭 시 상승 속도 (parallel·inverted 공통 크기)
  maxFallSpeed: 1200,       // px/s
  playerRadius: 16,         // px
  playerXRatio: 0.2,        // 플레이어 x = 화면 너비 × 이 비율
  inputMode: 'tap_jump' as InputMode, // tap_jump | hold_rise (프로토타입서 확정)
  baseScrollSpeed: 200,     // px/s  (Difficulty tier0과 일치)
  baseSpawnInterval: 1.8,   // s
  baseGapHeight: 170,       // px
  perfectWindow: 24,        // px, 갭 중심 ±이 거리 내 통과 = 퍼펙트
  pointsPerPair: 1,
  comboStep: 0.5,           // 콤보 1단계당 배수 증가
  comboMaxMult: 4,          // 콤보 배수 상한
  restartLockTime: 0.3,     // s, 게임오버 후 입력 잠금

  // --- Rendering (렌더 풀 기술 상수 — 게임 밸런스 무관, PARAMS.xlsx 범위 외) ---
  maxObstaclesOnScreen: 8,  // shared value 풀 크기. 변경 시 useObstaclePool 슬롯 수도 맞춰야 함.
  obstacleWidth: 48,        // px, 장애물 너비

  // --- Difficulty (경과시간 구간별, 사이는 보간) ---
  difficultyTiers: [
    { from: 0,   scrollSpeed: 200, spawnInterval: 1.8,  divergence: 0,    gapHeight: 170 },
    { from: 10,  scrollSpeed: 230, spawnInterval: 1.6,  divergence: 0.25, gapHeight: 160 },
    { from: 25,  scrollSpeed: 260, spawnInterval: 1.4,  divergence: 0.45, gapHeight: 150 },
    { from: 45,  scrollSpeed: 290, spawnInterval: 1.25, divergence: 0.65, gapHeight: 145 },
    { from: 70,  scrollSpeed: 320, spawnInterval: 1.1,  divergence: 0.8,  gapHeight: 140 },
    { from: 100, scrollSpeed: 350, spawnInterval: 1.0,  divergence: 1,    gapHeight: 135 },
  ] as DifficultyTier[],

  // --- Economy (코인·메타·수익) ---
  coinSpawnChance: 0.35,    // 쌍당 코인 등장 확률 (xlsx 35% → 0.35)
  coinValue: 1,
  coinRiskBias: 0.7,        // 0..1, 위험 자리 우선 배치 강도
  invertedUnlockScore: 30,  // 인버티드 해금 점수
  interstitialEveryNDeaths: 4, // 전면 광고: 사망 N회당 1회
  rewardedReviveEnabled: true,
  reviveOncePerRun: true,
  iapRemoveAdsKRW: 3300,    // 광고 제거 IAP 가격(원)

  skins: [
    { id: 'default', name: '기본',     cost: 0,   unlock: 'default' },
    { id: 'neon_a',  name: '네온 블루', cost: 150, unlock: 'coins' },
    { id: 'neon_b',  name: '네온 핑크', cost: 300, unlock: 'coins' },
    { id: 'special', name: '스페셜',   cost: 0,   unlock: 'rewarded_ad' },
  ] as SkinDef[],
};

export type Params = typeof params;
