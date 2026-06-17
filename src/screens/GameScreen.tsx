import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// TODO: GameEngine + 렌더러(초기 RN View, 이후 Skia) 연결. 지금은 플레이스홀더.
export function GameScreen({ onGameOver }: { onGameOver: (score: number) => void }) {
  return (
    <Pressable style={styles.root} onPress={() => onGameOver(0)}>
      <View style={styles.lane}><Text style={styles.hint}>위 레인</Text></View>
      <View style={styles.mirror} />
      <View style={styles.lane}><Text style={styles.hint}>아래 레인</Text></View>
      <Text style={styles.tapHint}>(스캐폴드) 탭 → 게임오버</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  lane: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mirror: { height: 2, backgroundColor: colors.mirrorLine },
  hint: { color: colors.textDim, fontSize: 14 },
  tapHint: { position: 'absolute', bottom: 40, alignSelf: 'center', color: colors.textDim, fontSize: 13 },
});
