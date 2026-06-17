# Mirror *(가제)* — 기술 명세서 (SPEC)

> "어떻게 만들지"를 정의하는 문서. 게임 규칙·재미는 `GDD.md`, 튜닝 숫자는 `PARAMS.xlsx` 참조.
> 라이브러리 버전은 빌드 시점에 최신으로 재확인 전제.

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **Expo (React Native)** | 1인 개발 + Claude Code, EAS로 양 스토어 빌드 |
| 언어 | **TypeScript** | 타입 안정성, AI 생성 코드 검증 용이 |
| 렌더링 | **@shopify/react-native-skia** | 캔버스 기반 2D, 파티클·도형 고성능 |
| 게임 루프/애니메이션 | **react-native-reanimated** | UI 스레드 60fps, Skia와 연동 |
| 저장 | **react-native-mmkv** | 동기·고속 key-value (하이스코어/코인) |
| 사운드 | **expo-audio** | 효과음 재생 |
| 햅틱 | **expo-haptics** | 통과/충돌 피드백 |
| 광고 | **react-native-google-mobile-ads** | AdMob 전면·보상형 |
| 결제(IAP) | **RevenueCat (react-native-purchases)** | 양 스토어 광고 제거 IAP 통합 관리 |

> **중요:** Skia · MMKV · AdMob · IAP는 네이티브 모듈이라 **Expo Go에서 안 돌아감**. 핵심 게임플레이는 Expo Go로 빠르게 개발하되, 광고·결제 단계부터는 **EAS Development Build**(dev client)로 전환해야 함. 렌더링에 Skia를 쓰면 dev build가 처음부터 필요하니, 초기 프로토타입만 RN View/SVG로 검증 후 Skia로 옮기는 것도 한 방법.

## 2. 프로젝트 구조

```
/src
  /game
    GameEngine.ts        # 루프 + 상태 머신 (menu/playing/gameover)
    /entities
      Player.ts          # 단일 캐릭터 (위치/속도/레인)
      ObstaclePair.ts    # 위·아래 한 쌍
      Coin.ts
    /systems
      spawner.ts         # 장애물·코인 생성 (패턴/divergence)
      collision.ts       # AABB 충돌 판정
      difficulty.ts      # 경과/점수 → 속도·간격·divergence
      scoring.ts         # 점수·콤보·퍼펙트 판정
    /config
      params.ts          # PARAMS.xlsx에서 옮긴 튜닝 상수
  /screens
    TitleScreen.tsx
    GameScreen.tsx       # Skia Canvas + 입력 핸들러 + HUD
    GameOverScreen.tsx
  /components
    HUD.tsx  Button.tsx  SkinPicker.tsx
  /services
    storage.ts  ads.ts  iap.ts  audio.ts  haptics.ts
  /assets
    /sounds  /fonts
App.tsx                  # 네비게이션 + 전역 프로바이더
```

## 3. 게임 루프 구조

Reanimated의 `useFrameCallback`(또는 Skia clock)으로 매 프레임 `dt`(델타타임)를 받아 **update → render** 순으로 처리. 모든 위치 갱신은 `dt` 기반이라 프레임레이트와 무관하게 일정한 속도 유지.

```
onFrame(dt):
  if state != PLAYING: return
  elapsed += dt
  speed = difficulty.scrollSpeed(elapsed)        # PARAMS

  # 1. 입력 소비 (이번 프레임에 탭이 있었나)
  if tappedThisFrame:
    parallel  -> topPlayer.jump();  bottomPlayer.jump()
    inverted  -> topPlayer.jump();  bottomPlayer.jumpDown()

  # 2. 플레이어 물리 (레인 경계 클램프)
  for p in [topPlayer, bottomPlayer]:
    p.vy += gravity * dt
    p.y  += p.vy * dt
    clampToLane(p)

  # 3. 월드 스크롤
  for e in obstacles + coins: e.x -= speed * dt

  # 4. 스폰
  if timeSinceSpawn > difficulty.spawnInterval(elapsed):
    spawnObstaclePair(divergence = difficulty.divergence(elapsed))
    maybeSpawnCoin()                              # 위험 자리 우선

  # 5. 충돌 (레인별 AABB)
  for p in players:
    if collides(p, obstaclesInLane(p)): -> gameOver()

  # 6. 점수 / 코인
  for pair in obstacles where pair.passed(playerX) and not pair.scored:
    score += 1; pair.scored = true
    if perfectWindow(topPlayer, bottomPlayer): combo++  else combo = 0
  for c in coins where pickedUp(player, c): coins++; c.remove()

  # 7. 컬링 (화면 밖 제거)
  cull(obstacles, coins)
```

## 4. 핵심 시스템

### 4.1 상태 머신
`MENU → PLAYING → GAMEOVER → (재시작) PLAYING`. 전이 시 입력 잠금 0.3초로 오입력 방지.

### 4.2 두 플레이어 연동
입력은 단 하나. `mode`(parallel/inverted)에 따라 두 `Player`에 동일/반대 임펄스 적용. 각 플레이어는 자기 레인 경계 안에서만 이동.

### 4.3 장애물 스포너 — *게임의 핵심*
한 번에 위·아래 **한 쌍**을 생성. 각 레인의 갭 중심 `gapCenter`를 잡는데, **divergence** 값으로 위·아래 갭이 얼마나 어긋날지 제어:
- `divergence ≈ 0`: 아래 갭이 위 갭과 거의 정렬 → 탭 한 번에 둘 다 안전 (쉬움).
- `divergence → 1`: 위·아래 갭 위치 독립 랜덤 → "위는 가야 하는데 아래는 멈춰야 하는" 충돌 상황 빈발 (어려움).
- divergence는 `difficulty` 시스템이 경과시간에 따라 0 → 상한까지 끌어올림.

### 4.4 충돌 판정
도형이 원·사각이라 **AABB**(축 정렬 박스)면 충분. 각 플레이어는 *자기 레인의* 장애물만 검사.

### 4.5 난이도 매니저
`elapsed`(또는 score) 입력 → `scrollSpeed`, `spawnInterval`, `divergence` 출력. 전부 `PARAMS.xlsx`의 곡선 값을 보간. 원칙: **속도는 완만히, divergence는 빠르게.**

### 4.6 점수·콤보
통과한 쌍마다 +1. "퍼펙트"(두 플레이어 모두 갭 중심 근처 통과) 시 콤보 증가 → 점수 배수·사운드 음정 상승.

### 4.7 코인
`spawner`가 의도적으로 "위험 자리"(divergence 큰 쌍의 한쪽 갭 가장자리)에 배치. 획득 시 메타 코인 +1, 런 종료 후 `storage`에 누적 저장.

### 4.8 손맛 레이어 (별도 모듈)
이벤트 버스로 통과/퍼펙트/충돌/코인 이벤트를 받아 `haptics` + `audio` + 파티클 + 화면 흔들림 + 슬로우모션 트리거. 게임 로직과 분리해 튜닝 자유롭게.

## 5. 저장 데이터 모델 (MMKV)

| 키 | 타입 | 설명 |
|----|------|------|
| `bestScore` | number | 최고 점수 |
| `coins` | number | 누적 코인 |
| `invertedUnlocked` | boolean | 인버티드 해금 여부 |
| `selectedSkin` | string | 현재 스킨 id |
| `ownedSkins` | string[] | 보유 스킨 |
| `adsRemoved` | boolean | 광고 제거 IAP 여부 |
| `settings` | object | 사운드/햅틱 on-off |

## 6. 광고 / 결제 연동 지점
- **전면 광고:** 게임오버 N회마다 1회 (PARAMS). `adsRemoved`면 스킵.
- **보상형 광고:** 이어하기, 코인/스킨 해금 시 호출.
- **IAP:** 광고 제거 1회 결제. RevenueCat로 구매·복원 처리.
- 모두 `services/`에 격리해 게임 코어와 분리.

## 7. 빌드 & 배포
1. 개발: 핵심 루프는 Expo Go(또는 dev build)로 반복.
2. **EAS Development Build**: 네이티브 모듈(Skia/광고/IAP) 포함 dev client 생성.
3. **EAS Build**: 스토어 제출용 `.aab`(Android) / `.ipa`(iOS) 클라우드 빌드.
4. **EAS Submit**: 스토어 업로드.
5. 계정·등록·심사 제출은 **수동**(구글 $25 1회 / 애플 연 $99) — 코드 영역 아님.

## 8. 프로토타입에서 결정할 항목
- 입력 형태: 누르는 동안 상승 vs 단발 점프 (둘 다 만들어 손맛 비교).
- 렌더링: 초기 RN View/SVG vs 처음부터 Skia.
- 중력/임펄스 곡선 체감 (PARAMS 초기값 검증).
- 퍼펙트 판정 윈도우 폭.

---
*상태: 초안 v0.1 · 최종 수정: 2026-06-16*
