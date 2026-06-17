import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TitleScreen } from './src/screens/TitleScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import type { GamePhase } from './src/game/types';

// 화면 3개 → 네비게이션 라이브러리 없이 state로 전환 (MENU/PLAYING/GAMEOVER).
export default function App() {
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [lastScore, setLastScore] = useState(0);

  return (
    <>
      <StatusBar style="light" />
      {phase === 'MENU' && <TitleScreen onPlay={() => setPhase('PLAYING')} />}
      {phase === 'PLAYING' && (
        <GameScreen onGameOver={(s) => { setLastScore(s); setPhase('GAMEOVER'); }} />
      )}
      {phase === 'GAMEOVER' && (
        <GameOverScreen
          score={lastScore}
          onRestart={() => setPhase('PLAYING')}
          onMenu={() => setPhase('MENU')}
        />
      )}
    </>
  );
}
