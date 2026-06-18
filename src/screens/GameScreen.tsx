import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { GameEngine } from '../game/GameEngine';
import { LaneLayout } from '../game/systems/spawner';
import { params } from '../game/config/params';
import { colors } from '../theme/colors';

const MIRROR_H = 2; // px — StyleSheet mirror height와 일치

// ---------------------------------------------------------------------------
// Shared value pool (장애물 60fps 렌더용 — React setState 없이 위치 갱신)
// ---------------------------------------------------------------------------

type SlotSV = {
  x:   SharedValue<number>; // 장애물 왼쪽 엣지 x
  tgc: SharedValue<number>; // top gap center
  bgc: SharedValue<number>; // bottom gap center
  gh:  SharedValue<number>; // gap height (위·아래 동일)
  vis: SharedValue<number>; // 1 = 활성, 0 = 숨김
};

// 슬롯 수 = params.maxObstaclesOnScreen(8) — 변경 시 아래 선언도 같이 수정.
function useObstaclePool(): SlotSV[] {
  const x0=useSharedValue(-1000),tgc0=useSharedValue(0),bgc0=useSharedValue(0),gh0=useSharedValue(170),vis0=useSharedValue(0);
  const x1=useSharedValue(-1000),tgc1=useSharedValue(0),bgc1=useSharedValue(0),gh1=useSharedValue(170),vis1=useSharedValue(0);
  const x2=useSharedValue(-1000),tgc2=useSharedValue(0),bgc2=useSharedValue(0),gh2=useSharedValue(170),vis2=useSharedValue(0);
  const x3=useSharedValue(-1000),tgc3=useSharedValue(0),bgc3=useSharedValue(0),gh3=useSharedValue(170),vis3=useSharedValue(0);
  const x4=useSharedValue(-1000),tgc4=useSharedValue(0),bgc4=useSharedValue(0),gh4=useSharedValue(170),vis4=useSharedValue(0);
  const x5=useSharedValue(-1000),tgc5=useSharedValue(0),bgc5=useSharedValue(0),gh5=useSharedValue(170),vis5=useSharedValue(0);
  const x6=useSharedValue(-1000),tgc6=useSharedValue(0),bgc6=useSharedValue(0),gh6=useSharedValue(170),vis6=useSharedValue(0);
  const x7=useSharedValue(-1000),tgc7=useSharedValue(0),bgc7=useSharedValue(0),gh7=useSharedValue(170),vis7=useSharedValue(0);
  return useMemo(() => [
    { x: x0, tgc: tgc0, bgc: bgc0, gh: gh0, vis: vis0 },
    { x: x1, tgc: tgc1, bgc: bgc1, gh: gh1, vis: vis1 },
    { x: x2, tgc: tgc2, bgc: bgc2, gh: gh2, vis: vis2 },
    { x: x3, tgc: tgc3, bgc: bgc3, gh: gh3, vis: vis3 },
    { x: x4, tgc: tgc4, bgc: bgc4, gh: gh4, vis: vis4 },
    { x: x5, tgc: tgc5, bgc: bgc5, gh: gh5, vis: vis5 },
    { x: x6, tgc: tgc6, bgc: bgc6, gh: gh6, vis: vis6 },
    { x: x7, tgc: tgc7, bgc: bgc7, gh: gh7, vis: vis7 },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ---------------------------------------------------------------------------
// ObstacleSlot — 장애물 쌍 1개를 4개 Animated.View(레인×블록)로 렌더
// 프롭은 전부 primitive — worklet 클로저로 안전하게 캡처됨.
// ---------------------------------------------------------------------------

function ObstacleSlot({ sv, topLaneTop, topLaneBottom, bottomLaneTop, bottomLaneBottom, obsWidth }: {
  sv: SlotSV;
  topLaneTop:    number;
  topLaneBottom: number;
  bottomLaneTop:    number;
  bottomLaneBottom: number;
  obsWidth: number;
}) {
  // 위 레인 갭 위 블록
  const topAbove = useAnimatedStyle(() => ({
    left:   sv.x.value,
    top:    topLaneTop,
    width:  sv.vis.value ? obsWidth : 0,
    height: sv.vis.value ? Math.max(0, sv.tgc.value - sv.gh.value / 2 - topLaneTop) : 0,
  }));

  // 위 레인 갭 아래 블록
  const topBelow = useAnimatedStyle(() => {
    const gapBottom = sv.tgc.value + sv.gh.value / 2;
    return {
      left:   sv.x.value,
      top:    gapBottom,
      width:  sv.vis.value ? obsWidth : 0,
      height: sv.vis.value ? Math.max(0, topLaneBottom - gapBottom) : 0,
    };
  });

  // 아래 레인 갭 위 블록
  const bottomAbove = useAnimatedStyle(() => ({
    left:   sv.x.value,
    top:    bottomLaneTop,
    width:  sv.vis.value ? obsWidth : 0,
    height: sv.vis.value ? Math.max(0, sv.bgc.value - sv.gh.value / 2 - bottomLaneTop) : 0,
  }));

  // 아래 레인 갭 아래 블록
  const bottomBelow = useAnimatedStyle(() => {
    const gapBottom = sv.bgc.value + sv.gh.value / 2;
    return {
      left:   sv.x.value,
      top:    gapBottom,
      width:  sv.vis.value ? obsWidth : 0,
      height: sv.vis.value ? Math.max(0, bottomLaneBottom - gapBottom) : 0,
    };
  });

  return (
    <>
      <Animated.View style={[styles.obstacle, topAbove]} />
      <Animated.View style={[styles.obstacle, topBelow]} />
      <Animated.View style={[styles.obstacle, bottomAbove]} />
      <Animated.View style={[styles.obstacle, bottomBelow]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// GameScreen
// ---------------------------------------------------------------------------

export function GameScreen({ onGameOver }: { onGameOver: (score: number) => void }) {
  const { width, height } = useWindowDimensions();

  const laneH      = (height - MIRROR_H) / 2;
  const topLane    = { top: 0,               bottom: laneH };
  const bottomLane = { top: laneH + MIRROR_H, bottom: height };

  const layout: LaneLayout = {
    top:          topLane,
    bottom:       bottomLane,
    spawnX:       width + 80,
    obstacleWidth: params.obstacleWidth,
  };

  // 엔진 lazy init — 첫 렌더에만 생성
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new GameEngine(layout);
    engineRef.current.start('parallel');
  }
  const engine = engineRef.current;

  const pendingTap = useRef(false);

  // 점수 HUD — 변화 시만 setState (초당 1~2회)
  const [displayScore, setDisplayScore] = useState(0);
  const prevScoreRef = useRef(0);

  // 플레이어 위치 shared value
  const topY    = useSharedValue(engine.topPlayer.y);
  const bottomY = useSharedValue(engine.bottomPlayer.y);

  // 장애물 풀 (params.maxObstaclesOnScreen = 8 슬롯)
  const pool = useObstaclePool();

  const playerX  = width * params.playerXRatio;
  const radius   = params.playerRadius;
  const diameter = radius * 2;

  // JS 스레드 rAF 루프
  useEffect(() => {
    let rafId: number;
    let lastTime: number | null = null;

    function tick(now: number) {
      const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      engine.onFrame(dt, { tapped: pendingTap.current });
      pendingTap.current = false;

      // 게임오버 감지 — return으로 다음 rAF 예약 없이 루프 종료
      if (engine.phase === 'GAMEOVER') {
        onGameOver(engine.score);
        return;
      }

      // 플레이어 위치 갱신
      topY.value    = engine.topPlayer.y;
      bottomY.value = engine.bottomPlayer.y;

      // 점수 HUD — 변했을 때만 setState
      if (engine.score !== prevScoreRef.current) {
        prevScoreRef.current = engine.score;
        setDisplayScore(engine.score);
      }

      // 장애물 → 풀 슬롯 매핑 (최대 maxObstaclesOnScreen)
      const obs = engine.obstacles;
      for (let i = 0; i < params.maxObstaclesOnScreen; i++) {
        if (i < obs.length) {
          pool[i].x.value   = obs[i].x;
          pool[i].tgc.value = obs[i].top.gapCenter;
          pool[i].bgc.value = obs[i].bottom.gapCenter;
          pool[i].gh.value  = obs[i].top.gapHeight;
          pool[i].vis.value = 1;
        } else {
          pool[i].vis.value = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const topStyle = useAnimatedStyle(() => ({
    top: topY.value - radius,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    top: bottomY.value - radius,
  }));

  return (
    <Pressable style={styles.root} onPress={() => { pendingTap.current = true; }}>
      {/* 장애물 슬롯 (플레이어 뒤에 먼저 렌더) */}
      {pool.map((sv, i) => (
        <ObstacleSlot
          key={i}
          sv={sv}
          topLaneTop={topLane.top}
          topLaneBottom={topLane.bottom}
          bottomLaneTop={bottomLane.top}
          bottomLaneBottom={bottomLane.bottom}
          obsWidth={params.obstacleWidth}
        />
      ))}
      {/* 위 플레이어 원 */}
      <Animated.View
        style={[styles.player, { left: playerX - radius, width: diameter, height: diameter, borderRadius: radius }, topStyle]}
      />
      {/* 아래 플레이어 원 */}
      <Animated.View
        style={[styles.player, { left: playerX - radius, width: diameter, height: diameter, borderRadius: radius }, bottomStyle]}
      />
      {/* 미러 라인 */}
      <View style={[styles.mirror, { top: laneH }]} />
      {/* 점수 HUD — 상단 중앙, 터치 통과 */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.scoreText}>{displayScore}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.base },
  player:   { position: 'absolute', backgroundColor: colors.player },
  obstacle: { position: 'absolute', backgroundColor: colors.obstacle },
  mirror:    { position: 'absolute', left: 0, right: 0, height: MIRROR_H, backgroundColor: colors.mirrorLine },
  hud:       { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center' },
  scoreText: { color: colors.text, fontSize: 32, fontWeight: '800' },
});
