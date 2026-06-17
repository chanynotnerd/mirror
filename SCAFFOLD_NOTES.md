# Mirror — 스캐폴드 메모

`create-expo-app@latest . --template blank-typescript`로 만든 프로젝트에
이 `src/`와 `App.tsx`를 그대로 덮어쓰면 됨. 추가 설치 없이 Expo Go에서 실행됨
(네이티브 모듈은 아직 안 씀).

## 적용 순서
1. `npx create-expo-app@latest . --template blank-typescript`
2. 생성된 `App.tsx`를 이 `App.tsx`로 교체, `src/` 폴더 복사
3. `tsconfig.json`에 `"strict": true` 확인 (CLAUDE.md 요구)
4. `npx expo start` → 폰 Expo Go로 QR 스캔
   → 타이틀(MIRROR/PLAY) → 게임 플레이스홀더(탭 시 게임오버) → 게임오버(다시하기/메뉴) 흐름 확인

## 구현됨 (그대로 써도 됨)
- `game/config/params.ts` — PARAMS.xlsx 전 항목 미러
- `game/entities/*` — Player(dt 물리·레인 클램프), ObstaclePair, Coin
- `game/systems/difficulty.ts` — 구간 보간
- `game/systems/collision.ts` — 레인별 AABB
- `game/systems/scoring.ts` — 퍼펙트 판정·콤보 배수
- 화면 3개 + Button/HUD + App.tsx state 머신

## 스텁 (다음 단계, 계획 먼저 제안 후 구현 — CLAUDE.md 워크플로)
- `game/GameEngine.ts` — onFrame 루프 2~7단계 본 구현
- `game/systems/spawner.ts` — divergence 매핑/코인 위험 자리(coinRiskBias) 배치 ※게임의 핵심
- `screens/GameScreen.tsx` — GameEngine + 렌더러(초기 RN View → 이후 Skia) 연결
- `services/*` — 지금은 in-memory/no-op. dev build 단계에서 MMKV/AdMob/RevenueCat/expo-audio/expo-haptics로 교체

## 추가 설치(이번 스캐폴드엔 불필요, 이후 단계)
- 핵심 루프 애니메이션: `npx expo install react-native-reanimated`
- 렌더링: `@shopify/react-native-skia`  → 이때부터 EAS dev build 필요(Expo Go 불가)
- 저장/광고/결제: mmkv / google-mobile-ads / react-native-purchases → dev build
- (의존성 추가는 CLAUDE.md상 "먼저 물어보기" 대상)

## ⚠ 문서 불일치 1건 (확인 필요)
PARAMS.xlsx에서 `baseScrollSpeed = 220`(Gameplay)인데 Difficulty tier0 `scrollSpeed = 200`임.
난이도 곡선이 시간당 속도의 출처라면 tier0=200이 실효값이고 baseScrollSpeed 220은
미사용/오기일 수 있음. 어느 쪽이 맞는지 정해서 xlsx와 params.ts를 일치시키는 게 좋음.
(스캐폴드는 일단 두 값 다 문서대로 보존해 둠.)

## 구조에 추가한 것
- `src/theme/colors.ts` — ART_UX 색 토큰을 한 곳에. (CLAUDE.md 구조엔 없던 폴더 — 괜찮으면 유지)
