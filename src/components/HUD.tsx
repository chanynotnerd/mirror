import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// 게임 영역을 가리지 않게 상단 가장자리에만 (ART_UX §6).
export function HUD({ score, coins }: { score: number; coins: number }) {
  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.coins}>💰 {coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, alignItems: 'center',
  },
  score: { color: colors.text, fontSize: 28, fontWeight: '800' },
  coins: { color: colors.coin, fontSize: 16, fontWeight: '700' },
});
