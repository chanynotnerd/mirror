// TODO(dev build): react-native-google-mobile-ads (AdMob). 지금은 no-op.
import { params } from '../game/config/params';
export const ads = {
  // 사망 N회당 1회. adsRemoved면 호출부에서 스킵.
  maybeShowInterstitial: (deaths: number) => {
    if (deaths > 0 && deaths % params.interstitialEveryNDeaths === 0) {
      // TODO: 전면 광고 표시
    }
  },
  showRewarded: async (): Promise<boolean> => false, // 보상 시청 완료 여부
};
