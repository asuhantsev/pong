import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainMenu } from './components/menu/MainMenu';
import { GameBoard } from './components/game/GameBoard';
import { MultiplayerMenu } from './components/menu/MultiplayerMenu';
import { OptionsMenu } from './components/menu/OptionsMenu';
import { GameProvider } from './contexts/GameContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { MultiplayerProvider } from './contexts/MultiplayerContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { RoomProvider } from './contexts/RoomContext';
import { SoundProvider } from './contexts/SoundContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { SocketProvider } from './contexts/SocketContext';
import { StoreProvider } from './store/store';
import { MonitoringOverlay } from './components/dev/MonitoringOverlay';
import { ThemeToggle } from './components/shared/ThemeToggle';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import styles from './styles/components/App.module.css';
import { layout } from './styles/shared';

// Wrapper component for room-related providers
const RoomProviders = ({ children }) => (
  <ErrorBoundary>
    <RoomProvider>
      {children}
    </RoomProvider>
  </ErrorBoundary>
);

// Wrapper component for game-related providers
const GameProviders = ({ children }) => (
  <ErrorBoundary>
    <GameProvider>
      {children}
    </GameProvider>
  </ErrorBoundary>
);

export function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ErrorProvider>
          <ThemeProvider>
            <FeatureFlagProvider>
              <SoundProvider>
                <Router basename={import.meta.env.BASE_URL}>
                  <SocketProvider>
                    <PlayerProvider>
                      <MultiplayerProvider>
                        <div className={`${styles.app} ${layout.fullScreen}`}>
                          <Routes>
                            <Route path="/" element={<MainMenu />} />
                            <Route 
                              path="/game" 
                              element={
                                <GameProviders>
                                  <GameBoard />
                                </GameProviders>
                              } 
                            />
                            <Route 
                              path="/multiplayer" 
                              element={
                                <RoomProviders>
                                  <MultiplayerMenu />
                                </RoomProviders>
                              } 
                            />
                            <Route path="/options" element={<OptionsMenu />} />
                            <Route path="*" element={<Navigate to="/" />} />
                          </Routes>
                          <ThemeToggle />
                          {import.meta.env.DEV && <MonitoringOverlay />}
                        </div>
                      </MultiplayerProvider>
                    </PlayerProvider>
                  </SocketProvider>
                </Router>
              </SoundProvider>
            </FeatureFlagProvider>
          </ThemeProvider>
        </ErrorProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
