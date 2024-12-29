import { ErrorProvider } from '../contexts/ErrorContext';
import { NetworkProvider } from '../contexts/NetworkContext';
import { GameProvider } from '../contexts/GameContext';
import { SocketProvider } from '../contexts/SocketContext';
import { RoomProvider } from '../contexts/RoomContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import { PhysicsProvider } from '../contexts/PhysicsContext';
import ErrorBoundary from './ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <NetworkProvider>
          <SocketProvider>
            <RoomProvider>
              <GameProvider>
                <PlayerProvider>
                  <PhysicsProvider>
                    <GameBoard />
                  </PhysicsProvider>
                </PlayerProvider>
              </GameProvider>
            </RoomProvider>
          </SocketProvider>
        </NetworkProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
} 