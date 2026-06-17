import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.surface,
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, borderWidth: 1, borderColor: colors.mirrorLine,
    minWidth: 180, alignItems: 'center',
  },
  pressed: { transform: [{ scale: 0.96 }] }, // ART_UX: 버튼 탭 0.96 눌림
  label: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
