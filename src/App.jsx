import { useEffect } from 'react';
import { MainMenu } from './components/menu/MainMenu';
import { GameBoard } from './components/game/GameBoard';
import { useGame } from './contexts/GameContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { MultiplayerProvider } from './contexts/MultiplayerContext';
import { MonitoringOverlay } from './components/dev/MonitoringOverlay';
import { ThemeToggle } from './components/shared/ThemeToggle';
import styles from './styles/components/App.module.css';
import { layout } from './styles/shared';

export function App() {
  const { state } = useGame();

  return (
    <ThemeProvider>
      <FeatureFlagProvider>
        <MultiplayerProvider>
          <div className={`${styles.app} ${layout.flexColumn}`}>
            <ThemeToggle />
            {state.isGameStarted ? <GameBoard /> : <MainMenu />}
            <MonitoringOverlay />
          </div>
        </MultiplayerProvider>
      </FeatureFlagProvider>
    </ThemeProvider>
  );
}
