// ART_UX.md 컬러 토큰. (구조 추가: ART_UX 색을 한 곳에서 관리)
export const colors = {
  base: '#0E1117',
  surface: '#161C24',
  mirrorLine: '#2A313B',
  player: '#34E1C4',
  coin: '#FFC24B',
  combo: '#FF5C8A',
  obstacle: '#3D4654',
  danger: '#FF4D4D',
  text: '#F4F4EF',
  textDim: '#93958F',
};

// 스킨은 플레이어 색만 교체 (ART_UX §2)
export const skinColors: Record<string, string> = {
  default: '#34E1C4',
  neon_a: '#3D8BFF',
  neon_b: '#FF5C8A',
};
