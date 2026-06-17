import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { storage } from '../services/storage';

export function TitleScreen({ onPlay }: { onPlay: () => void }) {
  const best = storage.getNumber('bestScore', 0);
  const coins = storage.getNumber('coins', 0);
  return (
    <View style={styles.root}>
      <Text style={styles.coins}>💰 {coins}</Text>
      <View style={styles.center}>
        <Text style={styles.logo}>MIRROR</Text>
        <Text style={styles.best}>best  {best}</Text>
        <View style={{ height: 36 }} />
        <Button label="PLAY ▶" onPress={onPlay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base, paddingTop: 56, paddingHorizontal: 24 },
  coins: { color: colors.coin, alignSelf: 'flex-end', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { color: colors.player, fontSize: 48, fontWeight: '800', letterSpacing: 4 },
  best: { color: colors.textDim, fontSize: 16, marginTop: 8 },
});
