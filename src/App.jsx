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
import { MonitoringOverlay } from './components/dev/MonitoringOverlay';
import { StoreProvider } from './store/store.jsx';

export default function App() {
  return (
    <StoreProvider>
      <FeatureFlagProvider>
        <ErrorBoundary>
          <ErrorProvider>
            <NetworkProvider>
              <SocketProvider>
                <GameProvider>
                  <MainMenu />
                  {import.meta.env.VITE_ENV === 'development' && (
                    <>
                      <FeatureFlagPanel />
                      <MonitoringOverlay />
                    </>
                  )}
                </GameProvider>
              </SocketProvider>
            </NetworkProvider>
          </ErrorProvider>
        </ErrorBoundary>
      </FeatureFlagProvider>
    </StoreProvider>
  );
}
