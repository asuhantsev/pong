import React from 'react';
import { ErrorProvider } from '../contexts/ErrorContext';
import { GameProvider } from '../contexts/GameContext';
import { NetworkProvider } from '../contexts/NetworkContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MainMenu } from './menu/MainMenu';
import { ErrorBoundary } from './error/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <NetworkProvider>
          <SocketProvider>
            <GameProvider>
              <MainMenu />
            </GameProvider>
          </SocketProvider>
        </NetworkProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
} 