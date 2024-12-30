import React from 'react';
import './styles/App.css';
import { ErrorProvider } from './contexts/ErrorContext';
import { GameProvider } from './contexts/GameContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SocketProvider } from './contexts/SocketContext';
import { MainMenu } from './components/menu/MainMenu';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { FeatureFlagPanel } from './components/dev/FeatureFlagPanel';

export default function App() {
  return (
    <FeatureFlagProvider>
      <ErrorBoundary>
        <ErrorProvider>
          <NetworkProvider>
            <SocketProvider>
              <GameProvider>
                <MainMenu />
                {import.meta.env.VITE_ENV === 'development' && <FeatureFlagPanel />}
              </GameProvider>
            </SocketProvider>
          </NetworkProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </FeatureFlagProvider>
  );
}
