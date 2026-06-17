import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { storage } from '../services/storage';

export function GameOverScreen(props: {
  score: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const best = storage.getNumber('bestScore', 0);
  return (
    <View style={styles.root}>
      <Text style={styles.score}>{props.score}</Text>
      <Text style={styles.best}>best  {best}</Text>
      <View style={{ height: 36 }} />
      <Button label="다시하기" onPress={props.onRestart} />
      <View style={{ height: 12 }} />
      <Button label="메뉴" onPress={props.onMenu} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center' },
  score: { color: colors.text, fontSize: 64, fontWeight: '800' },
  best: { color: colors.textDim, fontSize: 16, marginTop: 8 },
});
