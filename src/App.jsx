import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainMenu } from './components/menu/MainMenu';
import { GameBoard } from './components/game/GameBoard';
import { MultiplayerMenu } from './components/menu/MultiplayerMenu';
import { OptionsMenu } from './components/menu/OptionsMenu';
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
    <Router basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <FeatureFlagProvider>
          <MultiplayerProvider>
            <div className={`${styles.app} ${layout.flexColumn}`}>
              <ThemeToggle />
              <Routes>
                <Route path="/" element={state.isGameStarted ? <GameBoard /> : <MainMenu />} />
                <Route path="/multiplayer" element={<MultiplayerMenu />} />
                <Route path="/options" element={<OptionsMenu />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <MonitoringOverlay />
            </div>
          </MultiplayerProvider>
        </FeatureFlagProvider>
      </ThemeProvider>
    </Router>
  );
}
