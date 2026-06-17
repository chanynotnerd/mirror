// 네이티브 모듈 래퍼. 프로토타입 단계: in-memory.
// TODO(dev build): react-native-mmkv로 교체. 호출부는 그대로 둠.
const mem: Record<string, unknown> = {};
export const storage = {
  getNumber: (k: string, d = 0) => (mem[k] as number) ?? d,
  setNumber: (k: string, v: number) => { mem[k] = v; },
  getBool: (k: string, d = false) => (mem[k] as boolean) ?? d,
  setBool: (k: string, v: boolean) => { mem[k] = v; },
  getString: (k: string, d = '') => (mem[k] as string) ?? d,
  setString: (k: string, v: string) => { mem[k] = v; },
};
