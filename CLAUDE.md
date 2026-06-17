# CLAUDE.md

## Project: Mirror (working title)

One-tap reflex arcade game. A single tap moves **two mirrored players at once** (a top
lane and a bottom lane). The player must clear an obstacle gap in **both lanes
simultaneously**. Endless, score-chasing, instant-restart.

- Platform: iOS + Android, **portrait only**
- Built with: **Expo (React Native)**
- Goal: ship to the App Store + Google Play
- Current stage: **prototype** — core game loop not yet implemented

---

## Source of truth

These documents are authoritative. **Do not write code that contradicts them.** When
unsure, read them before coding.

| Doc | Governs |
|-----|---------|
| `GDD.md` | game rules, scoring, modes, coin economy |
| `PARAMS.xlsx` | all tunable numbers — mirrored in `src/game/config/params.ts` |
| `ART_UX.md` | color hex tokens, screen layout, juice / feedback spec |
| `CONCEPT.md` | scope boundary (MVP vs v1.1) |

Rules:
- If code would conflict with a doc, **stop and flag it** instead of guessing.
- If a number should be tunable but isn't in `params.ts`, **add it there** — never inline a magic number.
- If you change a game rule or value, **update the matching doc in the same change**.

---

## Tech stack (locked — ask before changing)

| Area | Library |
|------|---------|
| Language | TypeScript (`strict: true`) |
| Framework | Expo (React Native) |
| Rendering | `@shopify/react-native-skia` |
| Animation / game loop | `react-native-reanimated` |
| Persistence | `react-native-mmkv` |
| Ads | `react-native-google-mobile-ads` (AdMob) |
| IAP | `react-native-purchases` (RevenueCat) |

**Do not add new dependencies or swap libraries without asking first.**

---

## Project structure

```
src/
  game/
    GameEngine.ts        # loop + state machine (menu / playing / gameover)
    entities/            # Player, ObstaclePair, Coin
    systems/             # spawner, collision, difficulty, scoring
    config/params.ts     # ALL tunable constants (mirror of PARAMS.xlsx)
  screens/               # TitleScreen, GameScreen, GameOverScreen
  components/            # HUD, Button, SkinPicker
  services/              # storage, ads, iap, audio, haptics  (native modules ONLY here)
  assets/                # sounds, fonts
App.tsx
```

Placement rules:
- New game logic → `src/game/systems` or `src/game/entities`
- New screen → `src/screens`
- Any native-module integration → `src/services` **only**
- Any tunable number → `src/game/config/params.ts`

---

## Commands

```bash
npm start                 # Expo dev server
npm run typecheck         # tsc --noEmit   (MUST pass before marking work done)
npm run lint              # eslint
npm test                  # jest unit tests for src/game logic
eas build --profile development --platform ios      # dev client (needed for native modules)
eas build --profile production --platform android   # store build
```

---

## Architecture rules

- The game loop runs **per frame with a delta time `dt`**. ALL movement is `dt`-based:
  - ✅ `entity.x -= speed * dt`
  - ❌ `entity.x -= 4`  (frame-rate dependent)
- `src/game/**` is **pure logic**: it must NOT import React, Skia, or any native module.
  It is unit-testable in isolation. The rendering layer reads game state and draws it.
- Native modules (storage, ads, iap, audio, haptics) live **behind `src/services/*`
  wrappers**. Game and screen code call the wrapper, never the native lib directly.
- State machine: `MENU → PLAYING → GAMEOVER → (restart) PLAYING`.
  Lock input for `params.restartLockTime` on every transition.

---

## Tunable values

Never hardcode gameplay numbers. Read them from `params.ts`, which mirrors `PARAMS.xlsx`.

```ts
// ❌ Wrong
if (score >= 30) unlockInverted();

// ✅ Right
if (score >= params.invertedUnlockScore) unlockInverted();
```

If you introduce a new gameplay number, add it to `params.ts` (and note it for
`PARAMS.xlsx`) rather than inlining it.

---

## Constraints & gotchas

- **Expo Go CANNOT run Skia, AdMob, RevenueCat, or MMKV.** Anything touching these
  requires an EAS **development build** (dev client), not Expo Go.
- **Target 60fps.** Keep per-frame work minimal; profile if it grows.
- **Portrait only** — lock orientation.
- Game logic and rendering must stay separable (see Architecture rules).
- **Do NOT build v1.1 features** (daily challenge, leaderboard, extra themes).
  See `CONCEPT.md` scope.

---

## Quality bar (feel first)

The differentiator is **feel, not feature count**. Treat these as part of "done":
- Responsive input — no perceptible tap latency.
- The juice spec in `ART_UX.md` (haptics, sound, particles, screen shake, slow-mo) is
  required, not polish-for-later.
- Instant restart (under ~0.5s) from the game-over screen.

---

## Workflow

- For any change spanning more than one file or adding a system, **propose a short plan
  first**, then implement.
- Before declaring a task done: `npm run typecheck` and `npm run lint` must pass, and
  state **how you verified** the change.
- Keep commits small and focused.
- Update the relevant doc whenever you change a rule or a number.

---

## Do not

- Add dependencies or change the stack without asking.
- Hardcode tunable numbers (use `params.ts`).
- Write code that contradicts `GDD` / `PARAMS` / `ART_UX` / `CONCEPT`.
- Import native modules outside `src/services`.
- Implement out-of-scope (v1.1) features.
